"use client";

import { ApprovalQueueItem } from "@/lib/types";
import { ExecErrorInfo } from "@/lib/error-messages";

interface Props {
  items: ApprovalQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId: string | null;
  approveError: ExecErrorInfo | null;
  highlight?: boolean;
}

export default function ApprovalQueue({
  items,
  onApprove,
  onReject,
  approvingId,
  approveError,
  highlight,
}: Props) {
  const pending  = items.filter((i) => i.approvalStatus === "pending");
  const resolved = items.filter((i) => i.approvalStatus !== "pending");

  return (
    <section className="flex flex-col gap-4 relative">
      {/* ── Highlight Glow Overlay ── */}
      <div 
        className={`absolute -inset-3 rounded-2xl pointer-events-none transition-all duration-700 ease-out z-50 ${
          highlight 
            ? "bg-amber-500/10 border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40" 
            : "bg-transparent border-transparent outline-transparent"
        }`} 
      />

      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 relative z-10">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Awaiting approval
        </h2>
        {pending.length > 0 && (
          <span className="text-xs font-bold leading-none bg-amber-500 text-amber-950 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-in zoom-in duration-300">
            {pending.length} pending
          </span>
        )}
      </div>

      {items.length === 0 && (
        <div className="flex items-center justify-center p-4 sm:p-5 border border-dashed border-neutral-800/80 rounded-xl bg-neutral-950/30 transition-all duration-500 hover:bg-neutral-900/40 group gap-2.5">
          <div className="w-6 h-6 rounded-full bg-neutral-900/80 flex items-center justify-center ring-1 ring-neutral-800 text-neutral-600 shadow-sm shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-[13px] text-neutral-500 font-semibold tracking-wide">No actions waiting</p>
        </div>
      )}

      {/* Pending action cards */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-4">
          {pending.map((item) => (
            <div
              key={item.id}
              className="border-l-4 border-l-amber-500 border-y border-r border-y-neutral-700/80 border-r-neutral-700/80 bg-neutral-900/60 shadow-sm rounded-r-xl rounded-l-sm p-5 flex flex-col gap-4 relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 ease-out transition-all hover:border-neutral-600/80"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />

              {/* Header row */}
              <div className="flex items-start justify-between gap-3 relative z-10 overflow-hidden w-full">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-[11px] text-amber-500/80 font-mono uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                    Requires action
                  </span>
                  <div className="text-sm font-bold text-white leading-snug break-words break-all">
                    {item.task.split(item.parsedAction.recipient).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="text-blue-400 font-mono font-medium">{item.parsedAction.recipient}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action details */}
              <div className="flex flex-col gap-3 text-xs font-mono bg-black/40 p-3 rounded-lg border border-neutral-800 relative z-10 w-full overflow-hidden">
                <div className="flex gap-8">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-sans">asset</span>
                    <span className="text-neutral-200 font-semibold">{item.parsedAction.asset}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-sans">amount</span>
                    <span className="text-neutral-200 font-semibold">{item.parsedAction.amount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 w-full">
                  <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-sans">recipient</span>
                  <span className="text-neutral-300 break-all leading-relaxed whitespace-pre-wrap">{item.parsedAction.recipient}</span>
                </div>
              </div>

              {/* Reason */}
              <p className="text-[13px] text-neutral-400 font-medium leading-snug relative z-10 w-full">
                {item.result.reason}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-800/80 relative z-10 w-full">
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={approvingId === item.id}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-green-500 text-green-950 text-sm font-extrabold tracking-wide rounded-lg hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md flex items-center justify-center gap-2"
                >
                  {approvingId === item.id ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-green-900/30 border-t-green-900 rounded-full"></span>
                      Executing…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Approve & Execute
                    </>
                  )}
                </button>
                <button
                  onClick={() => onReject(item.id)}
                  disabled={approvingId === item.id}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-neutral-900 text-neutral-300 text-sm font-semibold tracking-wide rounded-lg hover:bg-neutral-800 hover:text-white active:scale-[0.98] transition-all duration-300 border border-neutral-700/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  Reject
                </button>
              </div>

              {approveError && approvingId === null && (
                <div className="flex flex-col gap-1 mt-2 bg-red-950/40 border border-red-900/50 p-3 rounded-lg relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-semibold text-red-400">{approveError.friendly}</p>
                  <p className="text-[11px] text-red-300/60 font-mono break-all mt-1">
                    {approveError.debug}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolved items - visually pushed back */}
      {resolved.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 animate-in fade-in duration-500">
          <p className="text-[11px] text-neutral-600 font-semibold uppercase tracking-widest pl-1">
            Past decisions
          </p>
          <div className="flex flex-col gap-px bg-neutral-800/50 border border-neutral-800/80 rounded-xl overflow-hidden">
            {[...resolved].reverse().map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 text-xs bg-neutral-900/60 p-3 transition-all duration-500 animate-in fade-in slide-in-from-top-2"
              >
                <span
                  className={`shrink-0 w-2 h-2 rounded-full ${
                    item.approvalStatus === "approved" ? "bg-green-500/80" : "bg-red-500/80"
                  }`}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-neutral-400 truncate">
                    {item.task}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-600 mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span
                  className={`font-semibold uppercase tracking-widest text-[10px] shrink-0 ${
                    item.approvalStatus === "approved" ? "text-green-500/70" : "text-red-500/70"
                  }`}
                >
                  {item.approvalStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
