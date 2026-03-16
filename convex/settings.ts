import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  DEFAULT_REQUEST_SETTINGS,
  buildPolicySnapshot,
  ensure,
  ensureAdmin,
  findMatchedPolicy,
  getCurrentPolicyVersion,
  getRequestSettingsForCompany,
  loadViewer,
  nowIso,
  parseJson,
  serializeJson,
} from "./lib/workflow";

const roleValue = v.union(
  v.literal("Admin"),
  v.literal("Supervisor"),
  v.literal("Head of Ops"),
  v.literal("CFO"),
  v.literal("CEO"),
  v.literal("MD"),
  v.literal("Finance"),
  v.literal("Team Lead"),
  v.literal("Ops Manager"),
);

const requestIdModeValue = v.union(
  v.literal("company_tag"),
  v.literal("generic"),
);

const roleAssignmentInput = v.object({
  companyId: v.id("companies"),
  role: roleValue,
  active: v.optional(v.boolean()),
});

const policyInput = {
  companyId: v.id("companies"),
  name: v.string(),
  category: v.string(),
  minAmount: v.number(),
  maxAmount: v.number(),
  active: v.boolean(),
  businessSteps: v.array(roleValue),
  requiresFinanceDisbursement: v.boolean(),
  requiredQuotes: v.number(),
  quoteRuleLabel: v.optional(v.string()),
  requireJustificationIfNotLowest: v.boolean(),
  allowSingleSourceException: v.boolean(),
  allowDrafts: v.optional(v.boolean()),
  allowRecall: v.optional(v.boolean()),
  allowResubmission: v.optional(v.boolean()),
};

async function insertSettingsAudit(
  ctx: MutationCtx,
  args: {
    module: string;
    entityType: string;
    entityId: string;
    action: string;
    changedByUserId: Id<"users">;
    summary?: string;
    oldValue?: unknown;
    newValue?: unknown;
  },
) {
  await ctx.db.insert("settingsAuditLog", {
    module: args.module,
    entityType: args.entityType,
    entityId: args.entityId,
    action: args.action,
    changedByUserId: args.changedByUserId,
    oldValueJson:
      args.oldValue === undefined ? undefined : serializeJson(args.oldValue),
    newValueJson:
      args.newValue === undefined ? undefined : serializeJson(args.newValue),
    summary: args.summary,
    createdAt: nowIso(),
  });
}

async function hydratePolicies(ctx: QueryCtx, companyId?: Id<"companies">) {
  const policies = companyId
    ? await ctx.db
        .query("policies")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect()
    : await ctx.db.query("policies").collect();

  return await Promise.all(
    policies.map(async (policy) => {
      const currentVersion = await getCurrentPolicyVersion(
        ctx,
        policy._id,
        policy.currentVersion,
      );

      return {
        ...policy,
        businessSteps: currentVersion?.businessSteps ?? [],
        requiresFinanceDisbursement:
          currentVersion?.requiresFinanceDisbursement ?? true,
        requiredQuotes: currentVersion?.requiredQuotes ?? 0,
        quoteRuleLabel: currentVersion?.quoteRuleLabel ?? "",
        requireJustificationIfNotLowest:
          currentVersion?.requireJustificationIfNotLowest ?? false,
        allowSingleSourceException:
          currentVersion?.allowSingleSourceException ?? false,
        allowDrafts: currentVersion?.allowDrafts ?? false,
        allowRecall: currentVersion?.allowRecall ?? true,
        allowResubmission: currentVersion?.allowResubmission ?? true,
      };
    }),
  );
}

export const getCompanies = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const companies = await ctx.db.query("companies").collect();

    return viewer.isAdmin
      ? companies
      : companies.filter((company) => viewer.companyIds.includes(company._id));
  },
});

