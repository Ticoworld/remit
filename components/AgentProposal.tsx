"use client";

import { AiAttemptRecord, ParsedAction, ParserUsed } from "@/lib/types";

interface Props {
  isParsing: boolean;
  parseError: string | null;
  parsedAction: ParsedAction | null;
  parserUsed: ParserUsed | null;
  aiAttempt: AiAttemptRecord | null;
}

const AI_OUTCOME_LABEL: Record<string, string> = {
  "ai-accepted":        "AI parsed",
  "ai-low-confidence":  "AI low confidence",
  "ai-invalid-schema":  "AI invalid schema",
  "ai-unparsed":        "AI could not parse",
  "ai-error":           "AI error",
  "ai-skipped":         "AI omitted",
};

export default function AgentProposal({
  isParsing,
  parseError,
  parsedAction,
  parserUsed,
  aiAttempt,
}: Props) {
  const isIdle = !isParsing && !parseError && !parsedAction && !aiAttempt;

  return (
    <section className={`border border-neutral-700/80 bg-neutral-800/20 rounded-xl p-5 sm:p-6 shadow-sm transition-all duration-300 ${isIdle ? "opacity-60" : "opacity-100"}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2 tracking-tight">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            Agent Proposal
          </h2>
        </div>

        {isIdle && !isParsing && (
          <div className="flex items-center justify-center p-4 border border-dashed border-neutral-800/60 rounded-xl bg-neutral-900/10">
             <div className="text-center">
               <p className="text-sm text-neutral-400 font-medium">No proposal yet</p>
               <p className="text-xs text-neutral-600 mt-0.5">Submit a task to see the interpreted action</p>
             </div>
          </div>
        )}

        {isParsing && (
          <div className="flex items-center justify-center p-4 border border-dashed border-neutral-800/60 rounded-xl bg-neutral-900/10">
             <span className="text-xs text-blue-400 font-mono animate-pulse flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Generating proposal...
             </span>
          </div>
        )}

        {parseError && !isParsing && (
          <div className="p-4 border border-red-900/40 rounded-xl bg-red-950/10">
            <span className="text-sm font-medium text-red-400">Failed to interpret action</span>
            <span className="block text-xs text-red-400/70 mt-1 font-mono">{parseError}</span>
          </div>
        )}

        {parsedAction && !isParsing && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Action Details List */}
            <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-md border border-neutral-800/80 font-mono text-sm shadow-inner">
              <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-sans font-bold">Asset</span>
                <span className="text-neutral-100">{parsedAction.asset}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-sans font-bold">Amount</span>
                <span className="text-neutral-100">{parsedAction.amount}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-sans font-bold">Recipient</span>
                <span className="text-neutral-300 truncate text-xs" title={parsedAction.recipient}>{parsedAction.recipient}</span>
              </div>
            </div>

            {/* AI Source / Rationale */}
            {(aiAttempt || parserUsed) && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {parserUsed && (
                    <span className="px-1.5 py-0.5 rounded flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 tracking-widest font-semibold uppercase">
                      PARSER: {parserUsed === "ai" ? "AGENT" : "FALLBACK"}
                    </span>
                  )}
                  {aiAttempt && (
                    <span className="px-1.5 py-0.5 rounded flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 tracking-widest font-semibold uppercase">
                      <span className={`w-1.5 h-1.5 rounded-full ${aiAttempt.outcome === 'ai-accepted' ? 'bg-green-500' : aiAttempt.outcome.includes('error') || aiAttempt.outcome.includes('invalid') ? 'bg-red-500' : aiAttempt.outcome.includes('low') || aiAttempt.outcome.includes('unparsed') ? 'bg-amber-500' : 'bg-neutral-500'}`}></span>
                      {AI_OUTCOME_LABEL[aiAttempt.outcome] || aiAttempt.outcome}
                    </span>
                  )}
                  {aiAttempt?.confidence !== undefined && (
                    <span className="px-1.5 py-0.5 rounded flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 tracking-widest font-semibold uppercase">
                      CONF: {(aiAttempt.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {aiAttempt?.rationale && (
                  <p className="text-xs text-neutral-400 font-mono bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/40 leading-relaxed">
                    <span className="text-neutral-500 mr-2">›</span>
                    {aiAttempt.rationale}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
