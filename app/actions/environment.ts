"use server";

import { NetworkConfig, NetworkMode } from "@/lib/network-config";

/**
 * Returns sanitised environment info for display in the client UI.
 * Sensitive values (private key, raw RPC URL) are never included.
 *
 * Env vars consumed here:
 *   REMIT_NETWORK_MODE        — "local" (default) | "testnet"
 *   CKB_EXPLORER_TX_BASE_URL  — optional; defaults to CKB Pudge testnet explorer
 *                               when REMIT_NETWORK_MODE=testnet
 *   ANTHROPIC_AUTH_TOKEN      — presence indicates AI parser is configured
 */
export async function getEnvironmentInfo(): Promise<NetworkConfig> {
  const mode = (process.env.REMIT_NETWORK_MODE ?? "local") as NetworkMode;

  const explorerTxBaseUrl =
    process.env.CKB_EXPLORER_TX_BASE_URL ??
    (mode === "testnet"
      ? "https://pudge.explorer.nervos.org/transaction/"
      : null);

  const aiConfigured = !!(
    process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.ANTHROPIC_API_KEY
  );

  return { networkMode: mode, explorerTxBaseUrl, aiConfigured };
}
