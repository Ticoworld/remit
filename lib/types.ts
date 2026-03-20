// ─── Policy ─────────────────────────────────────────────────────────────────

export interface RemitPolicy {
  approvedAddresses: string[];
  approvedAsset: "CKB";
  maxSpendPerAction: number;   // CKB
  approvalThreshold: number;   // amounts above this need human sign-off
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

export type ParserUsed = "ai" | "fallback";

export interface ParsedAction {
  asset: string;
  amount: number;
  recipient: string;
  raw: string;
}

/**
 * Describes what happened during the AI parsing attempt.
 * Always recorded for every task submission — even when AI was skipped.
 */
export type AiAttemptOutcome =
  | "ai-accepted"        // AI result passed schema + confidence; was used
  | "ai-low-confidence"  // schema passed, confidence < threshold; fell back to regex
  | "ai-invalid-schema"  // Zod validation failed; fell back to regex
  | "ai-unparsed"        // AI returned status="unparsed"; fell back to regex
  | "ai-error"           // network / config error; fell back to regex
  | "ai-skipped";        // env vars not configured; regex used directly

export interface AiAttemptRecord {
  outcome: AiAttemptOutcome;
  confidence?: number;   // present when schema was valid
  rationale?: string;    // present when schema was valid
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

export type EvaluationStatus = "allowed" | "blocked" | "approval-needed";

export interface EvaluationResult {
  status: EvaluationStatus;
  reason: string;
  action: ParsedAction;
}

// ─── Approval queue ──────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalQueueItem {
  id: string;
  timestamp: Date;
  task: string;
  parserUsed: ParserUsed;
  parsedAction: ParsedAction;
  result: EvaluationResult;
  approvalStatus: ApprovalStatus;
  aiAttempt?: AiAttemptRecord;
  txHash?: string;
}

// ─── Execution history ────────────────────────────────────────────────────────

export interface ExecutionLogEntry {
  id: string;
  timestamp: Date;
  task: string;
  parserUsed: ParserUsed;
  result: EvaluationResult;        // contains action, status, reason
  aiAttempt?: AiAttemptRecord;     // full AI trust audit record
  txHash?: string;
  approvalDecision?: "approved" | "rejected";
}
