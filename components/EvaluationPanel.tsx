"use client";

import { useState } from "react";
import { AiAttemptOutcome, AiAttemptRecord, EvaluationResult, ParserUsed } from "@/lib/types";
import { ExecErrorInfo } from "@/lib/error-messages";
import { NetworkConfig, getTxExplorerUrl } from "@/lib/network-config";

interface Props {
  result: EvaluationResult | null;
  parseError: string | null;
  validationError: string | null;
  parserUsed: ParserUsed | null;
  aiAttempt: AiAttemptRecord | null;
  onExecute: () => void;
  executing: boolean;
  execError: ExecErrorInfo | null;
  txHash: string | null;
  networkConfig: NetworkConfig;
}

const STATUS_CFG = {
  allowed: {
    label: "ALLOWED",
    border: "border-green-600",
    badge: "bg-green-900 text-green-300",
    text: "text-green-300",
  },
  blocked: {
    label: "BLOCKED",
    border: "border-red-700",
    badge: "bg-red-900 text-red-300",
    text: "text-red-400",
  },
  "approval-needed": {
    label: "APPROVAL NEEDED",
    border: "border-amber-500",
    badge: "bg-amber-900 text-amber-300",
    text: "text-amber-300",
  },
} as const;

const AI_OUTCOME_LABEL: Record<AiAttemptOutcome, string> = {
  "ai-accepted":        "AI parsed",
  "ai-low-confidence":  "AI low confidence — regex fallback used",
  "ai-invalid-schema":  "AI invalid schema — regex fallback used",
  "ai-unparsed":        "AI could not parse — regex fallback used",
  "ai-error":           "AI error — regex fallback used",
  "ai-skipped":         "AI not configured — regex parser used",
};

const AI_OUTCOME_COLOR: Record<AiAttemptOutcome, string> = {
  "ai-accepted":        "text-green-400",
  "ai-low-confidence":  "text-amber-400",
  "ai-invalid-schema":  "text-red-400",
  "ai-unparsed":        "text-neutral-500",
  "ai-error":           "text-red-400",
  "ai-skipped":         "text-neutral-600",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-mono px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500 transition-colors"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/** Trim and normalise whitespace in AI rationale text. */
function formatRationale(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 200);
}

export default function EvaluationPanel({
  result,
  parseError,
  validationError,
  parserUsed,
  aiAttempt,
  onExecute,
  executing,
  execError,
  txHash,
  networkConfig,
}: Props) {
  const explorerUrl = txHash ? getTxExplorerUrl(txHash, networkConfig) : null;

  return (
    <section className="border border-neutral-700 rounded-lg p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-100">
        Evaluation Result
      </h2>

      {!result && !parseError && !validationError && (
        <p className="text-sm text-neutral-500">No task evaluated yet.</p>
      )}

      {parseError && (
        <div className="border border-neutral-600 rounded p-3 bg-neutral-900">
          <p className="text-sm text-red-400">Parse error: {parseError}</p>
        </div>
      )}

      {validationError && (
        <div className="border border-amber-800 rounded p-3 bg-neutral-900">
          <p className="text-sm text-amber-400">Validation: {validationError}</p>
        </div>
      )}

      {/* AI pipeline row */}
      {(parseError || validationError || result) && aiAttempt && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs font-mono">
          <span className="text-neutral-600">Parser:</span>
          <span className={AI_OUTCOME_COLOR[aiAttempt.outcome]}>
            {AI_OUTCOME_LABEL[aiAttempt.outcome]}
          </span>
          {aiAttempt.confidence !== undefined && (
            <span className="text-neutral-600">
              · {(aiAttempt.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
          {aiAttempt.rationale && (
            <span className="text-neutral-700 italic">
              — {formatRationale(aiAttempt.rationale)}
            </span>
          )}
        </div>
      )}

      {result && (() => {
        const cfg = STATUS_CFG[result.status];
        return (
          <div className={`border ${cfg.border} rounded p-4 flex flex-col gap-3`}>

            {/* Status badge + parser */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${cfg.badge}`}>
                {cfg.label}
              </span>
              {parserUsed && (
                <span className="text-xs font-mono text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded">
                  {parserUsed} parser
                </span>
              )}
            </div>

            {/* Policy reason */}
            <p className={`text-sm ${cfg.text}`}>{result.reason}</p>

            {/* Action details */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-xs font-mono text-neutral-400">
              <div>
                <span className="text-neutral-600 block mb-0.5">asset</span>
                {result.action.asset}
              </div>
              <div>
                <span className="text-neutral-600 block mb-0.5">amount</span>
                {result.action.amount} CKB
              </div>
              <div>
                <span className="text-neutral-600 block mb-0.5">recipient</span>
                <span className="break-all">{result.action.recipient}</span>
              </div>
            </div>

            {/* Execute — only for "allowed" */}
            {result.status === "allowed" && (
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={onExecute}
                  disabled={executing || !!txHash}
                  className="self-start px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {executing ? "Sending…" : txHash ? "✓ Executed" : "Execute on Network"}
                </button>

                <p className="text-xs text-neutral-700 italic">
                  Dev only: uses a dedicated executor wallet (
                  <span className="font-mono">DEV_SENDER_PRIVATE_KEY</span>
                  ). Policy owner and executor are separate roles in production.
                </p>

                {/* Execution error */}
                {execError && (
                  <div className="border border-red-900 rounded p-3 bg-neutral-900 flex flex-col gap-1">
                    <p className="text-sm text-red-400">{execError.friendly}</p>
                    <p className="text-xs text-neutral-700 font-mono break-all">
                      {execError.debug}
                    </p>
                  </div>
                )}

                {/* Tx hash + explorer */}
                {txHash && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-neutral-600">Transaction hash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-green-400 break-all flex-1">
                        {txHash}
                      </span>
                      <CopyButton text={txHash} />
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
                        Explorer link not available in local devnet mode.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Blocked — no execution path */}
            {result.status === "blocked" && (
              <p className="text-xs text-red-500 pt-1 border-t border-neutral-800">
                This action was blocked by policy and will not execute.
              </p>
            )}

            {/* Approval-needed — points to queue below */}
            {result.status === "approval-needed" && (
              <p className="text-xs text-amber-500 pt-1 border-t border-neutral-800">
                Added to the Approval Queue below. A policy owner must approve
                before this executes.
              </p>
            )}
          </div>
        );
      })()}
    </section>
  );
}
