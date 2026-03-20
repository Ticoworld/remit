/** Network mode supported by Remit. */
export type NetworkMode = "local" | "testnet";

/**
 * Sanitised network config that is safe to pass to client components.
 * Sensitive values (private key, raw RPC URL) are kept server-side only.
 */
export interface NetworkConfig {
  networkMode: NetworkMode;
  /** Base URL for the block explorer transaction page, or null if unavailable. */
  explorerTxBaseUrl: string | null;
  /** Whether an AI parser endpoint is configured on the server. */
  aiConfigured: boolean;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  networkMode: "local",
  explorerTxBaseUrl: null,
  aiConfigured: false,
};

/**
 * Returns the full explorer URL for a tx hash, or null if no explorer
 * is configured for the active network.
 */
export function getTxExplorerUrl(
  txHash: string,
  config: NetworkConfig,
): string | null {
  if (!config.explorerTxBaseUrl) return null;
  const base = config.explorerTxBaseUrl.endsWith("/")
    ? config.explorerTxBaseUrl
    : config.explorerTxBaseUrl + "/";
  return `${base}${txHash}`;
}
