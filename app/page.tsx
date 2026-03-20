"use client";

import { useState, useEffect } from "react";
import {
  AiAttemptRecord,
  ApprovalQueueItem,
  EvaluationResult,
  ExecutionLogEntry,
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
import SubmissionNotes from "@/components/SubmissionNotes";
import DemoOrderHint from "@/components/DemoOrderHint";

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

  // ── Current evaluation ───────────────────────────────────────────────────────
  const [isParsing, setIsParsing]             = useState(false);
  const [parseError, setParseError]           = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    setLastResult(null);
    setLastParserUsed(null);
    setLastAiAttempt(null);
    setLastEntryId(null);
    setLastTxHash(null);
    setExecError(null);
  }

  function handleReset() {
    setPolicy(DEMO_POLICY);
    setTaskValue("");
    setHistory([]);
    setApprovalQueue([]);
    clearEvalState();
  }

  async function handleTaskSubmit(task: string) {
    clearEvalState();
    setIsParsing(true);

    try {
      const { parsedAction, parserUsed, aiAttempt, parseError: pErr } =
        await parseTaskAction(task);

      setLastAiAttempt(aiAttempt);

      if (!parsedAction || pErr) {
        setParseError(pErr ?? "Parse failed.");
        return;
      }

      const valErr = validateParsedAction(parsedAction);
      if (valErr) {
        setValidationError(valErr);
        setLastParserUsed(parserUsed);
        return;
      }

      const result = evaluateAction(parsedAction, policy);
      setLastResult(result);
      setLastParserUsed(parserUsed);

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
      // This catches addresses that passed regex validation but fail the full
      // bech32/bech32m checksum decode used by the transfer layer.
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
      // Same CCC pre-flight as handleExecute — catches checksum-invalid
      // addresses before they reach the node.
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

  // ── Derived state ─────────────────────────────────────────────────────────────
  const pipelineStage = isParsing ? "parsing" : lastResult || lastAiAttempt ? "evaluated" : "idle";
  const scenarios = getDemoScenarios(policy);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">

        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Remit</h1>
              <p className="text-sm text-neutral-400 mt-1">
                CKB-native permission layer for AI agents. Every proposed action
                passes through parsing, schema validation, a confidence gate, and
                deterministic policy evaluation before anything executes.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Reset Demo
            </button>
          </div>
          <EnvironmentBanner config={networkConfig} />
          <SystemRoles />
        </header>

        {/* Submission context */}
        <SubmissionNotes />
        <DemoOrderHint />

        {/* Remit policy */}
        <RemitForm policy={policy} onSave={handlePolicySave} />

        {/* Task input + trust pipeline */}
        <TaskInput
          value={taskValue}
          onChange={setTaskValue}
          onSubmit={handleTaskSubmit}
          disabled={false}
          isProcessing={isParsing}
          scenarios={scenarios}
        />
        <TrustPipeline
          stage={pipelineStage}
          aiOutcome={lastAiAttempt?.outcome}
          evalStatus={lastResult?.status}
        />

        {/* Evaluation result */}
        <EvaluationPanel
          result={lastResult}
          parseError={parseError}
          validationError={validationError}
          parserUsed={lastParserUsed}
          aiAttempt={lastAiAttempt}
          onExecute={handleExecute}
          executing={executing}
          execError={execError}
          txHash={lastTxHash}
          networkConfig={networkConfig}
        />

        {/* Approval queue */}
        <ApprovalQueue
          items={approvalQueue}
          onApprove={handleApprove}
          onReject={handleReject}
          approvingId={approvingId}
          approveError={approveError}
        />

        {/* Execution history */}
        <HistoryPanel
          entries={history}
          onClear={() => setHistory([])}
          networkConfig={networkConfig}
        />

      </div>
    </div>
  );
}
