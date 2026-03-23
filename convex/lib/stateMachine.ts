// ─── REQUEST STATUS TYPES ───
export type RequestStatus =
  | "draft"
  | "submitted"
  | "in_approval"
  | "approved"
  | "awaiting_finance"
  | "partially_paid"
  | "paid"
  | "rejected"
  | "resubmitted";

export type ApprovalStepStatus =
  | "pending"
  | "waiting"
  | "approved"
  | "rejected"
  | "skipped";

export type LineItemPayoutStatus = "unpaid" | "paid";

// ─── TRANSITION TABLE ───
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ["submitted"],
  submitted: ["in_approval", "approved", "rejected"],
  in_approval: ["in_approval", "approved", "rejected"],
  approved: ["awaiting_finance"],
  awaiting_finance: ["partially_paid", "paid"],
  partially_paid: ["partially_paid", "paid"],
  paid: [],
  rejected: ["resubmitted"],
  resubmitted: ["submitted"],
};

// ─── TRANSITION VALIDATION ───
export function canTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: RequestStatus,
  to: RequestStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `INVALID_TRANSITION: Cannot transition from "${from}" to "${to}"`
    );
  }
}

// ─── DERIVED STATUS FROM LINE ITEMS ───
export function derivePayoutStatus(
  lineItemStatuses: LineItemPayoutStatus[]
): "awaiting_finance" | "partially_paid" | "paid" {
  if (lineItemStatuses.length === 0) return "awaiting_finance";
  const paidCount = lineItemStatuses.filter((s) => s === "paid").length;
  if (paidCount === 0) return "awaiting_finance";
  if (paidCount === lineItemStatuses.length) return "paid";
  return "partially_paid";
}

// ─── STEP ADVANCEMENT LOGIC ───
export function determineNextStatus(
  currentStepIndex: number,
  totalSteps: number,
  decision: "approved" | "rejected"
): { newRequestStatus: RequestStatus; nextStepIndex: number | null } {
  if (decision === "rejected") {
    return { newRequestStatus: "rejected", nextStepIndex: null };
  }

  // Approved — check if more steps
  const nextIndex = currentStepIndex + 1;
  if (nextIndex >= totalSteps) {
    // All steps complete
    return { newRequestStatus: "approved", nextStepIndex: null };
  }

  // More steps remain
  return {
    newRequestStatus: totalSteps > 1 ? "in_approval" : "submitted",
    nextStepIndex: nextIndex,
  };
}

// ─── REQUEST NUMBER GENERATION ───
export function formatRequestNumber(
  year: number,
  sequence: number
): string {
  return `PR-${year}-${String(sequence).padStart(4, "0")}`;
}
