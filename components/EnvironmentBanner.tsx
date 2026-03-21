import { NetworkConfig } from "@/lib/network-config";

interface Props {
  config: NetworkConfig;
}

export default function EnvironmentBanner({ config }: Props) {
  const isTestnet = config.networkMode === "testnet";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Network mode pill */}
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors ${
          isTestnet
            ? "text-blue-400 bg-blue-950/20 border border-blue-900/30"
            : "text-amber-400 bg-amber-950/20 border border-amber-900/30"
        }`}
      >
        <span
          className={`w-1 h-1 rounded-full ${
            isTestnet ? "bg-blue-400" : "bg-amber-500"
          }`}
        />
        {isTestnet ? "Testnet" : "Devnet"}
      </span>

      {/* Executor pill */}
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-500 bg-neutral-900/40 border border-neutral-800/60 transition-colors hover:bg-neutral-800/60">
        <span className="w-1 h-1 rounded-full bg-neutral-600" />
        Executor
      </span>

      {/* AI parser pill */}
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors ${
          config.aiConfigured
            ? "text-green-500 bg-green-950/20 border border-green-900/30"
            : "text-neutral-500 bg-neutral-900/40 border border-neutral-800/60"
        }`}
      >
        <span
          className={`w-1 h-1 rounded-full ${
            config.aiConfigured ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-neutral-600"
          }`}
        />
        {config.aiConfigured ? "AI Parser" : "Regex Parser"}
      </span>
    </div>
  );
}
