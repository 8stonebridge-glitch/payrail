/**
 * Payrail Workflow Orchestration Layer
 *
 * This module exports the three LangGraph-style workflow state machines
 * that power Payrail's core business logic.
 *
 * Architecture:
 * - Each workflow is implemented as a set of pure state transition functions
 * - State is persisted by Convex (the database layer)
 * - LangGraph patterns (state, nodes, conditional edges) are applied structurally
 * - The workflows can be upgraded to full LangGraph.js graphs when needed
 *
 * Workflows:
 * 1. ApprovalGraph - Request submission through dynamic approval steps
 * 2. FinanceGraph - Line-item-level disbursement after business approval
 * 3. GovernanceGraph - Multi-admin approval for system configuration changes
 */

export {
  type ApprovalWorkflowState,
  type ApprovalStepState,
  type WorkflowAction,
  processApprovalAction,
  submitNode,
  routeStepNode,
  approveStepNode,
  rejectStepNode,
  resubmitNode,
  routeAction,
  checkCompletion,
} from "./approval-graph";

export {
  type FinanceWorkflowState,
  type FinanceLineItem,
  type PayoutAction,
  initFinanceNode,
  processPayoutNode,
  isFinanceComplete,
  deriveRequestStatus,
} from "./finance-graph";

export {
  type GovernanceWorkflowState,
  type GovernanceVote,
  type GovernanceChangeType,
  proposeChangeNode,
  processVoteNode,
  shouldApplyChange,
  validateThreshold,
} from "./governance-graph";
