import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  buildApprovalSteps,
  buildPolicySnapshot,
  buildRequestNumber,
  buildRouteLabel,
  ensure,
  ensureRequestAccess,
  findMatchedPolicy,
  getCompanyOrThrow,
  getLineItemsForRequest,
  getPendingStep,
  getQuotesForRequest,
  getRequestSettingsForCompany,
  getRequestOrThrow,
  getStepsForRequest,
  getVisibleRequestsForViewer,
  hydrateRequest,
  insertTimelineEvent,
  loadViewer,
  nowIso,
  paymentReference,
  serializeJson,
  sumLineItemsAmount,
  validatePayees,
  validateQuotes,
  viewerHasRole,
} from "./lib/workflow";

const payeeInput = v.object({
  payeeName: v.string(),
  bankName: v.string(),
  accountNumber: v.string(),
  amount: v.number(),
});

const quoteInput = v.object({
  vendorName: v.string(),
  quotedAmount: v.number(),
  quoteReference: v.string(),
  validityDate: v.optional(v.string()),
  notes: v.optional(v.string()),
  attachmentUrl: v.optional(v.string()),
});

export const getVisibleRequestsForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const requests = await getVisibleRequestsForViewer(ctx, viewer);
    const hydrated = await Promise.all(requests.map((request) => hydrateRequest(ctx, request)));
    return hydrated.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  },
});

export const getRequestById = query({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);
    return await hydrateRequest(ctx, request);
  },
});

export const getDashboardStatsForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const requests = await getVisibleRequestsForViewer(ctx, viewer);
    const hydrated = await Promise.all(requests.map((request) => hydrateRequest(ctx, request)));

    const byStatus = {
      draft: { count: 0, volume: 0 },
      in_approval: { count: 0, volume: 0 },
      awaiting_finance: { count: 0, volume: 0 },
      partially_paid: { count: 0, volume: 0 },
      paid: { count: 0, volume: 0 },
      rejected: { count: 0, volume: 0 },
      recalled: { count: 0, volume: 0 },
    };

    let totalValue = 0;
    let disbursed = 0;
    let totalPayees = 0;
    let paidPayees = 0;
    let actionable = 0;

    for (const request of hydrated) {
      totalValue += Number(request.amount);
      byStatus[request.status as keyof typeof byStatus].count += 1;
      byStatus[request.status as keyof typeof byStatus].volume += Number(request.amount);

      const requestDisbursed = request.payees
        .filter((payee) => payee.isPaid)
        .reduce((sum, payee) => sum + Number(payee.amount), 0);

      disbursed += requestDisbursed;
      totalPayees += request.payees.length;
      paidPayees += request.payees.filter((payee) => payee.isPaid).length;

      const currentStep = request.currentStepIndex === null
        ? null
        : request.route[request.currentStepIndex];

      const canApprove =
        request.status === "in_approval" &&
        currentStep?.status === "pending" &&
        (viewer.isAdmin || viewerHasRole(viewer, request.companyId, currentStep.role));

      const canPay =
        ["awaiting_finance", "partially_paid"].includes(request.status) &&
        request.payees.some((payee) => !payee.isPaid) &&
        (viewer.isAdmin || viewerHasRole(viewer, request.companyId, "Finance"));

      if (canApprove || canPay) actionable += 1;
    }

    return {
      totalValue,
      disbursed,
      pending: totalValue - disbursed,
      disbursedPct: totalValue > 0 ? Math.round((disbursed / totalValue) * 100) : 0,
      totalPayees,
      paidPayees,
      requestCount: hydrated.length,
      actionable,
      isFinance: viewer.isAdmin || viewer.roleAssignments.some((item) => item.role === "Finance"),
      byStatus,
    };
  },
});

