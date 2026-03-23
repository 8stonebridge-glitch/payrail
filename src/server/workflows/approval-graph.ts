/**
 * Payrail LangGraph Approval Workflow
 *
 * Manages the request approval lifecycle:
 * submit → route_step → await_action → approve/reject → check_completion → loop/done
 *
 * This module defines the graph structure. In the Convex architecture,
 * the actual state persistence is handled by Convex's own reactive system.
 * LangGraph provides the orchestration logic and state machine definition.
 *
 * Integration: Called from Convex mutations (requests.ts, approvals.ts)
 * as a pure state machine rather than running as a separate server.
 */

// ─── State Definition ───

export interface ApprovalWorkflowState {
  request_id: string;
  company_id: string;
  status: RequestStatus;
  steps: ApprovalStepState[];
  current_step_index: number;
  submission_number: number;
  rejection_count: number;
  last_action: WorkflowAction | null;
  error: string | null;
}

export type RequestStatus =
  | "draft"
  | "submitted"
  | "in_approval"
  | "approved"
  | "awaiting_finance"
  | "rejected"
  | "partially_paid"
  | "paid";

export interface ApprovalStepState {
  step_order: number;
  required_role: string;
  label: string;
  status: "pending" | "waiting" | "approved" | "rejected" | "skipped";
  acted_by?: string;
  acted_at?: number;
  rejection_reason?: string;
}

export interface WorkflowAction {
  type: "submit" | "approve" | "reject" | "resubmit";
  actor_id: string;
  timestamp: number;
  reason?: string;
}

// ─── Transition Functions (Pure) ───

/**
 * Submit: Generate approval steps from policy and transition to in_approval.
 */
export function submitNode(state: ApprovalWorkflowState): ApprovalWorkflowState {
  if (state.steps.length === 0) {
    return { ...state, error: "No approval steps generated. Check policy configuration." };
  }

  // Mark first step as "waiting"
  const steps = state.steps.map((step, i) => ({
    ...step,
    status: (i === 0 ? "waiting" : "pending") as ApprovalStepState["status"],
  }));

  return {
    ...state,
    status: state.steps.length === 1 ? "submitted" : "in_approval",
    steps,
    current_step_index: 0,
    submission_number: state.submission_number + 1,
    error: null,
  };
}

/**
 * Route: Find the next pending step and mark it as waiting.
 */
export function routeStepNode(state: ApprovalWorkflowState): ApprovalWorkflowState {
  const nextIndex = state.steps.findIndex(
    (s) => s.status === "pending" || s.status === "waiting"
  );

  if (nextIndex === -1) {
    // All steps approved
    return { ...state, status: "approved", current_step_index: -1 };
  }

  const steps = state.steps.map((step, i) => ({
    ...step,
    status: (i === nextIndex && step.status === "pending" ? "waiting" : step.status) as ApprovalStepState["status"],
  }));

  return { ...state, steps, current_step_index: nextIndex };
}

/**
 * Approve: Mark current step as approved, advance.
 */
export function approveStepNode(
  state: ApprovalWorkflowState,
  actorId: string
): ApprovalWorkflowState {
  const currentStep = state.steps[state.current_step_index];
  if (!currentStep || currentStep.status !== "waiting") {
    return { ...state, error: "No waiting step to approve" };
  }

  const steps = state.steps.map((step, i) => {
    if (i === state.current_step_index) {
      return {
        ...step,
        status: "approved" as const,
        acted_by: actorId,
        acted_at: Date.now(),
      };
    }
    return step;
  });

  const newState: ApprovalWorkflowState = {
    ...state,
    steps,
    last_action: {
      type: "approve",
      actor_id: actorId,
      timestamp: Date.now(),
    },
    error: null,
  };

  // Check if all steps are now approved
  const allApproved = steps.every(
    (s) => s.status === "approved" || s.status === "skipped"
  );

  if (allApproved) {
    return { ...newState, status: "approved", current_step_index: -1 };
  }

  // Advance to next step
  return routeStepNode(newState);
}

/**
 * Reject: Mark current step as rejected, move request to rejected status.
 */
export function rejectStepNode(
  state: ApprovalWorkflowState,
  actorId: string,
  reason: string
): ApprovalWorkflowState {
  const currentStep = state.steps[state.current_step_index];
  if (!currentStep || currentStep.status !== "waiting") {
    return { ...state, error: "No waiting step to reject" };
  }

  const steps = state.steps.map((step, i) => {
    if (i === state.current_step_index) {
      return {
        ...step,
        status: "rejected" as const,
        acted_by: actorId,
        acted_at: Date.now(),
        rejection_reason: reason,
      };
    }
    return step;
  });

  return {
    ...state,
    steps,
    status: "rejected",
    rejection_count: state.rejection_count + 1,
    current_step_index: -1,
    last_action: {
      type: "reject",
      actor_id: actorId,
      timestamp: Date.now(),
      reason,
    },
    error: null,
  };
}

/**
 * Resubmit: Reset with new steps from current policy.
 * The new steps are passed in (generated externally from the policy engine).
 */
export function resubmitNode(
  state: ApprovalWorkflowState,
  newSteps: ApprovalStepState[]
): ApprovalWorkflowState {
  return submitNode({
    ...state,
    steps: newSteps,
    last_action: {
      type: "resubmit",
      actor_id: state.last_action?.actor_id ?? "unknown",
      timestamp: Date.now(),
    },
  });
}

// ─── Graph Definition ───

export type ApprovalGraphNode =
  | "submit"
  | "route_step"
  | "approve_step"
  | "reject_step"
  | "resubmit"
  | "completed"
  | "rejected";

/**
 * Determines the next node based on the action type.
 * This is the conditional router in the LangGraph.
 */
export function routeAction(action: WorkflowAction["type"]): ApprovalGraphNode {
  switch (action) {
    case "submit":
      return "submit";
    case "approve":
      return "approve_step";
    case "reject":
      return "reject_step";
    case "resubmit":
      return "resubmit";
    default:
      return "submit";
  }
}

/**
 * Determines if the workflow is complete or needs to continue.
 */
export function checkCompletion(state: ApprovalWorkflowState): "route_step" | "completed" | "rejected" {
  if (state.status === "approved") return "completed";
  if (state.status === "rejected") return "rejected";
  return "route_step";
}

// ─── Integration Helper ───

/**
 * Process an action through the approval workflow state machine.
 * This is the main entry point called from Convex mutations.
 *
 * Returns the new state after processing the action.
 */
export function processApprovalAction(
  currentState: ApprovalWorkflowState,
  action: WorkflowAction,
  newStepsForResubmit?: ApprovalStepState[]
): ApprovalWorkflowState {
  switch (action.type) {
    case "submit":
      return submitNode(currentState);

    case "approve":
      return approveStepNode(currentState, action.actor_id);

    case "reject":
      return rejectStepNode(currentState, action.actor_id, action.reason ?? "No reason provided");

    case "resubmit":
      if (!newStepsForResubmit || newStepsForResubmit.length === 0) {
        return { ...currentState, error: "No steps provided for resubmission" };
      }
      return resubmitNode(currentState, newStepsForResubmit);

    default:
      return { ...currentState, error: `Unknown action type: ${action.type}` };
  }
}
