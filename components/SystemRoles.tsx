const ROLES = [
  {
    label: "Policy owner",
    desc: "defines approved addresses, asset type, spend limits, and approval threshold",
  },
  {
    label: "AI planner",
    desc: "interprets the natural-language task into a structured proposed action",
  },
  {
    label: "Policy engine",
    desc: "checks every proposal against the remit before anything can execute",
  },
  {
    label: "Executor wallet",
    desc: "sends only allowed or human-approved CKB transfers on the configured network",
  },
];

export default function SystemRoles() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ROLES.map((r) => (
        <div key={r.label} className="border border-neutral-800 rounded px-3 py-2.5">
          <p className="text-xs font-semibold text-neutral-300">{r.label}</p>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}
