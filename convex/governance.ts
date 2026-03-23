import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAdminRole } from "./lib/permissions";
import { recordTimelineEvent } from "./lib/audit";

// ─── CREATE GOVERNED CHANGE REQUEST ───
export const createGovernedChange = mutation({
  args: {
    companyId: v.id("companies"),
    changeType: v.string(),
    changeDescription: v.string(),
    changePayload: v.string(), // JSON
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireAdminRole(ctx, user._id, args.companyId);

    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("COMPANY_NOT_FOUND");

    // Governance threshold change always requires governed flow
    const threshold =
      args.changeType === "governance_threshold_change"
        ? Math.max(company.governanceThreshold, 2) // always at least 2 for governance changes
        : company.governanceThreshold;

    if (threshold <= 1 && args.changeType !== "governance_threshold_change") {
      // Apply immediately — no governance needed
      return { immediate: true, changePayload: args.changePayload };
    }

    const changeId = await ctx.db.insert("governedChangeRequests", {
      companyId: args.companyId,
      changeType: args.changeType,
      changeDescription: args.changeDescription,
      changePayload: args.changePayload,
      requestedBy: user._id,
      requiredApprovals: threshold,
      currentApprovals: 0,
      status: "pending",
      createdAt: Date.now(),
    });

    await recordTimelineEvent(ctx, {
      entityType: "governed_change",
      entityId: changeId,
      companyId: args.companyId,
      action: "governance_requested",
      actorId: user._id,
      metadata: { changeType: args.changeType, changeDescription: args.changeDescription },
    });

    return { immediate: false, changeRequestId: changeId };
  },
});

// ─── APPROVE GOVERNED CHANGE ───
export const approveGovernedChange = mutation({
  args: {
    changeRequestId: v.id("governedChangeRequests"),
    companyId: v.id("companies"),
    rationale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireAdminRole(ctx, user._id, args.companyId);

    const change = await ctx.db.get(args.changeRequestId);
    if (!change) throw new Error("CHANGE_REQUEST_NOT_FOUND");
    if (change.status !== "pending") throw new Error("CHANGE_NOT_PENDING");

    // Cannot approve own governance request
    if (change.requestedBy === user._id) {
      throw new Error("CANNOT_APPROVE_OWN_GOVERNANCE_REQUEST");
    }

    // Check not already voted
    const existingVote = await ctx.db
      .query("governedChangeApprovals")
      .withIndex("by_changeRequest", (q) =>
        q.eq("changeRequestId", args.changeRequestId)
      )
      .collect();

    if (existingVote.some((v) => v.adminId === user._id)) {
      throw new Error("ALREADY_VOTED");
    }

    // Record approval
    await ctx.db.insert("governedChangeApprovals", {
      changeRequestId: args.changeRequestId,
      adminId: user._id,
      decision: "approve",
      rationale: args.rationale,
      decidedAt: Date.now(),
    });

    const newApprovalCount = change.currentApprovals + 1;
    const isFullyApproved = newApprovalCount >= change.requiredApprovals;

    await ctx.db.patch(args.changeRequestId, {
      currentApprovals: newApprovalCount,
      status: isFullyApproved ? "approved" : "pending",
      resolvedAt: isFullyApproved ? Date.now() : undefined,
    });

    await recordTimelineEvent(ctx, {
      entityType: "governed_change",
      entityId: args.changeRequestId,
      companyId: args.companyId,
      action: isFullyApproved ? "governance_applied" : "governance_approved",
      actorId: user._id,
      metadata: { currentApprovals: newApprovalCount, required: change.requiredApprovals },
    });

    return { isFullyApproved, currentApprovals: newApprovalCount };
  },
});

// ─── REJECT GOVERNED CHANGE ───
export const rejectGovernedChange = mutation({
  args: {
    changeRequestId: v.id("governedChangeRequests"),
    companyId: v.id("companies"),
    rationale: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireAdminRole(ctx, user._id, args.companyId);

    const change = await ctx.db.get(args.changeRequestId);
    if (!change) throw new Error("CHANGE_REQUEST_NOT_FOUND");
    if (change.status !== "pending") throw new Error("CHANGE_NOT_PENDING");

    await ctx.db.insert("governedChangeApprovals", {
      changeRequestId: args.changeRequestId,
      adminId: user._id,
      decision: "reject",
      rationale: args.rationale,
      decidedAt: Date.now(),
    });

    await ctx.db.patch(args.changeRequestId, {
      status: "rejected",
      resolvedAt: Date.now(),
    });

    await recordTimelineEvent(ctx, {
      entityType: "governed_change",
      entityId: args.changeRequestId,
      companyId: args.companyId,
      action: "governance_rejected",
      actorId: user._id,
      metadata: { rationale: args.rationale },
    });

    return { status: "rejected" };
  },
});
