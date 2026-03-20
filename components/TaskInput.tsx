"use client";

import { KeyboardEvent } from "react";
import { DemoScenario } from "@/lib/demo-data";

const OUTCOME_STYLE: Record<DemoScenario["outcome"], string> = {
  allowed:          "border-green-700 text-green-400 hover:border-green-500 hover:text-green-300",
  "approval-needed": "border-amber-700 text-amber-400 hover:border-amber-500 hover:text-amber-300",
  blocked:          "border-red-800 text-red-400 hover:border-red-600 hover:text-red-300",
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
    <section className="border border-neutral-700 rounded-lg p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-100">Agent Task</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Natural-language instruction from an AI agent. The pipeline parses,
          validates, and evaluates it against the active policy before anything
          executes.
        </p>
      </div>

      {/* Demo scenario presets */}
      {scenarios.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            Demo Scenarios
          </p>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.label}
                onClick={() => onChange(s.task)}
                disabled={isDisabled}
                className={`px-3 py-1 text-xs font-mono rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${OUTCOME_STYLE[s.outcome]}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm font-mono text-neutral-100 focus:outline-none focus:border-neutral-400 disabled:opacity-40"
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
          className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-medium rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Parsing…" : "Evaluate"}
        </button>
      </div>

      {disabled && !isProcessing && (
        <p className="text-sm text-amber-400">
          Save a remit policy before submitting a task.
        </p>
      )}
    </section>
  );
}