export const saveDraftRequest = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    category: v.string(),
    description: v.string(),
    payees: v.array(payeeInput),
    quotes: v.optional(v.array(quoteInput)),
    selectedQuoteIndex: v.optional(v.number()),
    quoteJustification: v.optional(v.string()),
    singleSourceExceptionEnabled: v.optional(v.boolean()),
    singleSourceExceptionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    ensure(
      viewer.isAdmin || viewer.companyIds.includes(args.companyId),
      "You do not have access to create requests for this company.",
    );

    const company = await getCompanyOrThrow(ctx, args.companyId);
    const settings = await getRequestSettingsForCompany(ctx, args.companyId);
    ensure(settings.allowDrafts, "Draft requests are not enabled for this workspace.");

    const now = nowIso();
    const totalAmount = sumLineItemsAmount(args.payees);
    const matchedPolicy =
      totalAmount > 0
        ? await findMatchedPolicy(ctx, args.companyId, args.category, totalAmount)
        : null;

    const requestNumber = await buildRequestNumber(
      ctx,
      company,
      settings.requestIdMode,
    );

    const requestId = await ctx.db.insert("requests", {
      requestNumber,
      companyId: args.companyId,
      requesterId: args.userId,
      category: args.category,
      description: args.description,
      totalAmount,
      status: "draft",
      selectedQuoteId: undefined,
      quoteJustification: args.quoteJustification?.trim() || undefined,
      singleSourceExceptionEnabled: Boolean(args.singleSourceExceptionEnabled),
      singleSourceExceptionReason:
        args.singleSourceExceptionReason?.trim() || undefined,
      policyId: matchedPolicy?.policy._id,
      policyVersionNumber: matchedPolicy?.version.versionNumber,
      policySnapshotJson: serializeJson(
        matchedPolicy
          ? buildPolicySnapshot(matchedPolicy.policy, matchedPolicy.version)
          : {
              name: null,
              category: args.category,
              businessSteps: [],
              requiresFinanceDisbursement: true,
            },
      ),
      currentApprovalStepIndex: undefined,
      rejectionReason: undefined,
      recalledReason: undefined,
      createdAt: now,
      submittedAt: undefined,
      updatedAt: now,
      rejectedAt: undefined,
      recalledAt: undefined,
    });

    for (const payee of args.payees) {
      await ctx.db.insert("lineItems", {
        requestId,
        payeeName: payee.payeeName,
        bankName: payee.bankName,
        accountNumber: payee.accountNumber,
        amount: payee.amount,
        isPaid: false,
        paidAt: undefined,
        paymentReference: undefined,
        createdAt: now,
      });
    }

    const quotes = args.quotes ?? [];
    const quoteIds = [];
    for (const quote of quotes) {
      quoteIds.push(
        await ctx.db.insert("requestQuotes", {
          requestId,
          vendorName: quote.vendorName,
          quotedAmount: quote.quotedAmount,
          quoteReference: quote.quoteReference,
          validityDate: quote.validityDate,
          notes: quote.notes,
          attachmentUrl: quote.attachmentUrl,
          isSelected: false,
          createdAt: now,
        }),
      );
    }

    const selectedQuoteId =
      args.selectedQuoteIndex !== undefined
        ? quoteIds[args.selectedQuoteIndex]
        : undefined;

    if (selectedQuoteId) {
      await ctx.db.patch(requestId, { selectedQuoteId });
      await ctx.db.patch(selectedQuoteId, { isSelected: true });
    }

    await insertTimelineEvent(ctx, {
      requestId,
      actionType: "Draft saved",
      actorUserId: args.userId,
      note: matchedPolicy ? `Matched policy: ${matchedPolicy.policy.name}` : "No policy matched yet",
      createdAt: now,
    });

    return {
      requestId,
      requestNumber,
      status: "draft",
    };
  },
});

