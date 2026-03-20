import { NetworkConfig } from "@/lib/network-config";

interface Props {
  config: NetworkConfig;
}

export default function EnvironmentBanner({ config }: Props) {
  const isTestnet = config.networkMode === "testnet";

  return (
    <div className="border border-neutral-800 rounded px-4 py-2.5 bg-neutral-900 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
      {/* Network mode */}
      <span
        className={
          isTestnet ? "text-blue-400 font-semibold" : "text-amber-400 font-semibold"
        }
      >
        {isTestnet ? "CKB Testnet" : "Local Devnet"}
      </span>

      <span className="text-neutral-700">·</span>

      {/* Executor model */}
      <span className="text-neutral-500">executor: server wallet</span>

      <span className="text-neutral-700">·</span>

      {/* AI parser state */}
      <span className={config.aiConfigured ? "text-green-500" : "text-neutral-600"}>
        AI parser:{" "}
        <span className={config.aiConfigured ? "text-green-400" : "text-neutral-500"}>
          {config.aiConfigured ? "configured" : "fallback-only"}
        </span>
      </span>
    </div>
  );
}
