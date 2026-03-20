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
  idle:   "text-neutral-700",
  active: "text-neutral-400",
  pass:   "text-green-500",
  warn:   "text-amber-400",
  fail:   "text-red-500",
  skip:   "text-neutral-800",
};

const LABEL: Record<StepState, string> = {
  idle:   "text-neutral-600",
  active: "text-neutral-300",
  pass:   "text-neutral-400",
  warn:   "text-amber-400",
  fail:   "text-red-400",
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
  if (stage === "parsing") return ["active", "idle", "idle", "idle", "idle", "idle"];

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

  return (
    <div className="border border-neutral-800 rounded px-4 py-3">
      <p className="text-xs text-neutral-600 uppercase tracking-widest mb-2">
        Trust pipeline
      </p>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-mono">
        {STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span className={`${DOT[states[i]]} select-none`}>●</span>
            <span className={LABEL[states[i]]}>{step}</span>
            {i < STEPS.length - 1 && (
              <span className="text-neutral-800 mx-0.5">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