export const submitRequest = mutation({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
    category: v.string(),
    description: v.string(),
    payees: v.array(payeeInput),
    quotes: v.optional(v.array(quoteInput)),
    selectedQuoteIndex: v.optional(v.number()),
    quoteJustification: v.optional(v.string()),
    singleSourceExceptionEnabled: v.optional(v.boolean()),
    singleSourceExceptionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    ensure(
      viewer.isAdmin || viewer.companyIds.includes(args.companyId),
      "You do not have access to create requests for this company.",
    );

    validatePayees(args.payees);

    const company = await getCompanyOrThrow(ctx, args.companyId);
    const requestSettings = await getRequestSettingsForCompany(ctx, args.companyId);
    const totalAmount = sumLineItemsAmount(args.payees);
    const matched = await findMatchedPolicy(
      ctx,
      args.companyId,
      args.category,
      totalAmount,
    );

    ensure(
      matched,
      "No active approval policy matches this company, category, and amount.",
    );

    const quotes = args.quotes ?? [];
    validateQuotes({
      quotes,
      selectedQuoteIndex: args.selectedQuoteIndex,
      quoteJustification: args.quoteJustification,
      singleSourceExceptionEnabled: args.singleSourceExceptionEnabled,
      singleSourceExceptionReason: args.singleSourceExceptionReason,
      policyVersion: matched.version,
    });

    const now = nowIso();
    const requestNumber = await buildRequestNumber(
      ctx,
      company,
      requestSettings.requestIdMode,
    );
    const snapshot = buildPolicySnapshot(matched.policy, matched.version);
    const approvalSteps = buildApprovalSteps(matched.version.businessSteps);
    const routeLabel = buildRouteLabel(
      matched.version.businessSteps,
      matched.version.requiresFinanceDisbursement,
    );

    const requestId = await ctx.db.insert("requests", {
      requestNumber,
      companyId: args.companyId,
      requesterId: args.userId,
      category: args.category,
      description: args.description,
      totalAmount,
      status: approvalSteps.length > 0 ? "in_approval" : "awaiting_finance",
      selectedQuoteId: undefined,
      quoteJustification: args.quoteJustification?.trim() || undefined,
      singleSourceExceptionEnabled: Boolean(args.singleSourceExceptionEnabled),
      singleSourceExceptionReason:
        args.singleSourceExceptionReason?.trim() || undefined,
      policyId: matched.policy._id,
      policyVersionNumber: matched.version.versionNumber,
      policySnapshotJson: serializeJson(snapshot),
      currentApprovalStepIndex: approvalSteps.length > 0 ? 0 : undefined,
      rejectionReason: undefined,
      recalledReason: undefined,
      createdAt: now,
      submittedAt: now,
      updatedAt: now,
      rejectedAt: undefined,
      recalledAt: undefined,
    });

    for (const step of approvalSteps) {
      await ctx.db.insert("requestApprovalSteps", {
        requestId,
        stepOrder: step.stepOrder,
        role: step.role,
        status: step.status,
        actedByUserId: undefined,
        actedAt: undefined,
        note: undefined,
      });
    }

    for (const payee of args.payees) {
      await ctx.db.insert("lineItems", {
        requestId,
        payeeName: payee.payeeName,
        bankName: payee.bankName,
        accountNumber: payee.accountNumber,
        amount: payee.amount,
        isPaid: false,
        paidAt: undefined,
        paymentReference: undefined,
        createdAt: now,
      });
    }

    const quoteIds = [];
    for (const quote of quotes) {
      quoteIds.push(
        await ctx.db.insert("requestQuotes", {
          requestId,
          vendorName: quote.vendorName,
          quotedAmount: quote.quotedAmount,
          quoteReference: quote.quoteReference,
          validityDate: quote.validityDate,
          notes: quote.notes,
          attachmentUrl: quote.attachmentUrl,
          isSelected: false,
          createdAt: now,
        }),
      );
    }

    const selectedQuoteId =
      args.selectedQuoteIndex !== undefined
        ? quoteIds[args.selectedQuoteIndex]
        : undefined;

    if (selectedQuoteId) {
      await ctx.db.patch(requestId, { selectedQuoteId });
      await ctx.db.patch(selectedQuoteId, { isSelected: true });
    }

    await insertTimelineEvent(ctx, {
      requestId,
      actionType: "Submitted",
      actorUserId: args.userId,
      note: `Policy: ${matched.policy.name}`,
      createdAt: now,
    });

    await insertTimelineEvent(ctx, {
      requestId,
      actionType: "Route generated",
      note: routeLabel,
      createdAt: now,
    });

    if (quotes.length > 0) {
      await insertTimelineEvent(ctx, {
        requestId,
        actionType: `${quotes.length} vendor quote${quotes.length > 1 ? "s" : ""} attached`,
        createdAt: now,
      });
    }

    return {
      requestId,
      requestNumber,
      status: approvalSteps.length > 0 ? "in_approval" : "awaiting_finance",
    };
  },
});

