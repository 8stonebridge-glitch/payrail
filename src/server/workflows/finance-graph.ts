/**
 * Payrail LangGraph Finance Workflow
 *
 * Manages line-item-level disbursement after business approval.
 * Tracks individual line item payments and derives overall finance status.
 *
 * State machine: awaiting → partial payment → full payment
 */

// ─── State Definition ───

export interface FinanceWorkflowState {
  request_id: string;
  company_id: string;
  line_items: FinanceLineItem[];
  paid_count: number;
  total_count: number;
  finance_status: FinanceStatus;
  last_payout: PayoutAction | null;
  error: string | null;
}

export interface FinanceLineItem {
  id: string;
  description: string;
  payee_name: string;
  amount: number;
  payout_status: "unpaid" | "paid";
  paid_by?: string;
  paid_at?: number;
  payment_reference?: string;
}

export type FinanceStatus = "awaiting" | "partially_paid" | "paid";

export interface PayoutAction {
  line_item_id: string;
  actor_id: string;
  payment_reference: string;
  timestamp: number;
}

// ─── State Machine Nodes ───

/**
 * Initialize finance workflow from approved request line items.
 */
export function initFinanceNode(
  requestId: string,
  companyId: string,
  lineItems: FinanceLineItem[]
): FinanceWorkflowState {
  return {
    request_id: requestId,
    company_id: companyId,
    line_items: lineItems,
    paid_count: 0,
    total_count: lineItems.length,
    finance_status: "awaiting",
    last_payout: null,
    error: null,
  };
}

/**
 * Process a line item payment.
 */
export function processPayoutNode(
  state: FinanceWorkflowState,
  action: PayoutAction
): FinanceWorkflowState {
  const lineItem = state.line_items.find((li) => li.id === action.line_item_id);

  if (!lineItem) {
    return { ...state, error: `Line item ${action.line_item_id} not found` };
  }

  if (lineItem.payout_status === "paid") {
    return { ...state, error: `Line item ${action.line_item_id} is already paid` };
  }

  // Update line item
  const updatedItems = state.line_items.map((li) => {
    if (li.id === action.line_item_id) {
      return {
        ...li,
        payout_status: "paid" as const,
        paid_by: action.actor_id,
        paid_at: action.timestamp,
        payment_reference: action.payment_reference,
      };
    }
    return li;
  });

  // Derive status
  const paidCount = updatedItems.filter((li) => li.payout_status === "paid").length;
  const financeStatus: FinanceStatus =
    paidCount === 0
      ? "awaiting"
      : paidCount === updatedItems.length
        ? "paid"
        : "partially_paid";

  return {
    ...state,
    line_items: updatedItems,
    paid_count: paidCount,
    finance_status: financeStatus,
    last_payout: action,
    error: null,
  };
}

/**
 * Check if finance workflow is complete.
 */
export function isFinanceComplete(state: FinanceWorkflowState): boolean {
  return state.finance_status === "paid";
}

/**
 * Derive the request status from finance state.
 */
export function deriveRequestStatus(
  financeStatus: FinanceStatus
): "awaiting_finance" | "partially_paid" | "paid" {
  switch (financeStatus) {
    case "awaiting":
      return "awaiting_finance";
    case "partially_paid":
      return "partially_paid";
    case "paid":
      return "paid";
  }
}
