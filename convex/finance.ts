import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireFinanceRole } from "./lib/permissions";
import { derivePayoutStatus } from "./lib/stateMachine";
import { recordTimelineEvent } from "./lib/audit";

// ─── MARK LINE ITEM PAID ───
export const markLineItemPaid = mutation({
  args: {
    lineItemId: v.id("requestLineItems"),
    companyId: v.id("companies"),
    payoutReference: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireFinanceRole(ctx, user._id, args.companyId);

    const lineItem = await ctx.db.get(args.lineItemId);
    if (!lineItem) throw new Error("LINE_ITEM_NOT_FOUND");

    if (lineItem.payoutStatus === "paid") {
      throw new Error("ALREADY_PAID");
    }

    const request = await ctx.db.get(lineItem.requestId);
    if (!request) throw new Error("REQUEST_NOT_FOUND");

    // Must be in finance phase
    if (
      request.status !== "awaiting_finance" &&
      request.status !== "partially_paid"
    ) {
      throw new Error("REQUEST_NOT_IN_FINANCE_PHASE: Status is " + request.status);
    }

    // Mark item paid
    await ctx.db.patch(args.lineItemId, {
      payoutStatus: "paid",
      payoutReference: args.payoutReference,
      paidAt: Date.now(),
      paidBy: user._id,
    });

    // Get all line items to derive request status
    const allItems = await ctx.db
      .query("requestLineItems")
      .withIndex("by_request", (q) => q.eq("requestId", lineItem.requestId))
      .collect();

    // Update the one we just patched in our local view
    const updatedStatuses = allItems.map((item) =>
      item._id === args.lineItemId ? "paid" : item.payoutStatus
    ) as ("unpaid" | "paid")[];

    const derivedStatus = derivePayoutStatus(updatedStatuses);

    const updateFields: Record<string, unknown> = { status: derivedStatus };
    if (derivedStatus === "paid") {
      updateFields.completedAt = Date.now();
    }

    await ctx.db.patch(lineItem.requestId, updateFields as any);

    // Audit
    const action = derivedStatus === "paid" ? "fully_paid" : "line_item_paid";
    await recordTimelineEvent(ctx, {
      entityType: "request",
      entityId: lineItem.requestId,
      companyId: args.companyId,
      action,
      actorId: user._id,
      metadata: {
        lineItemId: args.lineItemId,
        payeeName: lineItem.payeeName,
        amount: lineItem.amount,
        payoutReference: args.payoutReference,
        derivedStatus,
      },
    });

    return { derivedStatus };
  },
});