export const approveCurrentStep = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);

    ensure(
      request.status === "in_approval",
      "Only requests in approval can be approved.",
    );

    const { steps, pendingIndex, pendingStep } = await getPendingStep(ctx, request._id);
    ensure(pendingStep, "This request does not have a pending approval step.");
    ensure(
      viewerHasRole(viewer, request.companyId, pendingStep.role),
      "You do not have permission to approve the current step.",
    );

    const now = nowIso();
    await ctx.db.patch(pendingStep._id, {
      status: "approved",
      actedByUserId: args.userId,
      actedAt: now,
      note: undefined,
    });

    const nextStep = steps[pendingIndex + 1];

    if (nextStep) {
      await ctx.db.patch(nextStep._id, { status: "pending" });
    }

    await ctx.db.patch(request._id, {
      status: nextStep ? "in_approval" : "awaiting_finance",
      currentApprovalStepIndex: nextStep ? pendingIndex + 1 : undefined,
      updatedAt: now,
    });

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: `${pendingStep.role} approved`,
      actorUserId: args.userId,
      actorRole: pendingStep.role,
      createdAt: now,
    });

    if (!nextStep) {
      await insertTimelineEvent(ctx, {
        requestId: request._id,
        actionType: "All business approvals complete",
        createdAt: now,
      });
    }

    return await hydrateRequest(ctx, await getRequestOrThrow(ctx, request._id));
  },
});

export const rejectCurrentStep = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);

    ensure(
      request.status === "in_approval",
      "Only requests in approval can be rejected.",
    );

    const { pendingStep } = await getPendingStep(ctx, request._id);
    ensure(pendingStep, "This request does not have a pending approval step.");
    ensure(
      viewerHasRole(viewer, request.companyId, pendingStep.role),
      "You do not have permission to reject the current step.",
    );

    const now = nowIso();
    await ctx.db.patch(pendingStep._id, {
      status: "rejected",
      actedByUserId: args.userId,
      actedAt: now,
      note: args.reason,
    });

    await ctx.db.patch(request._id, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: now,
      rejectedAt: now,
    });

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: `${pendingStep.role} rejected`,
      actorUserId: args.userId,
      actorRole: pendingStep.role,
      note: args.reason,
      createdAt: now,
    });

    return await hydrateRequest(ctx, await getRequestOrThrow(ctx, request._id));
  },
});

export const recallRequest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);
    const requestSettings = await getRequestSettingsForCompany(ctx, request.companyId);

    ensure(requestSettings.allowRecall, "Recall is disabled for this workspace.");
    ensure(
      request.status === "in_approval",
      "Only requests in approval can be recalled.",
    );
    ensure(
      viewer.isAdmin || request.requesterId === args.userId,
      "Only the requester or an admin can recall this request.",
    );

    const steps = await getStepsForRequest(ctx, request._id);
    const now = nowIso();

    for (const step of steps) {
      if (step.status === "waiting" || step.status === "pending") {
        await ctx.db.patch(step._id, { status: "skipped" });
      }
    }

    await ctx.db.patch(request._id, {
      status: "recalled",
      recalledReason: args.reason?.trim() || "Recalled by requester",
      updatedAt: now,
      recalledAt: now,
      currentApprovalStepIndex: undefined,
    });

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: "Request recalled",
      actorUserId: args.userId,
      note: args.reason?.trim() || "Recalled by requester",
      createdAt: now,
    });

    return await hydrateRequest(ctx, await getRequestOrThrow(ctx, request._id));
  },
});

