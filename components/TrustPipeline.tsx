"use client";

import { AiAttemptOutcome, EvaluationStatus } from "@/lib/types";

type Stage = "idle" | "parsing" | "evaluated";

interface Props {
  stage: Stage;
  aiOutcome?: AiAttemptOutcome;
  evalStatus?: EvaluationStatus;
}

type StepState = "idle" | "active" | "pass" | "warn" | "fail" | "skip";

const DOT: Record<StepState, string> = {
  idle:   "text-neutral-800",
  active: "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]",
  pass:   "text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]",
  warn:   "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]",
  fail:   "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]",
  skip:   "text-neutral-800",
};

const LABEL: Record<StepState, string> = {
  idle:   "text-neutral-700",
  active: "text-blue-200",
  pass:   "text-neutral-300",
  warn:   "text-amber-200",
  fail:   "text-red-300",
  skip:   "text-neutral-700",
};

const STEPS = [
  "User task",
  "AI proposal",
  "Schema check",
  "Confidence gate",
  "Policy engine",
  "Execute / Queue / Block",
] as const;

function computeStates(
  stage: Stage,
  aiOutcome?: AiAttemptOutcome,
  evalStatus?: EvaluationStatus,
): StepState[] {
  if (stage === "idle")    return ["idle", "idle", "idle", "idle", "idle", "idle"];
  // When parsing, visually activate all steps so they can animate sequentially via CSS delays
  if (stage === "parsing") return ["active", "active", "active", "active", "active", "active"];

  // stage === "evaluated"
  const input: StepState = "pass";

  let aiProposal:  StepState = "skip";
  let schema:      StepState = "skip";
  let confidence:  StepState = "skip";

  switch (aiOutcome) {
    case "ai-accepted":
      aiProposal = "pass"; schema = "pass"; confidence = "pass"; break;
    case "ai-low-confidence":
      aiProposal = "warn"; schema = "pass"; confidence = "fail"; break;
    case "ai-invalid-schema":
      aiProposal = "warn"; schema = "fail"; confidence = "skip"; break;
    case "ai-unparsed":
      aiProposal = "warn"; schema = "pass"; confidence = "skip"; break;
    case "ai-error":
      aiProposal = "fail"; schema = "skip"; confidence = "skip"; break;
    case "ai-skipped":
    default:
      aiProposal = "skip"; schema = "skip"; confidence = "skip"; break;
  }

  let policy:  StepState = "idle";
  let outcome: StepState = "idle";

  switch (evalStatus) {
    case "allowed":          policy = "pass"; outcome = "pass"; break;
    case "approval-needed":  policy = "warn"; outcome = "warn"; break;
    case "blocked":          policy = "fail"; outcome = "fail"; break;
  }

  return [input, aiProposal, schema, confidence, policy, outcome];
}

export default function TrustPipeline({ stage, aiOutcome, evalStatus }: Props) {
  const states = computeStates(stage, aiOutcome, evalStatus);
  const isIdle = stage === "idle";
  const isParsing = stage === "parsing";

  return (
    <div className={`border border-neutral-800/80 bg-neutral-900/30 rounded-xl px-5 py-3.5 transition-opacity duration-700 ease-in-out ${isIdle ? "opacity-40" : "opacity-100"}`}>
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
        Trust Pipeline
      </p>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-xs font-mono">
        {STEPS.map((step, i) => {
          const delayStyle = isParsing ? { animationDelay: `${i * 150}ms`, animationDuration: "1s" } : {};
          return (
            <span 
              key={step} 
              className={`flex items-center gap-1 transition-all duration-500 ${isParsing ? "animate-pulse" : ""}`}
              style={delayStyle}
            >
              <span className={`${DOT[states[i]]} select-none text-[10px] transition-colors duration-300`}>●</span>
              <span className={`${LABEL[states[i]]} transition-colors duration-300`}>{step}</span>
              {i < STEPS.length - 1 && (
                <span className="text-neutral-800 mx-0.5">→</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
