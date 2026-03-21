"use client";

import { useState } from "react";
import { EvaluationResult, ParserUsed } from "@/lib/types";
import { ExecErrorInfo } from "@/lib/error-messages";
import { NetworkConfig, getTxExplorerUrl } from "@/lib/network-config";

interface Props {
  result: EvaluationResult | null;
  parseError: string | null;
  validationError: string | null;
  parserUsed: ParserUsed | null;
  onExecute: () => void;
  onSeeApprovals?: () => void;
  executing: boolean;
  execError: ExecErrorInfo | null;
  txHash: string | null;
  networkConfig: NetworkConfig;
}

const STATUS_CFG = {
  allowed: {
    label: "ALLOWED",
    bannerBg: "bg-green-950/10",
    cardBorder: "border-green-800/60 shadow-sm",
    badge: "bg-green-500/10 text-green-400 border border-green-500/20",
    text: "text-neutral-100",
    footerText: "text-green-500",
  },
  blocked: {
    label: "BLOCKED",
    bannerBg: "bg-red-950/10",
    cardBorder: "border-red-800/60 shadow-sm",
    badge: "bg-red-500/10 text-red-500 border border-red-800/40",
    text: "text-neutral-100",
    footerText: "text-red-400 font-semibold",
  },
  "approval-needed": {
    label: "APPROVAL NEEDED",
    bannerBg: "bg-amber-950/10",
    cardBorder: "border-amber-800/60 border-b-dashed shadow-sm",
    badge: "bg-amber-500/10 text-amber-500 border border-amber-600/30",
    text: "text-neutral-100",
    footerText: "text-amber-500 font-semibold",
  },
} as const;



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
      className="text-xs font-mono px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 hover:bg-neutral-700 transition-all active:scale-95"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}



export default function EvaluationPanel({
  result,
  parseError,
  validationError,
  parserUsed,
  onExecute,
  onSeeApprovals,
  executing,
  execError,
  txHash,
  networkConfig,
}: Props) {
  const explorerUrl = txHash ? getTxExplorerUrl(txHash, networkConfig) : null;

  return (
    <section className="border border-neutral-700/80 bg-neutral-900/40 rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
      <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 tracking-tight pl-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
        Decision
      </h2>

      {!result && !parseError && !validationError && (
        <div className="flex items-center justify-center p-6 sm:p-8 border border-dashed border-neutral-800/80 rounded-xl bg-neutral-900/20 transition-all duration-500 hover:bg-neutral-900/40 group gap-4">
          <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center ring-1 ring-neutral-800 text-neutral-500 shadow-sm animate-pulse shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-neutral-400 font-semibold tracking-wide">Awaiting Evaluation</p>
            <p className="text-xs text-neutral-600 mt-0.5">Submit a task to see the agent&apos;s decision.</p>
          </div>
        </div>
      )}

      {parseError && (
        <div className="border border-red-800/60 rounded-xl p-4 bg-red-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-red-400 font-medium">Parse error: {parseError}</p>
        </div>
      )}

      {validationError && (
        <div className="border border-amber-800/60 rounded-xl p-4 bg-amber-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-amber-400 font-medium">Validation: {validationError}</p>
        </div>
      )}



      {result && (() => {
        const cfg = STATUS_CFG[result.status];
        
        // Split reason into a strong primary sentence and secondary explanation
        const parts = result.reason.split(". ");
        const primaryReason = parts[0] + (parts.length > 1 ? "." : "");
        const secondaryReason = parts.slice(1).join(". ");

        return (
          <div className={`mt-1 border ${cfg.cardBorder} ${cfg.bannerBg} rounded-xl p-5 sm:p-6 flex flex-col gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out`}>

            {/* Status badge + parser */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-widest uppercase animate-in zoom-in duration-300 delay-150 fill-mode-both ${cfg.badge}`}>
                {result.status === "allowed" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {result.status === "approval-needed" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                )}
                {result.status === "blocked" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                )}
                {cfg.label}
              </span>
              {parserUsed && (
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest bg-black/20 px-2.5 py-1 rounded border border-neutral-800/80 animate-in fade-in duration-500 delay-200 fill-mode-both">
                  {parserUsed}
                </span>
              )}
            </div>



            {/* Decision summary */}
            <div className="flex flex-col gap-1.5">
              <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold">Decision</span>
              <p className={`text-base font-semibold tracking-tight leading-snug animate-in fade-in slide-in-from-left-2 duration-500 delay-100 fill-mode-both ${cfg.text}`}>
                {primaryReason}
              </p>
            </div>

            {/* Why (Optional) */}
            {secondaryReason && (
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold">Why</span>
                <p className="text-xs text-neutral-400 bg-black/20 px-3 py-2.5 rounded-lg border border-neutral-800/50 leading-relaxed font-mono">
                  {secondaryReason}
                </p>
              </div>
            )}
            
            {/* Execute — only for "allowed" */}
            {result.status === "allowed" && (
              <div className="flex flex-col gap-3 pt-2 border-t border-transparent animate-in fade-in duration-500 delay-300 fill-mode-both">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold">Next step</span>
                <button
                  onClick={onExecute}
                  disabled={executing || !!txHash}
                  className="w-full sm:w-auto self-start px-6 py-3.5 bg-green-500 text-green-950 text-sm font-extrabold tracking-wide rounded-xl hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
                >
                  {executing ? (
                    <span className="animate-spin h-4 w-4 border-2 border-green-900/30 border-t-green-900 rounded-full"></span>
                  ) : txHash ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  )}
                  {executing ? "Deploying Transaction…" : txHash ? "Executed Successfully" : "Execute on Network"}
                </button>

                {/* Execution error */}
                {execError && (
                  <div className="border border-red-900 rounded-xl p-4 bg-red-950/40 flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-base font-semibold text-red-400">{execError.friendly}</p>
                    <p className="text-xs text-red-300/70 font-mono break-all bg-black/30 p-2 rounded">
                      {execError.debug}
                    </p>
                  </div>
                )}

                {/* Tx hash + explorer */}
                {txHash && (
                  <div className="flex flex-col gap-2 mt-2 bg-black/20 p-4 rounded-xl border border-green-900/30 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                    <span className="text-xs text-green-500/80 uppercase tracking-widest font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Transaction broadcasted
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="font-mono text-sm text-green-300 break-all flex-1 py-1">
                        {txHash}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <CopyButton text={txHash} />
                        {explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded bg-blue-900/30 text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 border border-blue-800/50 transition-colors"
                          >
                            Explorer ↗
                          </a>
                        ) : (
                          <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
                            Local network
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocked — decisively final */}
            {result.status === "blocked" && (
              <div className="pt-4 mt-2 border-t border-red-900/30 animate-in fade-in duration-500 delay-300 fill-mode-both">
                <p className={`text-xs ${cfg.footerText} uppercase tracking-widest`}>
                  Transaction blocked. No further action possible.
                </p>
              </div>
            )}

            {/* Approval-needed — clear pipeline direction */}
            {result.status === "approval-needed" && (
              <div className="pt-4 mt-2 border-t border-amber-900/30 flex flex-col gap-1 animate-in fade-in duration-500 delay-300 fill-mode-both">
                <p className={`text-sm ${cfg.footerText}`}>
                  Action queued. A policy owner must approve this transfer to proceed.
                </p>
                <div className="flex items-center mt-1">
                  <button 
                    onClick={onSeeApprovals}
                    className="text-[11px] text-amber-500 hover:text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5 transition-all group cursor-pointer py-1 pr-3"
                  >
                    Go to approval queue
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform duration-300">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
