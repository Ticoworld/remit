"use client";

import { useState, useEffect } from "react";
import {
  AiAttemptRecord,
  ApprovalQueueItem,
  EvaluationResult,
  ExecutionLogEntry,
  ParsedAction,
  ParserUsed,
  RemitPolicy,
} from "@/lib/types";
import { evaluateAction } from "@/lib/evaluator";
import { validateParsedAction } from "@/lib/validation";
import { friendlyExecError, ExecErrorInfo } from "@/lib/error-messages";
import { loadHistory, loadPolicy, loadQueue, saveHistory, savePolicy, saveQueue } from "@/lib/storage";
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from "@/lib/network-config";
import { POLICY_PRESETS, getDemoScenarios } from "@/lib/demo-data";

import { parseTaskAction } from "@/app/actions/parse";
import { executeTransfer } from "@/app/actions/transfer";
import { getEnvironmentInfo } from "@/app/actions/environment";
import { validateAddressOnServer } from "@/app/actions/validate-address";


import SystemRoles from "@/components/SystemRoles";
import TrustPipeline from "@/components/TrustPipeline";
import RemitForm from "@/components/RemitForm";
import TaskInput from "@/components/TaskInput";
import EvaluationPanel from "@/components/EvaluationPanel";
import ApprovalQueue from "@/components/ApprovalQueue";
import HistoryPanel from "@/components/HistoryPanel";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import DemoOrderHint from "@/components/DemoOrderHint";
import AgentProposal from "@/components/AgentProposal";

const DEMO_POLICY: RemitPolicy = POLICY_PRESETS[0].policy;

