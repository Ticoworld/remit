const STEPS = [
  {
    n: 1,
    label: "Allowed",
    color: "text-green-400",
    detail: "below threshold, executes immediately",
  },
  {
    n: 2,
    label: "Approval-needed",
    color: "text-amber-400",
    detail: "above threshold, joins the queue",
  },
  {
    n: 3,
    label: "Blocked",
    color: "text-red-400",
    detail: "policy violation, rejected outright",
  },
  {
    n: 4,
    label: "Approve & execute",
    color: "text-neutral-400",
    detail: "approve a queued item and broadcast",
  },
];

export default function DemoOrderHint() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
      <p className="text-[11px] text-neutral-600 uppercase tracking-widest shrink-0 font-semibold">
        Demo behavior
      </p>
      {STEPS.map((s) => (
        <span key={s.n} className="flex items-baseline gap-1.5 text-[11px]">
          <span className={`font-semibold ${s.color}`}>{s.label}</span>
          <span className="text-neutral-500">— {s.detail}</span>
        </span>
      ))}
    </div>
  );
}
