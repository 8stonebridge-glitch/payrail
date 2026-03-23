import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getMembership, hasRole, hasAnyRole } from "./lib/permissions";

// ─── DASHBOARD STATS ───
export const dashboardStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership) return null;

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Pending approval steps where user's role matches
    const pendingSteps = await ctx.db
      .query("requestApprovalSteps")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();

    const myPendingApprovals = pendingSteps.filter((step) =>
      hasRole(membership.roles, step.requiredRole as any)
    );

    const awaitingFinance = requests.filter(
      (r) => r.status === "awaiting_finance" || r.status === "partially_paid"
    );

    const rejected = requests.filter(
      (r) => r.status === "rejected" && r.requestedBy === user._id
    );

    const recentlyPaid = requests
      .filter((r) => r.status === "paid")
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 5);

    return {
      pendingApprovals: myPendingApprovals.length,
      awaitingFinance: hasRole(membership.roles, "finance")
        ? awaitingFinance.length
        : 0,
      rejectedRequests: rejected.length,
      recentlyPaid: recentlyPaid.length,
      totalRequests: requests.length,
    };
  },
});

// ─── MY PENDING ACTIONS ───
export const myPendingActions = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership) return [];

    const actions: Array<{
      type: "approval" | "finance" | "resubmit";
      requestId: string;
      requestNumber: string;
      category: string;
      amount: number;
      requester?: string;
      stepLabel?: string;
    }> = [];

    // Approval actions
    if (hasAnyRole(membership.roles, ["approver", "senior_approver"])) {
      const waitingSteps = await ctx.db
        .query("requestApprovalSteps")
        .withIndex("by_status", (q) => q.eq("status", "waiting"))
        .collect();

      const mySteps = waitingSteps.filter((s) =>
        hasRole(membership.roles, s.requiredRole as any)
      );

      for (const step of mySteps) {
        const request = await ctx.db.get(step.requestId);
        if (request && request.companyId === args.companyId) {
          const requester = await ctx.db.get(request.requestedBy);
          actions.push({
            type: "approval",
            requestId: request._id,
            requestNumber: request.requestNumber,
            category: request.category,
            amount: request.totalAmount,
            requester: requester?.displayName,
            stepLabel: step.label,
          });
        }
      }
    }

    // Finance actions
    if (hasRole(membership.roles, "finance")) {
      const financeRequests = await ctx.db
        .query("requests")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", args.companyId).eq("status", "awaiting_finance")
        )
        .collect();

      const partialRequests = await ctx.db
        .query("requests")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", args.companyId).eq("status", "partially_paid")
        )
        .collect();

      for (const request of [...financeRequests, ...partialRequests]) {
        actions.push({
          type: "finance",
          requestId: request._id,
          requestNumber: request.requestNumber,
          category: request.category,
          amount: request.totalAmount,
        });
      }
    }

    // Resubmit actions
    const rejectedRequests = await ctx.db
      .query("requests")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "rejected")
      )
      .collect();

    for (const request of rejectedRequests) {
      if (request.requestedBy === user._id) {
        actions.push({
          type: "resubmit",
          requestId: request._id,
          requestNumber: request.requestNumber,
          category: request.category,
          amount: request.totalAmount,
        });
      }
    }

    return actions;
  },
});