export const resolveDemoUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    const assignments = await ctx.db
      .query("userCompanyRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const companies = await Promise.all(
      assignments.map((assignment) => ctx.db.get(assignment.companyId)),
    );

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      active: user.active,
      assignments: assignments.map((assignment, index) => ({
        ...assignment,
        companyName: companies[index]?.name ?? "Unknown company",
        companyTag: companies[index]?.tag ?? "UNK",
      })),
    };
  },
});

export const getUsersByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    if (args.companyId) {
      ensure(
        viewer.isAdmin || viewer.companyIds.includes(args.companyId),
        "You do not have access to this company's users.",
      );
    }

    const users = await ctx.db.query("users").collect();
    const allAssignments = await ctx.db.query("userCompanyRoles").collect();

    const filteredAssignments = args.companyId
      ? allAssignments.filter((assignment) => assignment.companyId === args.companyId)
      : viewer.isAdmin
        ? allAssignments
        : allAssignments.filter((assignment) =>
            viewer.companyIds.includes(assignment.companyId),
          );

    const userIds = new Set(filteredAssignments.map((assignment) => assignment.userId));

    return users
      .filter((user) => userIds.has(user._id))
      .map((user) => ({
        ...user,
        assignments: filteredAssignments.filter((assignment) => assignment.userId === user._id),
      }));
  },
});

export const getPoliciesByCompany = query({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);

    if (args.companyId) {
      ensure(
        viewer.isAdmin || viewer.companyIds.includes(args.companyId),
        "You do not have access to this company's policies.",
      );
    }

    if (args.companyId) {
      return await hydratePolicies(ctx, args.companyId);
    }

    if (viewer.isAdmin) {
      return await hydratePolicies(ctx);
    }

    const scopedPolicies = await Promise.all(
      viewer.companyIds.map((companyId) => hydratePolicies(ctx, companyId)),
    );

    return scopedPolicies.flat();
  },
});

export const getActivePolicyForAmountBand = query({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    category: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    ensure(
      viewer.isAdmin || viewer.companyIds.includes(args.companyId),
      "You do not have access to this company's policies.",
    );

    const matched = await findMatchedPolicy(
      ctx,
      args.companyId,
      args.category,
      args.amount,
    );

    if (!matched) return null;

    return {
      ...matched.policy,
      ...buildPolicySnapshot(matched.policy, matched.version),
    };
  },
});

export const getRequestSettings = query({
  args: {
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    if (args.companyId) {
      ensure(
        viewer.isAdmin || viewer.companyIds.includes(args.companyId),
        "You do not have access to this company's request settings.",
      );
    }

    return await getRequestSettingsForCompany(ctx, args.companyId);
  },
});

export const getMySavedAccounts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await loadViewer(ctx, args.userId);
    return await ctx.db
      .query("savedAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getSettingsAuditLog = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    ensureAdmin(viewer);

    const entries = await ctx.db.query("settingsAuditLog").collect();
    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const limited = sorted.slice(0, args.limit ?? 100);
    const users = await Promise.all(limited.map((entry) => ctx.db.get(entry.changedByUserId)));
    const userMap = new Map(users.filter(Boolean).map((user) => [user!._id, user!]));

    return limited.map((entry) => ({
      ...entry,
      changedByUserName: userMap.get(entry.changedByUserId)?.name ?? "Unknown user",
      oldValue: parseJson(entry.oldValueJson),
      newValue: parseJson(entry.newValueJson),
    }));
  },
});

