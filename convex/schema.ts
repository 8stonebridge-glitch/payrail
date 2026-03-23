import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(
  v.literal("Admin"),
  v.literal("Supervisor"),
  v.literal("Head of Ops"),
  v.literal("CFO"),
  v.literal("CEO"),
  v.literal("MD"),
  v.literal("Finance"),
  v.literal("Team Lead"),
  v.literal("Ops Manager"),
);

const requestStatus = v.union(
  v.literal("draft"),
  v.literal("in_approval"),
  v.literal("awaiting_finance"),
  v.literal("partially_paid"),
  v.literal("paid"),
  v.literal("rejected"),
  v.literal("recalled"),
);

const stepStatus = v.union(
  v.literal("waiting"),
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("skipped"),
);

const requestIdMode = v.union(
  v.literal("company_tag"),
  v.literal("generic"),
);

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    tag: v.string(),
    active: v.boolean(),
    enabledCategories: v.array(v.string()),
    procurementEnabled: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tag", ["tag"])
    .index("by_active", ["active"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    active: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["active"]),

  userCompanyRoles: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    role,
    active: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
    .index("by_user_company", ["userId", "companyId"]),

  policies: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    category: v.string(),
    minAmount: v.number(),
    maxAmount: v.number(),
    active: v.boolean(),
    currentVersion: v.number(),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_category", ["companyId", "category"])
    .index("by_company_category_active", ["companyId", "category", "active"]),

  policyVersions: defineTable({
    policyId: v.id("policies"),
    versionNumber: v.number(),
    businessSteps: v.array(role),
    requiresFinanceDisbursement: v.boolean(),
    requiredQuotes: v.number(),
    quoteRuleLabel: v.optional(v.string()),
    requireJustificationIfNotLowest: v.boolean(),
    allowSingleSourceException: v.boolean(),
    allowDrafts: v.boolean(),
    allowRecall: v.boolean(),
    allowResubmission: v.boolean(),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.string(),
  })
    .index("by_policy", ["policyId"])
    .index("by_policy_version", ["policyId", "versionNumber"]),

  requestSettings: defineTable({
    companyId: v.optional(v.id("companies")),
    allowDrafts: v.boolean(),
    allowRecall: v.boolean(),
    allowResubmission: v.boolean(),
    allowPartialPayment: v.boolean(),
    payoutPerLineItem: v.boolean(),
    requestIdMode,
    auditRetentionDays: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_company", ["companyId"]),

  requests: defineTable({
    requestNumber: v.string(),
    companyId: v.id("companies"),
    requesterId: v.id("users"),
    category: v.string(),
    description: v.string(),
    totalAmount: v.number(),
    status: requestStatus,
    selectedQuoteId: v.optional(v.id("requestQuotes")),
    quoteJustification: v.optional(v.string()),
    singleSourceExceptionEnabled: v.boolean(),
    singleSourceExceptionReason: v.optional(v.string()),
    policyId: v.optional(v.id("policies")),
    policyVersionNumber: v.optional(v.number()),
    policySnapshotJson: v.string(),
    currentApprovalStepIndex: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    recalledReason: v.optional(v.string()),
    createdAt: v.string(),
    submittedAt: v.optional(v.string()),
    updatedAt: v.string(),
    rejectedAt: v.optional(v.string()),
    recalledAt: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_requester", ["requesterId"])
    .index("by_company_status", ["companyId", "status"]),

  requestApprovalSteps: defineTable({
    requestId: v.id("requests"),
    stepOrder: v.number(),
    role,
    status: stepStatus,
    actedByUserId: v.optional(v.id("users")),
    actedAt: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("by_request", ["requestId"])
    .index("by_status_role", ["status", "role"]),

  requestQuotes: defineTable({
    requestId: v.id("requests"),
    vendorName: v.string(),
    quotedAmount: v.number(),
    quoteReference: v.string(),
    validityDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    isSelected: v.boolean(),
    createdAt: v.string(),
  }).index("by_request", ["requestId"]),

  lineItems: defineTable({
    requestId: v.id("requests"),
    payeeName: v.string(),
    bankName: v.string(),
    accountNumber: v.string(),
    amount: v.number(),
    isPaid: v.boolean(),
    paidAt: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_request", ["requestId"])
    .index("by_request_paid", ["requestId", "isPaid"]),

  timelineEvents: defineTable({
    requestId: v.id("requests"),
    actionType: v.string(),
    actorUserId: v.optional(v.id("users")),
    actorRole: v.optional(role),
    note: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_request", ["requestId"]),

  savedAccounts: defineTable({
    userId: v.id("users"),
    payeeName: v.string(),
    bankName: v.string(),
    accountNumber: v.string(),
    createdAt: v.string(),
    lastUsedAt: v.string(),
  }).index("by_user", ["userId"]),

  settingsAuditLog: defineTable({
    module: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    changedByUserId: v.id("users"),
    oldValueJson: v.optional(v.string()),
    newValueJson: v.optional(v.string()),
    summary: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_module", ["module"])
    .index("by_entity", ["entityType", "entityId"]),
});
