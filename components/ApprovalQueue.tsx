"use client";

import { ApprovalQueueItem } from "@/lib/types";
import { ExecErrorInfo } from "@/lib/error-messages";

interface Props {
  items: ApprovalQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId: string | null;
  approveError: ExecErrorInfo | null;
}

export default function ApprovalQueue({
  items,
  onApprove,
  onReject,
  approvingId,
  approveError,
}: Props) {
  const pending  = items.filter((i) => i.approvalStatus === "pending");
  const resolved = items.filter((i) => i.approvalStatus !== "pending");

  return (
    <section className="border border-neutral-700 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-neutral-100">Approval Queue</h2>
        {pending.length > 0 && (
          <span className="text-xs font-mono bg-amber-900 text-amber-300 px-2 py-0.5 rounded">
            {pending.length} pending
          </span>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-neutral-500">No items awaiting approval.</p>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          {pending.map((item) => (
            <div
              key={item.id}
              className="border border-amber-700 rounded p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-neutral-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()} · {item.parserUsed} parser
                  </span>
                  <span className="text-sm font-mono text-neutral-200 break-all">
                    {item.task}
                  </span>
                </div>
                <span className="text-xs font-mono bg-amber-900 text-amber-300 px-2 py-0.5 rounded shrink-0">
                  approval-needed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-neutral-400">
                <div>
                  <span className="text-neutral-600 block">asset</span>
                  {item.parsedAction.asset}
                </div>
                <div>
                  <span className="text-neutral-600 block">amount</span>
                  {item.parsedAction.amount} CKB
                </div>
                <div>
                  <span className="text-neutral-600 block">recipient</span>
                  <span className="break-all">{item.parsedAction.recipient}</span>
                </div>
              </div>

              <p className="text-xs text-amber-400 italic">{item.result.reason}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={approvingId === item.id}
                  className="px-3 py-1.5 bg-green-800 text-green-100 text-xs font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingId === item.id ? "Executing…" : "Approve & Execute"}
                </button>
                <button
                  onClick={() => onReject(item.id)}
                  disabled={approvingId === item.id}
                  className="px-3 py-1.5 bg-neutral-700 text-neutral-300 text-xs font-medium rounded hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>

              {approveError && approvingId === null && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-red-400">{approveError.friendly}</p>
                  <p className="text-xs text-neutral-700 font-mono break-all">
                    debug: {approveError.debug}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolved items */}
      {resolved.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-neutral-600 uppercase tracking-widest mb-1">
            Resolved
          </p>
          {[...resolved].reverse().map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 text-xs border-b border-neutral-800 pb-1.5 last:border-0"
            >
              <span className="text-neutral-600 font-mono shrink-0 pt-0.5">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-mono text-neutral-400 flex-1 break-all">
                {item.task}
              </span>
              <span
                className={`font-mono shrink-0 pt-0.5 ${
                  item.approvalStatus === "approved"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {item.approvalStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