// ─── REQUEST LIST ───
export const requestList = query({
  args: {
    companyId: v.id("companies"),
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership) return [];

    let requests;
    if (args.statusFilter) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", args.companyId).eq("status", args.statusFilter!)
        )
        .collect();
    } else {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .collect();
    }

    // Scope: non-admins see only their own requests
    if (!hasAnyRole(membership.roles, ["senior_approver", "finance", "admin", "super_admin"])) {
      requests = requests.filter((r) => r.requestedBy === user._id);
    }

    // Enrich with requester names
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const requester = await ctx.db.get(r.requestedBy);
        // Get current step label
        let currentStepLabel: string | null = null;
        if (r.currentStepIndex !== undefined && r.currentStepIndex !== null) {
          const steps = await ctx.db
            .query("requestApprovalSteps")
            .withIndex("by_request", (q) => q.eq("requestId", r._id))
            .collect();
          const currentStep = steps.find((s) => s.status === "waiting");
          currentStepLabel = currentStep?.label ?? null;
        }
        return {
          ...r,
          requesterName: requester?.displayName ?? "Unknown",
          currentStepLabel,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── REQUEST DETAIL ───
export const requestDetail = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;

    const membership = await getMembership(ctx, user._id, request.companyId);
    if (!membership) return null;

    // Scope check
    if (
      !hasAnyRole(membership.roles, ["senior_approver", "finance", "admin", "super_admin"]) &&
      request.requestedBy !== user._id
    ) {
      // Check if user is an approver on this request
      const steps = await ctx.db
        .query("requestApprovalSteps")
        .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
        .collect();
      const isApprover = steps.some((s) =>
        hasRole(membership.roles, s.requiredRole as any)
      );
      if (!isApprover) return null;
    }

    const requester = await ctx.db.get(request.requestedBy);
    const lineItems = await ctx.db
      .query("requestLineItems")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    const quotes = await ctx.db
      .query("requestQuotes")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    const steps = await ctx.db
      .query("requestApprovalSteps")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    const timeline = await ctx.db
      .query("timelineEvents")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", "request").eq("entityId", args.requestId)
      )
      .collect();

    // Enrich steps with actor names
    const enrichedSteps = await Promise.all(
      steps.sort((a, b) => a.stepOrder - b.stepOrder).map(async (s) => {
        let decidedByName: string | null = null;
        if (s.decidedBy) {
          const actor = await ctx.db.get(s.decidedBy);
          decidedByName = actor?.displayName ?? null;
        }
        return { ...s, decidedByName };
      })
    );

    // Enrich timeline with actor names
    const enrichedTimeline = await Promise.all(
      timeline.sort((a, b) => a.createdAt - b.createdAt).map(async (e) => {
        const actor = await ctx.db.get(e.actorId);
        return { ...e, actorName: actor?.displayName ?? "System" };
      })
    );

    // Determine user's available actions
    const canApprove =
      (request.status === "submitted" || request.status === "in_approval") &&
      enrichedSteps.some(
        (s) =>
          s.status === "waiting" &&
          hasRole(membership.roles, s.requiredRole as any) &&
          request.requestedBy !== user._id
      );

    const canPay =
      (request.status === "awaiting_finance" || request.status === "partially_paid") &&
      hasRole(membership.roles, "finance");

    const canResubmit =
      request.status === "rejected" && request.requestedBy === user._id;

    // Redact bank details for non-finance
    const redactedLineItems = lineItems.map((item) => ({
      ...item,
    }));

    return {
      ...request,
      requesterName: requester?.displayName ?? "Unknown",
      lineItems: redactedLineItems,
      quotes,
      steps: enrichedSteps,
      timeline: enrichedTimeline,
      actions: { canApprove, canPay, canResubmit },
    };
  },
});

// ─── FINANCE QUEUE ───
export const financeQueue = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await getMembership(ctx, user._id, args.companyId);

    const awaitingFinance = await ctx.db
      .query("requests")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "awaiting_finance")
      )
      .collect();

    const partiallyPaid = await ctx.db
      .query("requests")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "partially_paid")
      )
      .collect();

    const allRequests = [...awaitingFinance, ...partiallyPaid];

    const enriched = await Promise.all(
      allRequests.map(async (r) => {
        const requester = await ctx.db.get(r.requestedBy);
        const lineItems = await ctx.db
          .query("requestLineItems")
          .withIndex("by_request", (q) => q.eq("requestId", r._id))
          .collect();

        const paidCount = lineItems.filter((i) => i.payoutStatus === "paid").length;

        return {
          ...r,
          requesterName: requester?.displayName ?? "Unknown",
          lineItems,
          paidCount,
          totalItems: lineItems.length,
        };
      })
    );

    return enriched.sort((a, b) => (a.approvedAt ?? 0) - (b.approvedAt ?? 0));
  },
});

