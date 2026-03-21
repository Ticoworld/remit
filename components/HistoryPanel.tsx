"use client";

import { ExecutionLogEntry } from "@/lib/types";
import { NetworkConfig, getTxExplorerUrl } from "@/lib/network-config";
import { useState } from "react";

interface Props {
  entries: ExecutionLogEntry[];
  onClear: () => void;
  networkConfig: NetworkConfig;
}

const ACCENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  allowed: { bg: "bg-green-500/10", text: "text-green-500/80", border: "border-l-green-600" },
  blocked: { bg: "bg-red-500/10", text: "text-red-500/80", border: "border-l-red-700" },
  "approval-needed": { bg: "bg-amber-500/10", text: "text-amber-500/80", border: "border-l-amber-600" },
};

export default function HistoryPanel({ entries, onClear, networkConfig }: Props) {
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  function handleCopy(txHash: string) {
    navigator.clipboard.writeText(txHash);
    setCopiedTx(txHash);
    setTimeout(() => setCopiedTx(null), 2000);
  }

  // Reverse to show newest first
  const displayEntries = [...entries].reverse();

  return (
    <section className="flex flex-col gap-4 bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800/60 shadow-inner mt-4 transition-all duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 tracking-tight">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          Runtime log
        </h2>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest font-semibold"
          >
            Clear Activity
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center py-3 px-4 rounded-lg bg-neutral-950/30 border border-neutral-800/40 gap-2 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
          <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">No runtime activity</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 relative">
          {displayEntries.map((e, index) => {
            const timeStr = new Date(e.timestamp).toLocaleTimeString();
            const accent = ACCENT_COLOR[e.result.status] || ACCENT_COLOR["blocked"];
            const explorerUrl = e.txHash ? getTxExplorerUrl(e.txHash, networkConfig) : null;
            
            // Stagger initial load animation up to 10 items
            const delayClass = index < 10 ? `delay-[${index * 50}ms]` : '';

            return (
              <div
                key={e.id}
                className={`py-3 px-4 rounded-xl border border-neutral-800/80 bg-neutral-950 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-sm border-l-2 ${accent.border} animate-in fade-in slide-in-from-top-2 duration-400 ease-out fill-mode-both ${delayClass}`}
              >
                {/* Left side: Task and metadata */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-neutral-200 truncate">
                    {e.task}
                  </span>
                  
                  {e.result.action && (
                    <div className="flex gap-3 text-[11px] font-mono text-neutral-500">
                      <span>
                        <span className="text-neutral-600">asset:</span>{" "}
                        {e.result.action.asset}
                      </span>
                      <span>
                        <span className="text-neutral-600">amt:</span>{" "}
                        {e.result.action.amount}
                      </span>
                      <span className="truncate flex-1">
                        <span className="text-neutral-600">to:</span>{" "}
                        {e.result.action.recipient}
                      </span>
                    </div>
                  )}

                  {e.result.reason && (
                    <span className="text-xs text-neutral-400 font-medium">
                      {e.result.reason}
                    </span>
                  )}
                </div>

                {/* Right side: Status and Tx Hash */}
                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {timeStr}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${accent.bg} ${accent.text}`}>
                      {e.result.status}
                    </span>
                  </div>

                  {e.txHash && (
                    <div className="flex items-center gap-1.5 mt-1 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {e.txHash.slice(0, 6)}...{e.txHash.slice(-4)}
                      </span>
                      {explorerUrl && (
                        <a
                           href={explorerUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-[10px] text-blue-500/80 hover:text-blue-400 hover:underline shrink-0 ml-1 mr-1"
                         >
                           Explorer ↗
                         </a>
                      )}
                      <button
                        onClick={() => handleCopy(e.txHash!)}
                        className="text-neutral-500 hover:text-white transition-colors ml-1"
                        title="Copy Transaction Hash"
                      >
                        {copiedTx === e.txHash ? (
                          <span className="text-green-400 text-[10px] font-bold">✓</span>
                        ) : (
                          <svg
                            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
