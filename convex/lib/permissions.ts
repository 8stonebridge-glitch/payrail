import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type Role =
  | "requester"
  | "approver"
  | "senior_approver"
  | "finance"
  | "admin"
  | "super_admin";

// ─── AUTH HELPERS ───
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function getOrCreateUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      displayName: identity.name ?? identity.email ?? "Unknown",
      avatarUrl: identity.pictureUrl,
      createdAt: Date.now(),
    });
    user = await ctx.db.get(userId);
    if (!user) throw new Error("USER_CREATE_FAILED");
  }

  return user;
}

// ─── COMPANY MEMBERSHIP ───
export async function getMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">
) {
  const membership = await ctx.db
    .query("companyMemberships")
    .withIndex("by_user_company", (q) =>
      q.eq("userId", userId).eq("companyId", companyId)
    )
    .unique();

  if (!membership || !membership.isActive) return null;
  return membership;
}

export async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">
) {
  const membership = await getMembership(ctx, userId, companyId);
  if (!membership) throw new Error("NO_COMPANY_ACCESS");
  return membership;
}

// ─── ROLE CHECKS ───
export function hasRole(roles: string[], required: Role): boolean {
  return roles.includes(required) || roles.includes("super_admin");
}

export function hasAnyRole(roles: string[], required: Role[]): boolean {
  if (roles.includes("super_admin")) return true;
  return required.some((r) => roles.includes(r));
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">,
  required: Role
) {
  const membership = await requireMembership(ctx, userId, companyId);
  if (!hasRole(membership.roles, required)) {
    throw new Error(`MISSING_ROLE: Requires "${required}"`);
  }
  return membership;
}

// ─── APPROVAL STEP AUTHORITY ───
export async function validateApprovalAuthority(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">,
  requiredRole: string,
  requestedById: Id<"users">
) {
  // Cannot approve own request
  if (userId === requestedById) {
    throw new Error("CANNOT_APPROVE_OWN_REQUEST");
  }

  const membership = await requireMembership(ctx, userId, companyId);
  if (!hasRole(membership.roles, requiredRole as Role)) {
    throw new Error(`NOT_AUTHORIZED_FOR_STEP: Requires "${requiredRole}"`);
  }

  return membership;
}

// ─── FINANCE AUTHORITY ───
export async function requireFinanceRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">
) {
  return requireRole(ctx, userId, companyId, "finance");
}

// ─── ADMIN AUTHORITY ───
export async function requireAdminRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  companyId: Id<"companies">
) {
  const membership = await requireMembership(ctx, userId, companyId);
  if (!hasAnyRole(membership.roles, ["admin", "super_admin"])) {
    throw new Error("REQUIRES_ADMIN");
  }
  return membership;
}