export const saveCompany = mutation({
  args: {
    actingUserId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    name: v.string(),
    tag: v.string(),
    active: v.boolean(),
    procurementEnabled: v.boolean(),
    enabledCategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.actingUserId);
    ensureAdmin(viewer);

    const now = nowIso();
    if (args.companyId) {
      const existing = await ctx.db.get(args.companyId);
      ensure(existing, "Company not found.");

      const nextValue = {
        name: args.name,
        tag: args.tag,
        active: args.active,
        procurementEnabled: args.procurementEnabled,
        enabledCategories: args.enabledCategories,
        updatedAt: now,
      };

      await ctx.db.patch(args.companyId, nextValue);
      await insertSettingsAudit(ctx, {
        module: "companies",
        entityType: "company",
        entityId: String(args.companyId),
        action: "updated",
        changedByUserId: args.actingUserId,
        summary: `Updated company ${args.name}`,
        oldValue: existing,
        newValue: nextValue,
      });

      return args.companyId;
    }

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      tag: args.tag,
      active: args.active,
      procurementEnabled: args.procurementEnabled,
      enabledCategories: args.enabledCategories,
      createdAt: now,
      updatedAt: now,
    });

    await insertSettingsAudit(ctx, {
      module: "companies",
      entityType: "company",
      entityId: String(companyId),
      action: "created",
      changedByUserId: args.actingUserId,
      summary: `Created company ${args.name}`,
      newValue: {
        name: args.name,
        tag: args.tag,
      },
    });

    return companyId;
  },
});

