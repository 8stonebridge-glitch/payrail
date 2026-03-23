import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, validateApprovalAuthority } from "./lib/permissions";
import { determineNextStatus } from "./lib/stateMachine";
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
      waitingStep.role,
      request.requesterId
    );

    // Approve the step
    await ctx.db.patch(waitingStep._id, {
      status: "approved" as const,
      actedByUserId: user._id,
      actedAt: new Date().toISOString(),
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
        await ctx.db.patch(nextStep._id, { status: "waiting" as const });
      }
    }

    // Update request status
    const finalStatus = newRequestStatus === "approved" ? "awaiting_finance" : newRequestStatus;
    await ctx.db.patch(args.requestId, {
      status: finalStatus as any,
      currentApprovalStepIndex: nextStepIndex ?? undefined,
      updatedAt: new Date().toISOString(),
    });

    await recordTimelineEvent(ctx, {
      entityType: "request",
      entityId: args.requestId,
      companyId: args.companyId,
      action: "approved",
      actorId: user._id,
      metadata: {
        stepOrder: waitingStep.stepOrder,
        newStatus: finalStatus,
      },
    });

    return { newStatus: finalStatus };
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
      waitingStep.role,
      request.requesterId
    );

    // Reject the step
    await ctx.db.patch(waitingStep._id, {
      status: "rejected" as const,
      actedByUserId: user._id,
      actedAt: new Date().toISOString(),
      note: args.reason,
    });

    // Update request
    await ctx.db.patch(args.requestId, {
      status: "rejected" as const,
      currentApprovalStepIndex: undefined,
      rejectionReason: args.reason,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await recordTimelineEvent(ctx, {
      entityType: "request",
      entityId: args.requestId,
      companyId: args.companyId,
      action: "rejected",
      actorId: user._id,
      metadata: {
        stepOrder: waitingStep.stepOrder,
        reason: args.reason,
      },
    });

    return { newStatus: "rejected" };
  },
});
