"use client";

import { AiAttemptOutcome, ExecutionLogEntry } from "@/lib/types";
import { NetworkConfig, getTxExplorerUrl } from "@/lib/network-config";

interface Props {
  entries: ExecutionLogEntry[];
  onClear: () => void;
  networkConfig: NetworkConfig;
}

const STATUS_COLOR: Record<string, string> = {
  allowed:          "text-green-400",
  blocked:          "text-red-400",
  "approval-needed": "text-amber-400",
};

const AI_OUTCOME_SHORT: Record<AiAttemptOutcome, string> = {
  "ai-accepted":       "AI ✓",
  "ai-low-confidence": "AI low-conf",
  "ai-invalid-schema": "AI bad-schema",
  "ai-unparsed":       "AI unparsed",
  "ai-error":          "AI error",
  "ai-skipped":        "AI skipped",
};

const AI_OUTCOME_COLOR: Record<AiAttemptOutcome, string> = {
  "ai-accepted":       "text-green-600",
  "ai-low-confidence": "text-amber-500",
  "ai-invalid-schema": "text-red-500",
  "ai-unparsed":       "text-neutral-600",
  "ai-error":          "text-red-500",
  "ai-skipped":        "text-neutral-700",
};

export default function HistoryPanel({ entries, onClear, networkConfig }: Props) {
  return (
    <section className="border border-neutral-700 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">
          Execution History
        </h2>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">No evaluations yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {[...entries].reverse().map((entry) => {
            const explorerUrl = entry.txHash
              ? getTxExplorerUrl(entry.txHash, networkConfig)
              : null;

            return (
              <div
                key={entry.id}
                className="flex flex-col gap-1.5 border-b border-neutral-800 pb-3 last:border-0 last:pb-0"
              >
                {/* Top row: time · eval status · AI outcome · parser · approval */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  <span className="text-neutral-600">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={STATUS_COLOR[entry.result.status]}>
                    {entry.result.status}
                  </span>
                  {entry.aiAttempt && (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span className={AI_OUTCOME_COLOR[entry.aiAttempt.outcome]}>
                        {AI_OUTCOME_SHORT[entry.aiAttempt.outcome]}
                      </span>
                      {entry.aiAttempt.confidence !== undefined && (
                        <span className="text-neutral-700">
                          {(entry.aiAttempt.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-neutral-700">·</span>
                  <span className="text-neutral-600">{entry.parserUsed} parser</span>
                  {entry.approvalDecision && (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span
                        className={
                          entry.approvalDecision === "approved"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {entry.approvalDecision}
                      </span>
                    </>
                  )}
                </div>

                {/* Raw task */}
                <span className="text-sm font-mono text-neutral-200 break-all">
                  {entry.task}
                </span>

                {/* Policy reason */}
                <p className="text-xs text-neutral-500 italic">{entry.result.reason}</p>

                {/* AI rationale */}
                {entry.aiAttempt?.rationale && (
                  <p className="text-xs text-neutral-700 italic">
                    AI rationale: {entry.aiAttempt.rationale}
                  </p>
                )}

                {/* Parsed action summary */}
                <div className="flex gap-3 text-xs font-mono text-neutral-600">
                  <span>{entry.result.action.asset}</span>
                  <span>{entry.result.action.amount} CKB</span>
                  <span className="break-all">{entry.result.action.recipient}</span>
                </div>

                {/* Tx hash + explorer */}
                {entry.txHash && (
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs font-mono">
                      <span className="text-neutral-600">tx </span>
                      <span className="text-green-400 break-all">{entry.txHash}</span>
                    </div>
                    {explorerUrl ? (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        View on explorer ↗
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-700">
                        Explorer unavailable (local devnet)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