export const saveUserWithRoles = mutation({
  args: {
    actingUserId: v.id("users"),
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.string(),
    active: v.boolean(),
    assignments: v.array(roleAssignmentInput),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.actingUserId);
    ensureAdmin(viewer);

    const now = nowIso();
    let userId = args.userId;

    if (userId) {
      const existing = await ctx.db.get(userId);
      ensure(existing, "User not found.");
      await ctx.db.patch(userId, {
        name: args.name,
        email: args.email,
        active: args.active,
        updatedAt: now,
      });
    } else {
      userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        active: args.active,
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingAssignments = await ctx.db
      .query("userCompanyRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const assignment of existingAssignments) {
      await ctx.db.delete(assignment._id);
    }

    for (const assignment of args.assignments) {
      await ctx.db.insert("userCompanyRoles", {
        userId,
        companyId: assignment.companyId,
        role: assignment.role,
        active: assignment.active ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await insertSettingsAudit(ctx, {
      module: "users",
      entityType: "user",
      entityId: String(userId),
      action: args.userId ? "updated" : "created",
      changedByUserId: args.actingUserId,
      summary: `${args.userId ? "Updated" : "Created"} user ${args.name}`,
      newValue: {
        name: args.name,
        email: args.email,
        assignments: args.assignments,
      },
    });

    return userId;
  },
});

export const savePolicy = mutation({
  args: {
    actingUserId: v.id("users"),
    policyId: v.optional(v.id("policies")),
    ...policyInput,
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.actingUserId);
    ensureAdmin(viewer);

    ensure(args.businessSteps.length > 0, "At least one approval step is required.");
    ensure(
      args.minAmount <= args.maxAmount,
      "Minimum amount must be less than or equal to maximum amount.",
    );

    const now = nowIso();
    let policyId = args.policyId;
    let nextVersionNumber = 1;
    let oldPolicy: Record<string, unknown> | undefined;

    if (policyId) {
      const existing = await ctx.db.get(policyId);
      ensure(existing, "Policy not found.");
      oldPolicy = existing;
      nextVersionNumber = existing.currentVersion + 1;

      await ctx.db.patch(policyId, {
        companyId: args.companyId,
        name: args.name,
        category: args.category,
        minAmount: args.minAmount,
        maxAmount: args.maxAmount,
        active: args.active,
        currentVersion: nextVersionNumber,
        updatedAt: now,
      });
    } else {
      policyId = await ctx.db.insert("policies", {
        companyId: args.companyId,
        name: args.name,
        category: args.category,
        minAmount: args.minAmount,
        maxAmount: args.maxAmount,
        active: args.active,
        currentVersion: nextVersionNumber,
        createdByUserId: args.actingUserId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("policyVersions", {
      policyId,
      versionNumber: nextVersionNumber,
      businessSteps: args.businessSteps,
      requiresFinanceDisbursement: args.requiresFinanceDisbursement,
      requiredQuotes: args.requiredQuotes,
      quoteRuleLabel: args.quoteRuleLabel?.trim() || undefined,
      requireJustificationIfNotLowest: args.requireJustificationIfNotLowest,
      allowSingleSourceException: args.allowSingleSourceException,
      allowDrafts: args.allowDrafts ?? false,
      allowRecall: args.allowRecall ?? true,
      allowResubmission: args.allowResubmission ?? true,
      createdByUserId: args.actingUserId,
      createdAt: now,
    });

    await insertSettingsAudit(ctx, {
      module: "policies",
      entityType: "policy",
      entityId: String(policyId),
      action: args.policyId ? "updated" : "created",
      changedByUserId: args.actingUserId,
      summary: `${args.policyId ? "Updated" : "Created"} policy ${args.name} (v${nextVersionNumber})`,
      oldValue: oldPolicy,
      newValue: {
        name: args.name,
        companyId: args.companyId,
        category: args.category,
        minAmount: args.minAmount,
        maxAmount: args.maxAmount,
        versionNumber: nextVersionNumber,
        businessSteps: args.businessSteps,
      },
    });

    return policyId;
  },
});

export const saveRequestSettings = mutation({
  args: {
    actingUserId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    allowDrafts: v.boolean(),
    allowRecall: v.boolean(),
    allowResubmission: v.boolean(),
    allowPartialPayment: v.boolean(),
    payoutPerLineItem: v.boolean(),
    requestIdMode: requestIdModeValue,
    auditRetentionDays: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.actingUserId);
    ensureAdmin(viewer);

    const existing = await ctx.db.query("requestSettings").collect();
    const current = existing.find((item) => item.companyId === args.companyId);
    const now = nowIso();
    const nextValue = {
      companyId: args.companyId,
      allowDrafts: args.allowDrafts,
      allowRecall: args.allowRecall,
      allowResubmission: args.allowResubmission,
      allowPartialPayment: args.allowPartialPayment,
      payoutPerLineItem: args.payoutPerLineItem,
      requestIdMode: args.requestIdMode,
      auditRetentionDays: args.auditRetentionDays,
      updatedAt: now,
    };

    if (current) {
      await ctx.db.patch(current._id, nextValue);
      await insertSettingsAudit(ctx, {
        module: "request_rules",
        entityType: "request_rule",
        entityId: String(current._id),
        action: "updated",
        changedByUserId: args.actingUserId,
        summary: "Updated request rules",
        oldValue: current,
        newValue: nextValue,
      });
      return current._id;
    }

    const settingsId = await ctx.db.insert("requestSettings", {
      ...DEFAULT_REQUEST_SETTINGS,
      ...nextValue,
      createdAt: now,
    });

    await insertSettingsAudit(ctx, {
      module: "request_rules",
      entityType: "request_rule",
      entityId: String(settingsId),
      action: "created",
      changedByUserId: args.actingUserId,
      summary: "Created request rules",
      newValue: nextValue,
    });

    return settingsId;
  },
});

export const addSavedAccount = mutation({
  args: {
    userId: v.id("users"),
    payeeName: v.string(),
    bankName: v.string(),
    accountNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await loadViewer(ctx, args.userId);

    const now = nowIso();
    return await ctx.db.insert("savedAccounts", {
      userId: args.userId,
      payeeName: args.payeeName,
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      createdAt: now,
      lastUsedAt: now,
    });
  },
});

export const deleteSavedAccount = mutation({
  args: {
    userId: v.id("users"),
    savedAccountId: v.id("savedAccounts"),
  },
  handler: async (ctx, args) => {
    await loadViewer(ctx, args.userId);
    const savedAccount = await ctx.db.get(args.savedAccountId);
    ensure(savedAccount, "Saved account not found.");
    ensure(
      savedAccount.userId === args.userId,
      "You do not have permission to delete this saved account.",
    );

    await ctx.db.delete(args.savedAccountId);
    return { deleted: true };
  },
});