export default function Home() {
  // ── Hydration ────────────────────────────────────────────────────────────────
  const [hydrated, setHydrated] = useState(false);

  // ── Network config (loaded from server on mount) ──────────────────────────────
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_NETWORK_CONFIG);

  // ── Policy ───────────────────────────────────────────────────────────────────
  const [policy, setPolicy] = useState<RemitPolicy>(DEMO_POLICY);

  // ── Task input (controlled — lifted so reset & presets can set it) ────────────
  const [taskValue, setTaskValue] = useState("");
  const [lastEvaluatedTask, setLastEvaluatedTask] = useState("");

  // ── Current evaluation ───────────────────────────────────────────────────────
  const [isParsing, setIsParsing]             = useState(false);
  const [parseError, setParseError]           = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastParsedAction, setLastParsedAction] = useState<ParsedAction | null>(null);
  const [lastResult, setLastResult]           = useState<EvaluationResult | null>(null);
  const [lastParserUsed, setLastParserUsed]   = useState<ParserUsed | null>(null);
  const [lastAiAttempt, setLastAiAttempt]     = useState<AiAttemptRecord | null>(null);
  const [lastEntryId, setLastEntryId]         = useState<string | null>(null);

  // ── Execution (allowed path) ─────────────────────────────────────────────────
  const [executing, setExecuting]   = useState(false);
  const [execError, setExecError]   = useState<ExecErrorInfo | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // ── Approval queue ───────────────────────────────────────────────────────────
  const [approvalQueue, setApprovalQueue] = useState<ApprovalQueueItem[]>([]);
  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [approveError, setApproveError]   = useState<ExecErrorInfo | null>(null);

  // ── UX State ─────────────────────────────────────────────────────────────────
  const [highlightApprovals, setHighlightApprovals] = useState(false);

  // ── Execution history ────────────────────────────────────────────────────────
  const [history, setHistory] = useState<ExecutionLogEntry[]>([]);

  // ── On mount: load localStorage + fetch sanitised env info from server ────────
  useEffect(() => {
    const saved = loadPolicy();
    if (saved) setPolicy(saved);
    setHistory(loadHistory());
    setApprovalQueue(loadQueue());
    setHydrated(true);

    getEnvironmentInfo().then(setNetworkConfig).catch(() => {
      // keep DEFAULT_NETWORK_CONFIG if server action fails
    });
  }, []);

  // ── localStorage: save on change (after hydration) ───────────────────────────
  useEffect(() => { if (hydrated) savePolicy(policy); },       [policy, hydrated]);
  useEffect(() => { if (hydrated) saveHistory(history); },     [history, hydrated]);
  useEffect(() => { if (hydrated) saveQueue(approvalQueue); }, [approvalQueue, hydrated]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handlePolicySave(next: RemitPolicy) {
    setPolicy(next);
    clearEvalState();
  }

  function clearEvalState() {
    setParseError(null);
    setValidationError(null);
    setLastParsedAction(null);
    setLastResult(null);
    setLastParserUsed(null);
    setLastAiAttempt(null);
    setLastEntryId(null);
    setLastTxHash(null);
    setExecError(null);
  }

  useEffect(() => {
    // If the input changes and diverges from the last evaluated task,
    // clear the transient state immediately so stale proposal data vanishes.
    // This keeps the UI tightly strictly bound to the current text input.
    if (taskValue && lastEvaluatedTask && taskValue !== lastEvaluatedTask) {
      if (lastResult || parseError || lastParsedAction || lastAiAttempt) {
        clearEvalState();
      }
    }
  }, [taskValue, lastEvaluatedTask, lastResult, parseError, lastParsedAction, lastAiAttempt]);

  function handleReset() {
    setPolicy(DEMO_POLICY);
    setTaskValue("");
    setLastEvaluatedTask("");
    setHistory([]);
    setApprovalQueue([]);
    clearEvalState();
  }

  async function handleTaskSubmit(task: string) {
    clearEvalState();
    setLastEvaluatedTask(task);
    setIsParsing(true);

    try {
      const { parsedAction, parserUsed, aiAttempt, parseError: pErr } =
        await parseTaskAction(task);

      setLastAiAttempt(aiAttempt);
      if (parsedAction) {
        setLastParsedAction(parsedAction);
        setLastParserUsed(parserUsed);
      }

      if (!parsedAction || pErr) {
        setParseError(pErr ?? "Parse failed.");
        return;
      }

      const valErr = validateParsedAction(parsedAction);
      if (valErr) {
        setValidationError(valErr);
        return;
      }

      const result = evaluateAction(parsedAction, policy);
      setLastResult(result);

      const id = crypto.randomUUID();
      setLastEntryId(id);

      const logEntry: ExecutionLogEntry = {
        id,
        timestamp: new Date(),
        task,
        parserUsed,
        result,
        aiAttempt,
      };

      if (result.status === "approval-needed") {
        const queueItem: ApprovalQueueItem = {
          id,
          timestamp: new Date(),
          task,
          parserUsed,
          parsedAction,
          result,
          approvalStatus: "pending",
          aiAttempt,
        };
        setApprovalQueue((prev) => [...prev, queueItem]);
      }

      setHistory((prev) => [...prev, logEntry]);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleExecute() {
    if (!lastResult || lastResult.status !== "allowed") return;
    setExecuting(true);
    setExecError(null);

    try {
      // Validate the recipient address with CCC before touching the node.
      const addrErr = await validateAddressOnServer(lastResult.action.recipient);
      if (addrErr) {
        setExecError(friendlyExecError(addrErr));
        return;
      }

      const { txHash } = await executeTransfer(
        lastResult.action.recipient,
        lastResult.action.amount,
      );
      setLastTxHash(txHash);
      setHistory((prev) =>
        prev.map((e) => (e.id === lastEntryId ? { ...e, txHash } : e)),
      );
    } catch (err) {
      setExecError(friendlyExecError(err instanceof Error ? err.message : String(err)));
    } finally {
      setExecuting(false);
    }
  }

  async function handleApprove(id: string) {
    const item = approvalQueue.find((q) => q.id === id);
    if (!item) return;

    setApprovingId(id);
    setApproveError(null);

    try {
      // Same CCC pre-flight as handleExecute.
      const addrErr = await validateAddressOnServer(item.parsedAction.recipient);
      if (addrErr) {
        setApproveError(friendlyExecError(addrErr));
        return;
      }

      const { txHash } = await executeTransfer(
        item.parsedAction.recipient,
        item.parsedAction.amount,
      );

      setApprovalQueue((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, approvalStatus: "approved", txHash } : q,
        ),
      );
      setHistory((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, txHash, approvalDecision: "approved" } : e,
        ),
      );
    } catch (err) {
      setApproveError(friendlyExecError(err instanceof Error ? err.message : String(err)));
    } finally {
      setApprovingId(null);
    }
  }

  function handleReject(id: string) {
    setApprovalQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, approvalStatus: "rejected" } : q)),
    );
    setHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, approvalDecision: "rejected" } : e)),
    );
  }

  function handleSeeApprovals() {
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
    const targetId = isDesktop ? "approval-section-desktop" : "approval-section-mobile";
    const el = document.getElementById(targetId);
    
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    setHighlightApprovals(true);
    setTimeout(() => {
      setHighlightApprovals(false);
    }, 1500);
  }

  // ── Derived state ─────────────────────────────────────────────────────────────
  const pipelineStage = isParsing ? "parsing" : lastResult || lastAiAttempt ? "evaluated" : "idle";
  const scenarios = getDemoScenarios(policy);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-[family-name:var(--font-geist-sans)]">

      {/* ── Top strip ──────────────────────────────────────────────────────── */}
      <header className="border-b border-neutral-800/60 bg-neutral-950/90 backdrop-blur-md relative z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 relative">
          {/* Name + tagline + reset */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
                  <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
                  <path d="m21 3 1 11h-2"/>
                  <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
                  <path d="M3 4h8"/>
                </svg>
                Remit
              </h1>
              <p className="hidden sm:block text-[13px] font-medium text-neutral-500 tracking-wide">
                Agent permission layer
              </p>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset
            </button>
          </div>

          <div className="sm:hidden">
            <p className="text-[12px] font-medium text-neutral-500 tracking-wide">
              Agent permission layer
            </p>
          </div>

          {/* Status pills */}
          <div className="pt-0.5">
            <EnvironmentBanner config={networkConfig} />
          </div>
        </div>
      </header>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-5 sm:gap-8">

        {/* Context + system roles — always visible near top */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-neutral-400 tracking-wide">
            Give Remit an agent task. It will allow, queue, or block execution.
          </p>
          <SystemRoles />
        </div>

        {/* ── Main layout: left column + right rail (desktop) ─────────────── */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-start">

          {/* Left / center column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Rules */}
            <RemitForm policy={policy} onSave={handlePolicySave} />

            {/* Demo hint — slim always-visible helper above Ask Remit */}
            <DemoOrderHint />
            
            {/* Runtime State Strip */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-black/20 border border-neutral-800/50 rounded-md text-[10px] font-mono font-bold tracking-widest uppercase w-fit selection:bg-transparent mb-1">
              <span className={`px-2.5 py-1 rounded-sm transition-colors ${(!isParsing && !lastResult) ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-600"}`}>Idle</span>
              <span className={`px-2.5 py-1 rounded-sm transition-colors ${(isParsing) ? "bg-blue-600/80 text-white shadow-sm animate-pulse" : "text-neutral-600"}`}>Evaluating</span>
              <span className={`px-2.5 py-1 rounded-sm transition-colors ${(lastResult?.status === "approval-needed" && !lastTxHash) ? "bg-amber-600/80 text-white shadow-sm" : "text-neutral-600"}`}>Awaiting approval</span>
              <span className={`px-2.5 py-1 rounded-sm transition-colors ${(lastTxHash) ? "bg-green-600/80 text-white shadow-sm" : "text-neutral-600"}`}>Executed</span>
              <span className={`px-2.5 py-1 rounded-sm transition-colors ${(lastResult?.status === "blocked") ? "bg-red-600/80 text-white shadow-sm" : "text-neutral-600"}`}>Blocked</span>
            </div>

            {/* Ask Remit */}
            <TaskInput
              value={taskValue}
              onChange={setTaskValue}
              onSubmit={handleTaskSubmit}
              disabled={false}
              isProcessing={isParsing}
              scenarios={scenarios}
            />

            {/* Agent Proposal */}
            <AgentProposal
              isParsing={isParsing}
              parseError={parseError}
              parsedAction={lastParsedAction}
              parserUsed={lastParserUsed}
              aiAttempt={lastAiAttempt}
            />

            {/* Trust Pipeline */}
            <TrustPipeline
              stage={pipelineStage}
              aiOutcome={lastAiAttempt?.outcome}
              evalStatus={lastResult?.status}
            />

            {/* Decision */}
            <EvaluationPanel
              result={lastResult}
              parseError={parseError}
              validationError={validationError}
              parserUsed={lastParserUsed}
              onExecute={handleExecute}
              onSeeApprovals={handleSeeApprovals}
              executing={executing}
              execError={execError}
              txHash={lastTxHash}
              networkConfig={networkConfig}
            />

            {/* Approvals — stacks below Decision on mobile/tablet */}
            <div className="xl:hidden" id="approval-section-mobile">
              <ApprovalQueue
                items={approvalQueue}
                onApprove={handleApprove}
                onReject={handleReject}
                approvingId={approvingId}
                approveError={approveError}
                highlight={highlightApprovals}
              />
            </div>
          </div>

          {/* Right rail — sticky on xl+ only */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="sticky top-6" id="approval-section-desktop">
              <ApprovalQueue
                items={approvalQueue}
                onApprove={handleApprove}
                onReject={handleReject}
                approvingId={approvingId}
                approveError={approveError}
                highlight={highlightApprovals}
              />
            </div>
          </div>
        </div>

        {/* ── Activity — full width below the main grid ────────────────────── */}
        <HistoryPanel
          entries={history}
          onClear={() => setHistory([])}
          networkConfig={networkConfig}
        />

      </div>
    </div>
  );
}