// ─── GOVERNANCE INBOX ───
export const governanceInbox = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership || !hasAnyRole(membership.roles, ["admin", "super_admin"])) return [];

    const pendingChanges = await ctx.db
      .query("governedChangeRequests")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "pending")
      )
      .collect();

    const enriched = await Promise.all(
      pendingChanges.map(async (c) => {
        const requester = await ctx.db.get(c.requestedBy);
        const approvals = await ctx.db
          .query("governedChangeApprovals")
          .withIndex("by_changeRequest", (q) =>
            q.eq("changeRequestId", c._id)
          )
          .collect();

        const hasVoted = approvals.some((a) => a.adminId === user._id);
        const isOwn = c.requestedBy === user._id;

        return {
          ...c,
          requesterName: requester?.displayName ?? "Unknown",
          approvalVotes: approvals,
          canAct: !hasVoted && !isOwn,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── AUDIT TIMELINE ───
export const auditTimeline = query({
  args: {
    companyId: v.id("companies"),
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership || !hasAnyRole(membership.roles, ["admin", "super_admin"])) return [];

    let events = await ctx.db
      .query("timelineEvents")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    if (args.entityType) {
      events = events.filter((e) => e.entityType === args.entityType);
    }

    const limited = events.slice(0, args.limit ?? 100);

    const enriched = await Promise.all(
      limited.map(async (e) => {
        const actor = await ctx.db.get(e.actorId);
        return { ...e, actorName: actor?.displayName ?? "System" };
      })
    );

    return enriched;
  },
});

// ─── ARCHIVE SEARCH ───
export const archiveSearch = query({
  args: {
    companyId: v.id("companies"),
    tableFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership || !hasAnyRole(membership.roles, ["admin", "super_admin"])) return [];

    let records = await ctx.db
      .query("archivedRecords")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (args.tableFilter) {
      records = records.filter((r) => r.originalTable === args.tableFilter);
    }

    const enriched = await Promise.all(
      records.map(async (r) => {
        const archiver = await ctx.db.get(r.archivedBy);
        return { ...r, archivedByName: archiver?.displayName ?? "Unknown" };
      })
    );

    return enriched.sort((a, b) => b.archivedAt - a.archivedAt);
  },
});

// ─── USER'S COMPANIES ───
export const myCompanies = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const memberships = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeMemberships = memberships.filter((m) => m.isActive);
    const companies = await Promise.all(
      activeMemberships.map(async (m) => {
        const company = await ctx.db.get(m.companyId);
        return company ? { ...company, roles: m.roles } : null;
      })
    );

    return companies.filter(Boolean);
  },
});

// ─── POLICIES FOR COMPANY ───
export const companyPolicies = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership || !hasAnyRole(membership.roles, ["admin", "super_admin"])) return [];

    const policies = await ctx.db
      .query("approvalPolicies")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return policies.filter((p) => p.isActive).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.amountMin - b.amountMin;
    });
  },
});

// ─── COMPANY DETAILS ───
export const getCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership) return null;
    return ctx.db.get(args.companyId);
  },
});

// ─── COMPANY USERS ───
export const listCompanyUsers = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await getMembership(ctx, user._id, args.companyId);
    if (!membership || !hasAnyRole(membership.roles, ["admin", "super_admin"])) return [];

    const memberships = await ctx.db
      .query("companyMemberships")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const users = await Promise.all(
      memberships.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return u
          ? {
              userId: u._id,
              email: u.email,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              roles: m.roles,
              isActive: m.isActive,
              membershipId: m._id,
            }
          : null;
      })
    );

    return users.filter(Boolean);
  },
});
