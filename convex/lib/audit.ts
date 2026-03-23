import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type TimelineAction =
  | "created"
  | "submitted"
  | "approved"
  | "rejected"
  | "resubmitted"
  | "line_item_paid"
  | "fully_paid"
  | "policy_created"
  | "policy_updated"
  | "role_assigned"
  | "role_removed"
  | "governance_requested"
  | "governance_approved"
  | "governance_rejected"
  | "governance_applied"
  | "archived"
  | "restored";

export async function recordTimelineEvent(
  ctx: MutationCtx,
  params: {
    entityType: string;
    entityId: string;
    companyId: Id<"companies">;
    action: TimelineAction;
    actorId: Id<"users">;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("timelineEvents", {
    entityType: params.entityType,
    entityId: params.entityId,
    companyId: params.companyId,
    action: params.action,
    actorId: params.actorId,
    metadata: JSON.stringify(params.metadata ?? {}),
    createdAt: Date.now(),
  });
}
