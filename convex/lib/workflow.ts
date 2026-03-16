import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export const DEFAULT_REQUEST_SETTINGS = {
  allowDrafts: false,
  allowRecall: true,
  allowResubmission: true,
  allowPartialPayment: true,
  payoutPerLineItem: true,
  requestIdMode: "company_tag" as const,
  auditRetentionDays: 365,
};

type QuoteInput = {
  vendorName: string;
  quotedAmount: number;
  quoteReference: string;
  validityDate?: string;
  notes?: string;
  attachmentUrl?: string;
};

type PayeeInput = {
  payeeName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
};

export type Viewer = Doc<"users"> & {
  isAdmin: boolean;
  roleAssignments: Doc<"userCompanyRoles">[];
  companyIds: Id<"companies">[];
  rolesByCompany: Map<string, Set<string>>;
};

export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ConvexError(message);
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function serializeJson(value: unknown) {
  return JSON.stringify(value);
}

export function parseJson<T>(value?: string | null): T | null {
  if (!value) return null;
  return JSON.parse(value) as T;
}

export function paymentReference() {
  return `PAY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function loadViewer(ctx: Ctx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  ensure(user && user.active, "Acting user was not found or is inactive.");

  const roleAssignments = (await ctx.db
    .query("userCompanyRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()).filter((item) => item.active);

  const rolesByCompany = new Map<string, Set<string>>();

  for (const assignment of roleAssignments) {
    const key = assignment.companyId;
    if (!rolesByCompany.has(key)) {
      rolesByCompany.set(key, new Set());
    }
    rolesByCompany.get(key)?.add(assignment.role);
  }

  return {
    ...user,
    isAdmin: roleAssignments.some((item) => item.role === "Admin"),
    roleAssignments,
    companyIds: Array.from(
      new Map(roleAssignments.map((item) => [item.companyId, item.companyId])).values(),
    ),
    rolesByCompany,
  } satisfies Viewer;
}

export function viewerCanAccessCompany(viewer: Viewer, companyId: Id<"companies">) {
  return viewer.isAdmin || viewer.companyIds.includes(companyId);
}

export function viewerHasRole(
  viewer: Viewer,
  companyId: Id<"companies">,
  role: string,
) {
  if (viewer.isAdmin) return true;
  return viewer.rolesByCompany.get(companyId)?.has(role) ?? false;
}

export function ensureAdmin(viewer: Viewer) {
  ensure(viewer.isAdmin, "Only admins can perform this action.");
}

export async function getCompanyOrThrow(ctx: Ctx, companyId: Id<"companies">) {
  const company = await ctx.db.get(companyId);
  ensure(company, "Company not found.");
  return company;
}

export async function getRequestOrThrow(ctx: Ctx, requestId: Id<"requests">) {
  const request = await ctx.db.get(requestId);
  ensure(request, "Request not found.");
  return request;
}

export async function getLineItemsForRequest(ctx: Ctx, requestId: Id<"requests">) {
  return await ctx.db
    .query("lineItems")
    .withIndex("by_request", (q) => q.eq("requestId", requestId))
    .collect();
}

export async function getQuotesForRequest(ctx: Ctx, requestId: Id<"requests">) {
  return await ctx.db
    .query("requestQuotes")
    .withIndex("by_request", (q) => q.eq("requestId", requestId))
    .collect();
}

export async function getStepsForRequest(ctx: Ctx, requestId: Id<"requests">) {
  const steps = await ctx.db
    .query("requestApprovalSteps")
    .withIndex("by_request", (q) => q.eq("requestId", requestId))
    .collect();

  return [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
}

export async function getTimelineForRequest(ctx: Ctx, requestId: Id<"requests">) {
  const timeline = await ctx.db
    .query("timelineEvents")
    .withIndex("by_request", (q) => q.eq("requestId", requestId))
    .collect();

  return [...timeline].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getRequestSettingsForCompany(
  ctx: Ctx,
  companyId?: Id<"companies">,
) {
  const all = await ctx.db.query("requestSettings").collect();

  const companySettings =
    companyId && all.find((item) => item.companyId === companyId);
  const globalSettings = all.find((item) => item.companyId === undefined);

  return companySettings ?? globalSettings ?? DEFAULT_REQUEST_SETTINGS;
}

export async function getCurrentPolicyVersion(
  ctx: Ctx,
  policyId: Id<"policies">,
  versionNumber: number,
) {
  return await ctx.db
    .query("policyVersions")
    .withIndex("by_policy_version", (q) =>
      q.eq("policyId", policyId).eq("versionNumber", versionNumber),
    )
    .unique();
}

export async function findMatchedPolicy(
  ctx: Ctx,
  companyId: Id<"companies">,
  category: string,
  amount: number,
) {
  const candidates = await ctx.db
    .query("policies")
    .withIndex("by_company_category_active", (q) =>
      q.eq("companyId", companyId).eq("category", category).eq("active", true),
    )
    .collect();

  const matchedPolicy = [...candidates]
    .filter((policy) => amount >= policy.minAmount && amount <= policy.maxAmount)
    .sort((a, b) => b.minAmount - a.minAmount || a.maxAmount - b.maxAmount)[0];

  if (!matchedPolicy) return null;

  const matchedVersion = await getCurrentPolicyVersion(
    ctx,
    matchedPolicy._id,
    matchedPolicy.currentVersion,
  );

  ensure(
    matchedVersion,
    `Policy ${matchedPolicy.name} is missing its current version.`,
  );

  return {
    policy: matchedPolicy,
    version: matchedVersion,
  };
}

export function buildApprovalSteps(businessSteps: string[]) {
  return businessSteps.map((role, index) => ({
    stepOrder: index + 1,
    role,
    status: index === 0 ? "pending" : "waiting",
  })) as const;
}

export function buildRouteLabel(
  businessSteps: string[],
  requiresFinanceDisbursement: boolean,
) {
  return [
    ...businessSteps,
    ...(requiresFinanceDisbursement ? ["Finance"] : []),
  ].join(" → ");
}

export function buildPolicySnapshot(
  policy: Doc<"policies">,
  version: Doc<"policyVersions">,
) {
  return {
    policyId: policy._id,
    name: policy.name,
    category: policy.category,
    minAmount: policy.minAmount,
    maxAmount: policy.maxAmount,
    active: policy.active,
    versionNumber: version.versionNumber,
    businessSteps: version.businessSteps,
    requiresFinanceDisbursement: version.requiresFinanceDisbursement,
    requiredQuotes: version.requiredQuotes,
    quoteRuleLabel: version.quoteRuleLabel ?? null,
    requireJustificationIfNotLowest:
      version.requireJustificationIfNotLowest,
    allowSingleSourceException: version.allowSingleSourceException,
    allowDrafts: version.allowDrafts,
    allowRecall: version.allowRecall,
    allowResubmission: version.allowResubmission,
  };
}

export async function buildRequestNumber(
  ctx: Ctx,
  company: Doc<"companies">,
  requestIdMode: "company_tag" | "generic",
) {
  const existing =
    requestIdMode === "generic"
      ? await ctx.db.query("requests").collect()
      : await ctx.db
          .query("requests")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

  const prefix = requestIdMode === "generic" ? "REQ" : company.tag;
  const next =
    existing
      .filter((item) => item.requestNumber.startsWith(`${prefix}-`))
      .map((item) => {
        const match = item.requestNumber.match(/-(\d+)$/);
        return match ? Number(match[1]) : 0;
      })
      .reduce((highest, value) => Math.max(highest, value), 0) + 1;

  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export function validatePayees(payees: PayeeInput[]) {
  ensure(payees.length > 0, "At least one payee is required.");

  for (const payee of payees) {
    ensure(payee.payeeName.trim(), "Each payee must have a name.");
    ensure(payee.bankName.trim(), "Each payee must have a bank.");
    ensure(payee.accountNumber.trim(), "Each payee must have an account number.");
    ensure(payee.amount > 0, "Each payee amount must be greater than zero.");
  }
}

export function getLowestQuoteIndex(quotes: QuoteInput[]) {
  if (quotes.length === 0) return -1;

  let lowestIndex = 0;
  let lowestAmount = Number(quotes[0].quotedAmount) || Infinity;

  for (let index = 1; index < quotes.length; index += 1) {
    const amount = Number(quotes[index].quotedAmount) || Infinity;
    if (amount < lowestAmount) {
      lowestIndex = index;
      lowestAmount = amount;
    }
  }

  return lowestIndex;
}

export function validateQuotes(args: {
  quotes: QuoteInput[];
  selectedQuoteIndex?: number;
  quoteJustification?: string;
  singleSourceExceptionEnabled?: boolean;
  singleSourceExceptionReason?: string;
  policyVersion: Doc<"policyVersions">;
}) {
  const {
    quotes,
    selectedQuoteIndex,
    quoteJustification,
    singleSourceExceptionEnabled,
    singleSourceExceptionReason,
    policyVersion,
  } = args;

  const normalizedVendors = quotes.map((quote) =>
    quote.vendorName.trim().toLowerCase(),
  );

  ensure(
    normalizedVendors.length === new Set(normalizedVendors).size,
    "Vendor quotes must come from different vendors.",
  );

  for (const quote of quotes) {
    ensure(quote.vendorName.trim(), "Each quote must include a vendor name.");
    ensure(quote.quoteReference.trim(), "Each quote must include a quote reference.");
    ensure(quote.quotedAmount > 0, "Each quote amount must be greater than zero.");
  }

  if (policyVersion.requiredQuotes > 0) {
    if (singleSourceExceptionEnabled) {
      ensure(
        policyVersion.allowSingleSourceException,
        "This policy does not allow a single-source exception.",
      );
      ensure(
        singleSourceExceptionReason?.trim(),
        "Provide a reason for the single-source exception.",
      );
    } else {
      ensure(
        quotes.length >= policyVersion.requiredQuotes,
        `This request requires ${policyVersion.requiredQuotes} competitive quotes.`,
      );
    }
  }

  if (quotes.length === 0) {
    ensure(
      selectedQuoteIndex === undefined,
      "A selected quote cannot be provided when there are no quotes.",
    );
    return;
  }

  ensure(
    selectedQuoteIndex !== undefined &&
      selectedQuoteIndex >= 0 &&
      selectedQuoteIndex < quotes.length,
    "Select the vendor quote that should be used for the request.",
  );

  const lowestQuoteIndex = getLowestQuoteIndex(quotes);
  const selectedIsLowest = lowestQuoteIndex === selectedQuoteIndex;

  if (
    policyVersion.requireJustificationIfNotLowest &&
    !selectedIsLowest
  ) {
    ensure(
      quoteJustification?.trim(),
      "A justification is required when the selected vendor is not the lowest quote.",
    );
  }
}

export async function insertTimelineEvent(
  ctx: MutationCtx,
  args: {
    requestId: Id<"requests">;
    actionType: string;
    actorUserId?: Id<"users">;
    actorRole?: Doc<"userCompanyRoles">["role"];
    note?: string;
    metadata?: unknown;
    createdAt?: string;
  },
) {
  const createdAt = args.createdAt ?? nowIso();

  return await ctx.db.insert("timelineEvents", {
    requestId: args.requestId,
    actionType: args.actionType,
    actorUserId: args.actorUserId,
    actorRole: args.actorRole,
    note: args.note,
    metadataJson:
      args.metadata === undefined ? undefined : serializeJson(args.metadata),
    createdAt,
  });
}

export async function loadUsersMap(
  ctx: Ctx,
  userIds: Array<Id<"users"> | undefined>,
) {
  const uniqueUserIds = Array.from(
    new Map(
      userIds.filter(Boolean).map((userId) => [userId as string, userId as Id<"users">]),
    ).values(),
  );

  const users = await Promise.all(uniqueUserIds.map((userId) => ctx.db.get(userId)));

  return new Map(
    users.filter(Boolean).map((user) => [user!._id, user!]),
  );
}

export async function hydrateRequest(ctx: Ctx, request: Doc<"requests">) {
  const [company, requester, steps, lineItems, quotes, timeline] =
    await Promise.all([
      ctx.db.get(request.companyId),
      ctx.db.get(request.requesterId),
      getStepsForRequest(ctx, request._id),
      getLineItemsForRequest(ctx, request._id),
      getQuotesForRequest(ctx, request._id),
      getTimelineForRequest(ctx, request._id),
    ]);

  const userMap = await loadUsersMap(ctx, [
    request.requesterId,
    ...steps.map((step) => step.actedByUserId),
    ...timeline.map((item) => item.actorUserId),
  ]);

  const policySnapshot = parseJson<Record<string, unknown>>(request.policySnapshotJson);

  const currentStepIndex =
    request.currentApprovalStepIndex ??
    steps.findIndex((step) => step.status === "pending");

  return {
    _id: request._id,
    id: request.requestNumber,
    requestNumber: request.requestNumber,
    companyId: request.companyId,
    companyName: company?.name ?? "Unknown company",
    companyTag: company?.tag ?? "UNK",
    requesterId: request.requesterId,
    requesterName: requester?.name ?? "Unknown requester",
    category: request.category,
    description: request.description,
    amount: request.totalAmount,
    status: request.status,
    policyId: request.policyId,
    policyVersion: request.policyVersionNumber,
    policyName:
      typeof policySnapshot?.name === "string" ? policySnapshot.name : null,
    policySnapshot,
    date: request.submittedAt ?? request.createdAt,
    currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : null,
    rejectionReason: request.rejectionReason ?? "",
    quoteJustification: request.quoteJustification ?? "",
    singleSourceExceptionEnabled: request.singleSourceExceptionEnabled,
    singleSourceExceptionReason: request.singleSourceExceptionReason ?? "",
    route: steps.map((step) => ({
      _id: step._id,
      step: step.stepOrder,
      role: step.role,
      status: step.status,
      actorId: step.actedByUserId,
      actorName: step.actedByUserId
        ? userMap.get(step.actedByUserId)?.name ?? "Unknown user"
        : undefined,
      date: step.actedAt,
      note: step.note,
    })),
    payees: lineItems.map((lineItem) => ({
      id: lineItem._id,
      name: lineItem.payeeName,
      bank: lineItem.bankName,
      accountNumber: lineItem.accountNumber,
      amount: lineItem.amount,
      isPaid: lineItem.isPaid,
      paidDate: lineItem.paidAt,
      ref: lineItem.paymentReference,
    })),
    quotes: quotes.map((quote) => ({
      id: quote._id,
      vendor: quote.vendorName,
      amount: quote.quotedAmount,
      quoteRef: quote.quoteReference,
      validityDate: quote.validityDate ?? "",
      notes: quote.notes ?? "",
      attachmentUrl: quote.attachmentUrl,
      selected: request.selectedQuoteId === quote._id,
    })),
    timeline: [...timeline]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => ({
        id: item._id,
        action: item.actionType,
        actorId: item.actorUserId,
        actorName: item.actorUserId
          ? userMap.get(item.actorUserId)?.name ?? "Unknown user"
          : "System",
        role: item.actorRole,
        date: item.createdAt,
        note: item.note,
        metadata: parseJson(item.metadataJson),
      })),
  };
}

export async function getVisibleRequestsForViewer(ctx: Ctx, viewer: Viewer) {
  if (viewer.isAdmin) {
    return await ctx.db.query("requests").collect();
  }

  const requestGroups = await Promise.all(
    viewer.companyIds.map((companyId) =>
      ctx.db
        .query("requests")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect(),
    ),
  );

  return requestGroups.flat();
}

export async function getPendingStep(
  ctx: Ctx,
  requestId: Id<"requests">,
) {
  const steps = await getStepsForRequest(ctx, requestId);
  const pendingIndex = steps.findIndex((step) => step.status === "pending");

  return {
    steps,
    pendingIndex,
    pendingStep: pendingIndex >= 0 ? steps[pendingIndex] : null,
  };
}

export async function ensureRequestAccess(
  ctx: Ctx,
  viewer: Viewer,
  requestId: Id<"requests">,
) {
  const request = await getRequestOrThrow(ctx, requestId);
  ensure(
    viewerCanAccessCompany(viewer, request.companyId),
    "You do not have access to this request.",
  );
  return request;
}

export function sumLineItemsAmount(
  payees: Array<{ amount: number }>,
) {
  return payees.reduce((sum, payee) => sum + Number(payee.amount || 0), 0);
}
