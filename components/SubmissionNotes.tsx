export default function SubmissionNotes() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-neutral-400 font-mono tracking-wide">
      <span className="flex items-center gap-1.5"><span className="text-neutral-600 font-semibold uppercase tracking-widest text-[10px]">Pipeline</span> <span className="text-neutral-500 font-sans">•</span> parse → validate → evaluate → execute</span>
      <span className="flex items-center gap-1.5"><span className="text-neutral-600 font-semibold uppercase tracking-widest text-[10px]">Hardening</span> <span className="text-neutral-500 font-sans">•</span> schema + confidence gating</span>
      <span className="flex items-center gap-1.5"><span className="text-neutral-600 font-semibold uppercase tracking-widest text-[10px]">Demo mode</span> <span className="text-neutral-500 font-sans">•</span> unified executor wallet</span>
    </div>
  );
}
