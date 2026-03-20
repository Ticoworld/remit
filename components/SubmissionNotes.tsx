export default function SubmissionNotes() {
  return (
    <section className="border border-neutral-800 rounded p-4 bg-neutral-900 flex flex-col gap-3">
      <p className="text-xs text-neutral-600 uppercase tracking-widest">
        About this build
      </p>

      <p className="text-sm text-neutral-300 leading-relaxed">
        <span className="text-neutral-100 font-semibold">Remit</span> is a
        CKB-native permission layer for AI agents. Every proposed action must
        pass a deterministic policy check before anything executes on-chain.
      </p>

      <div className="flex flex-col gap-1.5 text-xs text-neutral-500 leading-relaxed">
        <p>
          <span className="text-neutral-400">What this proves: </span>
          a full parse → validate → evaluate → execute pipeline with AI trust
          hardening (schema validation + confidence gating), a human-in-the-loop
          approval queue, and an immutable audit trail — running on CKB
          devnet or testnet.
        </p>
        <p>
          <span className="text-neutral-400">Demo-only in this build: </span>
          the executor uses a single server-side funded wallet; policy owner and
          executor are the same identity. In production these would be separate
          signers with multi-wallet support.
        </p>
      </div>
    </section>
  );
}
