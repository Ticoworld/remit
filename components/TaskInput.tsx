"use client";

import { KeyboardEvent } from "react";
import { DemoScenario } from "@/lib/demo-data";

const OUTCOME_STYLE: Record<DemoScenario["outcome"], string> = {
  allowed:           "border-green-700 text-green-400 hover:border-green-500 hover:text-green-300",
  "approval-needed": "border-amber-700 text-amber-400 hover:border-amber-500 hover:text-amber-300",
  blocked:           "border-red-800 text-red-400 hover:border-red-600 hover:text-red-300",
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (task: string) => void;
  disabled: boolean;
  isProcessing: boolean;
  scenarios: DemoScenario[];
}

export default function TaskInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isProcessing,
  scenarios,
}: Props) {
  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    onChange("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  const isDisabled = disabled || isProcessing;

  return (
    <section className="relative border border-neutral-700/80 bg-neutral-800/40 rounded-xl p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-neutral-600/80">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2 tracking-tight">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask Remit
          </h2>
          <p className="text-xs text-neutral-500">
            Enter task for evaluation.
          </p>
        </div>

        {/* Demo scenario chips */}
        {scenarios.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-widest">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.label}
                  onClick={() => onChange(s.task)}
                  disabled={isDisabled}
                  className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg border-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm ${OUTCOME_STYLE[s.outcome]}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input + submit */}
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <input
            type="text"
            className="flex-1 bg-neutral-950/60 border border-neutral-700/80 rounded-xl px-4 py-3 text-base font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/20 transition-all duration-300 disabled:opacity-40 shadow-inner"
            placeholder="send 150 ckb to ckt1qz..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            spellCheck={false}
          />
          <button
            onClick={submit}
            disabled={isDisabled || !value.trim()}
            className="px-6 py-3 bg-neutral-100 text-neutral-900 text-sm font-extrabold tracking-wide rounded-xl hover:bg-white hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2 group"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-neutral-900/20 border-t-neutral-900 rounded-full"></span>
                Parsing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-900 group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                Evaluate
              </>
            )}
          </button>
        </div>

        {disabled && !isProcessing && (
          <p className="text-sm text-amber-400 font-medium tracking-tight animate-in fade-in duration-300">
            Save rules before submitting a task.
          </p>
        )}
      </div>
    </section>
  );
}
