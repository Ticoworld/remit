const STEPS = [
  {
    n: 1,
    label: "Allowed",
    color: "text-green-500",
    detail: "transfer below threshold — executes immediately",
  },
  {
    n: 2,
    label: "Approval-needed",
    color: "text-amber-500",
    detail: "transfer above threshold — joins the queue",
  },
  {
    n: 3,
    label: "Blocked",
    color: "text-red-500",
    detail: "policy violation — rejected outright",
  },
  {
    n: 4,
    label: "Approve & execute",
    color: "text-neutral-400",
    detail: "approve the queued item and broadcast",
  },
];

export default function DemoOrderHint() {
  return (
    <div className="border border-neutral-800 rounded px-4 py-3 bg-neutral-900 flex flex-col gap-2">
      <p className="text-xs text-neutral-600 uppercase tracking-widest">
        Suggested demo order
      </p>
      <div className="flex flex-col gap-1">
        {STEPS.map((s) => (
          <div key={s.n} className="flex items-baseline gap-2 text-xs">
            <span className="text-neutral-700 w-3 shrink-0">{s.n}.</span>
            <span className={`font-medium ${s.color}`}>{s.label}</span>
            <span className="text-neutral-700">— {s.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
