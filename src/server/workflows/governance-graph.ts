/**
 * Payrail LangGraph Governance Workflow
 *
 * Manages multi-admin approval for system-level changes.
 * Changes include: policy modifications, role changes, company settings,
 * governance threshold changes.
 *
 * State machine: propose → await_votes → check_quorum → apply/reject
 */

// ─── State Definition ───

export interface GovernanceWorkflowState {
  change_request_id: string;
  company_id: string;
  change_type: GovernanceChangeType;
  description: string;
  required_approvals: number;
  votes: GovernanceVote[];
  status: GovernanceStatus;
  change_payload: Record<string, unknown>;
  proposed_by: string;
  error: string | null;
}

export type GovernanceChangeType =
  | "policy_change"
  | "user_role_change"
  | "company_settings_change"
  | "request_rule_change"
  | "governance_threshold_change";

export type GovernanceStatus = "pending" | "approved" | "rejected";

export interface GovernanceVote {
  admin_id: string;
  decision: "approve" | "reject";
  reason?: string;
  timestamp: number;
}

// ─── State Machine Nodes ───

/**
 * Propose a governance change.
 * The proposer's approval counts as the first vote.
 */
export function proposeChangeNode(
  changeRequestId: string,
  companyId: string,
  changeType: GovernanceChangeType,
  description: string,
  payload: Record<string, unknown>,
  proposedBy: string,
  threshold: number
): GovernanceWorkflowState {
  // For governance_threshold_change, always require at least 2 approvals
  const requiredApprovals =
    changeType === "governance_threshold_change"
      ? Math.max(threshold, 2)
      : threshold;

  const state: GovernanceWorkflowState = {
    change_request_id: changeRequestId,
    company_id: companyId,
    change_type: changeType,
    description,
    required_approvals: requiredApprovals,
    votes: [
      {
        admin_id: proposedBy,
        decision: "approve",
        timestamp: Date.now(),
      },
    ],
    status: "pending",
    change_payload: payload,
    proposed_by: proposedBy,
    error: null,
  };

  // If threshold is 1, apply immediately
  if (requiredApprovals <= 1) {
    return { ...state, status: "approved" };
  }

  return state;
}

/**
 * Process an admin vote.
 */
export function processVoteNode(
  state: GovernanceWorkflowState,
  adminId: string,
  decision: "approve" | "reject",
  reason?: string
): GovernanceWorkflowState {
  if (state.status !== "pending") {
    return { ...state, error: "Change request is no longer pending" };
  }

  // Check for duplicate vote
  if (state.votes.some((v) => v.admin_id === adminId)) {
    return { ...state, error: "Admin has already voted" };
  }

  const newVote: GovernanceVote = {
    admin_id: adminId,
    decision,
    reason,
    timestamp: Date.now(),
  };

  const updatedVotes = [...state.votes, newVote];

  // If any admin rejects, the whole change is rejected (single-reject veto)
  if (decision === "reject") {
    return {
      ...state,
      votes: updatedVotes,
      status: "rejected",
      error: null,
    };
  }

  // Count approvals
  const approvalCount = updatedVotes.filter((v) => v.decision === "approve").length;

  if (approvalCount >= state.required_approvals) {
    return {
      ...state,
      votes: updatedVotes,
      status: "approved",
      error: null,
    };
  }

  return {
    ...state,
    votes: updatedVotes,
    error: null,
  };
}

/**
 * Check if a governance change should be applied.
 */
export function shouldApplyChange(state: GovernanceWorkflowState): boolean {
  return state.status === "approved";
}

/**
 * Check if the threshold is valid (not more than available admins).
 */
export function validateThreshold(
  newThreshold: number,
  activeAdminCount: number
): { valid: boolean; warning?: string } {
  if (newThreshold < 1) {
    return { valid: false, warning: "Governance threshold must be at least 1" };
  }
  if (newThreshold > activeAdminCount) {
    return {
      valid: true,
      warning: `Warning: threshold (${newThreshold}) exceeds active admin count (${activeAdminCount}). Changes may get stuck.`,
    };
  }
  return { valid: true };
}
