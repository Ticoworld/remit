import { EvaluationResult, ParsedAction, RemitPolicy } from "./types";

/**
 * Evaluates a parsed action against a remit policy.
 *
 * Evaluation order:
 * 1. Block if asset is not CKB.
 * 2. Block if recipient is not on the approved list.
 * 3. Block if amount exceeds maxSpendPerAction.
 * 4. Approval-needed if amount exceeds approvalThreshold.
 * 5. Allowed otherwise.
 *
 * Reasons are written for the policy owner to read, not for the AI.
 */
export function evaluateAction(
  action: ParsedAction,
  policy: RemitPolicy,
): EvaluationResult {
  if (action.asset !== "CKB") {
    return {
      status: "blocked",
      reason: `Only CKB is permitted by this remit. "${action.asset}" is not an approved asset.`,
      action,
    };
  }

  if (!policy.approvedAddresses.includes(action.recipient)) {
    return {
      status: "blocked",
      reason: `Recipient is not on the approved address list. The remit does not cover this destination.`,
      action,
    };
  }

  if (action.amount > policy.maxSpendPerAction) {
    return {
      status: "blocked",
      reason: `${action.amount} CKB exceeds the per-action spending limit of ${policy.maxSpendPerAction} CKB. Action cannot proceed.`,
      action,
    };
  }

  if (action.amount > policy.approvalThreshold) {
    return {
      status: "approval-needed",
      reason: `Recipient is approved, but ${action.amount} CKB is above the auto-execute threshold of ${policy.approvalThreshold} CKB. A policy owner must approve before this executes.`,
      action,
    };
  }

  return {
    status: "allowed",
    reason: `Recipient is on the approved list and ${action.amount} CKB is within the auto-execute threshold of ${policy.approvalThreshold} CKB.`,
    action,
  };
}