export const resubmitRequest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);
    const requestSettings = await getRequestSettingsForCompany(ctx, request.companyId);

    ensure(requestSettings.allowResubmission, "Resubmission is disabled for this workspace.");
    ensure(
      ["rejected", "recalled"].includes(request.status),
      "Only rejected or recalled requests can be resubmitted.",
    );
    ensure(
      viewer.isAdmin || request.requesterId === args.userId,
      "Only the requester or an admin can resubmit this request.",
    );

    const [quotes, steps] = await Promise.all([
      getQuotesForRequest(ctx, request._id),
      getStepsForRequest(ctx, request._id),
    ]);

    const matched = await findMatchedPolicy(
      ctx,
      request.companyId,
      request.category,
      request.totalAmount,
    );

    ensure(
      matched,
      "No active policy currently matches this request for resubmission.",
    );

    const selectedQuoteIndex = quotes.findIndex(
      (quote) => quote._id === request.selectedQuoteId,
    );

    validateQuotes({
      quotes: quotes.map((quote) => ({
        vendorName: quote.vendorName,
        quotedAmount: quote.quotedAmount,
        quoteReference: quote.quoteReference,
        validityDate: quote.validityDate,
        notes: quote.notes,
        attachmentUrl: quote.attachmentUrl,
      })),
      selectedQuoteIndex: selectedQuoteIndex >= 0 ? selectedQuoteIndex : undefined,
      quoteJustification: request.quoteJustification,
      singleSourceExceptionEnabled: request.singleSourceExceptionEnabled,
      singleSourceExceptionReason: request.singleSourceExceptionReason,
      policyVersion: matched.version,
    });

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    const approvalSteps = buildApprovalSteps(matched.version.businessSteps);
    for (const step of approvalSteps) {
      await ctx.db.insert("requestApprovalSteps", {
        requestId: request._id,
        stepOrder: step.stepOrder,
        role: step.role,
        status: step.status,
        actedByUserId: undefined,
        actedAt: undefined,
        note: undefined,
      });
    }

    const now = nowIso();
    const routeLabel = buildRouteLabel(
      matched.version.businessSteps,
      matched.version.requiresFinanceDisbursement,
    );

    await ctx.db.patch(request._id, {
      status: approvalSteps.length > 0 ? "in_approval" : "awaiting_finance",
      policyId: matched.policy._id,
      policyVersionNumber: matched.version.versionNumber,
      policySnapshotJson: serializeJson(
        buildPolicySnapshot(matched.policy, matched.version),
      ),
      currentApprovalStepIndex: approvalSteps.length > 0 ? 0 : undefined,
      rejectionReason: undefined,
      recalledReason: undefined,
      updatedAt: now,
      rejectedAt: undefined,
      recalledAt: undefined,
      submittedAt: request.submittedAt ?? now,
    });

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: "Resubmitted",
      actorUserId: args.userId,
      createdAt: now,
    });

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: "Route regenerated",
      note: routeLabel,
      createdAt: now,
    });

    return await hydrateRequest(ctx, await getRequestOrThrow(ctx, request._id));
  },
});

export const payLineItem = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
    lineItemId: v.id("lineItems"),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await loadViewer(ctx, args.userId);
    const request = await ensureRequestAccess(ctx, viewer, args.requestId);
    const requestSettings = await getRequestSettingsForCompany(ctx, request.companyId);

    ensure(
      ["awaiting_finance", "partially_paid"].includes(request.status),
      "Only requests awaiting finance can be paid.",
    );
    ensure(
      viewerHasRole(viewer, request.companyId, "Finance"),
      "Only Finance or Admin can mark line items as paid.",
    );
    ensure(
      requestSettings.payoutPerLineItem,
      "This workspace is not configured for per-line-item payouts.",
    );

    const lineItems = await getLineItemsForRequest(ctx, request._id);
    const lineItem = lineItems.find((item) => item._id === args.lineItemId);
    ensure(lineItem, "Line item not found for this request.");
    ensure(!lineItem.isPaid, "This line item has already been paid.");

    const unpaidBefore = lineItems.filter((item) => !item.isPaid).length;
    ensure(
      requestSettings.allowPartialPayment || unpaidBefore === 1,
      "Partial payments are disabled for this workspace.",
    );

    const now = nowIso();
    const reference = args.paymentReference?.trim() || paymentReference();

    await ctx.db.patch(lineItem._id, {
      isPaid: true,
      paidAt: now,
      paymentReference: reference,
    });

    const updatedLineItems = await getLineItemsForRequest(ctx, request._id);
    const allPaid = updatedLineItems.every((item) => item.isPaid);
    const somePaid = updatedLineItems.some((item) => item.isPaid);

    await ctx.db.patch(request._id, {
      status: allPaid ? "paid" : somePaid ? "partially_paid" : request.status,
      updatedAt: now,
    });

    const actorRole = viewer.isAdmin ? "Admin" : "Finance";

    await insertTimelineEvent(ctx, {
      requestId: request._id,
      actionType: `Paid: ${lineItem.payeeName}`,
      actorUserId: args.userId,
      actorRole,
      note: `${lineItem.bankName} · ₦${lineItem.amount.toLocaleString("en-NG")}`,
      metadata: { paymentReference: reference },
      createdAt: now,
    });

    if (allPaid) {
      await insertTimelineEvent(ctx, {
        requestId: request._id,
        actionType: "All payments complete",
        createdAt: now,
      });
    }

    return await hydrateRequest(ctx, await getRequestOrThrow(ctx, request._id));
  },
});
