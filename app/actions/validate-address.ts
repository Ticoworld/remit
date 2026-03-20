"use server";

import { ccc } from "@ckb-ccc/core";

/**
 * Validates a CKB address using the same CCC library that executeTransfer uses.
 *
 * ccc.Address.fromString() performs a full bech32/bech32m decode including
 * checksum verification, which our regex-only client-side check cannot do.
 *
 * Returns null on success, or a friendly error message string on failure.
 *
 * Note: ClientPublicTestnet is used here because OffCKB devnet shares the
 * same script set and address format. The RPC URL is read from the env var
 * so local and testnet modes work identically.
 */
export async function validateAddressOnServer(
  address: string,
): Promise<string | null> {
  const rpcUrl = process.env.CKB_RPC_URL;
  if (!rpcUrl) {
    // If the env var is missing we cannot validate — let transfer.ts surface
    // the missing-env error at execution time instead of failing silently here.
    return null;
  }

  const trimmed = address.trim();
  if (!trimmed) return "Address cannot be empty.";

  try {
    const client = new ccc.ClientPublicTestnet({ url: rpcUrl });
    await ccc.Address.fromString(trimmed, client);
    return null; // success
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Translate CCC's technical errors into clear user-facing messages.
    if (
      msg.toLowerCase().includes("unknown address format") ||
      msg.toLowerCase().includes("invalid address")
    ) {
      return `"${trimmed.slice(0, 20)}${trimmed.length > 20 ? "…" : ""}" is not a valid CKB address. Check the address and try again.`;
    }

    if (
      msg.toLowerCase().includes("checksum") ||
      msg.toLowerCase().includes("bech32")
    ) {
      return `"${trimmed.slice(0, 20)}${trimmed.length > 20 ? "…" : ""}" has an invalid checksum and cannot be used.`;
    }

    // Generic fallback — still friendlier than the raw CCC stack trace.
    return `Address validation failed: ${msg}`;
  }
}

/**
 * Validates a list of address strings, returning the first error found.
 * Returns null if all addresses are valid.
 */
export async function validateAddressListOnServer(
  addresses: string[],
): Promise<string | null> {
  for (const addr of addresses) {
    const err = await validateAddressOnServer(addr);
    if (err) return err;
  }
  return null;
}
