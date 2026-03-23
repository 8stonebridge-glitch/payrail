import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, validateApprovalAuthority } from "./lib/permissions";
import { assertTransition, determineNextStatus } from "./lib/stateMachine";
import { recordTimelineEvent } from "./lib/audit";

// ─── APPROVE STEP ───
export const approveStep = mutation({
  args: {
    requestId: v.id("requests"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("REQUEST_NOT_FOUND");

    // Must be in approvable state
    if (request.status !== "submitted" && request.status !== "in_approval") {
      throw new Error("REQUEST_NOT_IN_APPROVAL: Current status is " + request.status);
    }

    // Get all steps
    const allSteps = await ctx.db
      .query("requestApprovalSteps")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();

    allSteps.sort((a, b) => a.stepOrder - b.stepOrder);

    // Find current waiting step
    const waitingStep = allSteps.find((s) => s.status === "waiting");
    if (!waitingStep) throw new Error("NO_WAITING_STEP");

    // Validate authority
    await validateApprovalAuthority(
      ctx,
      user._id,
      args.companyId,
      waitingStep.requiredRole,
      request.requestedBy
    );

    // Approve the step
    await ctx.db.patch(waitingStep._id, {
      status: "approved",
      decidedBy: user._id,
      decidedAt: Date.now(),
    });

    // Determine next status
    const { newRequestStatus, nextStepIndex } = determineNextStatus(
      waitingStep.stepOrder,
      allSteps.length,
      "approved"
    );

    // If there's a next step, set it to waiting
    if (nextStepIndex !== null) {
      const nextStep = allSteps.find((s) => s.stepOrder === nextStepIndex);
      if (nextStep) {
        await ctx.db.patch(nextStep._id, { status: "waiting" });
      }
    }

    // Update request status
    const updateFields: Record<string, unknown> = {
      status: newRequestStatus === "approved" ? "awaiting_finance" : newRequestStatus,
      currentStepIndex: nextStepIndex,
    };

    if (newRequestStatus === "approved") {
      updateFields.approvedAt = Date.now();
      updateFields.status = "awaiting_finance";
    }

    await ctx.db.patch(args.requestId, updateFields as any);

    await recordTimelineEvent(ctx, {
      entityType: "request",
      entityId: args.requestId,
      companyId: args.companyId,
      action: "approved",
      actorId: user._id,
      metadata: {
        stepOrder: waitingStep.stepOrder,
        stepLabel: waitingStep.label,
        newStatus: updateFields.status,
      },
    });

    return { newStatus: updateFields.status };
  },
});

// ─── REJECT STEP ───
export const rejectStep = mutation({
  args: {
    requestId: v.id("requests"),
    companyId: v.id("companies"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("REQUEST_NOT_FOUND");

    if (request.status !== "submitted" && request.status !== "in_approval") {
      throw new Error("REQUEST_NOT_IN_APPROVAL");
    }

    const allSteps = await ctx.db
      .query("requestApprovalSteps")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();

    const waitingStep = allSteps.find((s) => s.status === "waiting");
    if (!waitingStep) throw new Error("NO_WAITING_STEP");

    await validateApprovalAuthority(
      ctx,
      user._id,
      args.companyId,
      waitingStep.requiredRole,
      request.requestedBy
    );

    // Reject the step
    await ctx.db.patch(waitingStep._id, {
      status: "rejected",
      decidedBy: user._id,
      decidedAt: Date.now(),
      rejectionReason: args.reason,
    });

    // Update request
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      currentStepIndex: null,
      rejectionCount: request.rejectionCount + 1,
      lastRejectedAt: Date.now(),
    });

    await recordTimelineEvent(ctx, {
      entityType: "request",
      entityId: args.requestId,
      companyId: args.companyId,
      action: "rejected",
      actorId: user._id,
      metadata: {
        stepOrder: waitingStep.stepOrder,
        stepLabel: waitingStep.label,
        reason: args.reason,
      },
    });

    return { newStatus: "rejected" };
  },
});
