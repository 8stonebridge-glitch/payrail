import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Match the best approval policy for a given company + category + amount.
 * Returns the most specific active policy that covers the amount range.
 */
export async function matchPolicy(
  ctx: QueryCtx | MutationCtx,
  companyId: Id<"companies">,
  category: string,
  amount: number
) {
  const policies = await ctx.db
    .query("approvalPolicies")
    .withIndex("by_company_category", (q) =>
      q.eq("companyId", companyId).eq("category", category)
    )
    .collect();

  const activePolicies = policies.filter((p) => p.isActive);

  // Find policies where amount falls within the band
  const matching = activePolicies.filter((p) => {
    if (amount < p.amountMin) return false;
    if (p.amountMax !== undefined && amount > p.amountMax) return false;
    return true;
  });

  if (matching.length === 0) return null;

  // Prefer the most specific (narrowest band) — sort by amountMin descending
  matching.sort((a, b) => b.amountMin - a.amountMin);
  return matching[0];
}

/**
 * Generate approval steps from a policy route for a specific request.
 */
export function generateApprovalSteps(
  policy: {
    approvalRoute: Array<{
      stepOrder: number;
      requiredRole: string;
      label: string;
      isOptional: boolean;
    }>;
  }
) {
  return policy.approvalRoute
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((step, index) => ({
      stepOrder: index,
      requiredRole: step.requiredRole,
      label: step.label,
      status: index === 0 ? ("waiting" as const) : ("pending" as const),
    }));
}
