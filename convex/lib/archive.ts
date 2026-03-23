import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function archiveRecord(
  ctx: MutationCtx,
  params: {
    originalTable: string;
    originalId: string;
    companyId: Id<"companies">;
    data: Record<string, unknown>;
    archivedBy: Id<"users">;
    reason: string;
  }
) {
  return await ctx.db.insert("archivedRecords", {
    originalTable: params.originalTable,
    originalId: params.originalId,
    companyId: params.companyId,
    data: JSON.stringify(params.data),
    archivedBy: params.archivedBy,
    archivedAt: Date.now(),
    reason: params.reason,
  });
}
