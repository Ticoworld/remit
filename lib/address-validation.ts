/**
 * Stronger CKB address validation beyond a raw prefix check.
 *
 * CKB addresses use bech32 / bech32m encoding:
 *   - Human-readable part (HRP): "ckb" (mainnet) or "ckt" (testnet/devnet)
 *   - Separator: "1"
 *   - Data part: characters from the bech32 charset — all lowercase
 *     alphanumeric EXCEPT 1, b, i, o
 *
 * This module does not verify the bech32 checksum (that requires full decode)
 * but it catches: wrong network, clearly malformed strings, invalid characters,
 * and obviously out-of-range lengths.
 *
 * True structural validation happens inside the CCC library at execution time
 * via `ccc.Address.fromString()`.
 */

// bech32 data character set (excludes the separator "1" and b, i, o)
const BECH32_DATA_RE = /^[ac-hj-np-z02-9]+$/;

// Smallest real CKB address observed (short-format secp256k1, ~43 chars)
const MIN_ADDRESS_LENGTH = 42;
// Generous upper bound
const MAX_ADDRESS_LENGTH = 140;

export type AddressValidationError =
  | "empty"
  | "wrong-network"       // starts with ckb1 (mainnet)
  | "malformed-format"    // missing ckt1 prefix entirely
  | "malformed-length"    // too short or too long
  | "malformed-chars";    // non-bech32 characters in data part

export type AddressValidationResult =
  | { ok: true }
  | { ok: false; reason: AddressValidationError };

/**
 * Validates a CKB testnet/devnet address string.
 * Returns `{ ok: true }` on success, or an error reason on failure.
 */
export function validateCkbAddress(address: string): AddressValidationResult {
  const a = address.trim();

  if (!a) return { ok: false, reason: "empty" };

  // Mainnet address — wrong network
  if (a.startsWith("ckb1")) return { ok: false, reason: "wrong-network" };

  // Must start with "ckt1" (HRP + separator)
  if (!a.startsWith("ckt1")) return { ok: false, reason: "malformed-format" };

  if (a.length < MIN_ADDRESS_LENGTH || a.length > MAX_ADDRESS_LENGTH) {
    return { ok: false, reason: "malformed-length" };
  }

  // Data part is everything after "ckt1"
  const dataPart = a.slice(4);
  if (!BECH32_DATA_RE.test(dataPart)) {
    return { ok: false, reason: "malformed-chars" };
  }

  return { ok: true };
}

/** Maps a validation result to a human-readable error message, or null if valid. */
export function addressValidationMessage(
  result: AddressValidationResult,
): string | null {
  if (result.ok) return null;
  switch (result.reason) {
    case "empty":
      return "Address cannot be empty.";
    case "wrong-network":
      return 'This looks like a CKB mainnet address (starts with "ckb1"). Use a testnet/devnet address starting with "ckt1".';
    case "malformed-format":
      return 'CKB testnet/devnet addresses must start with "ckt1".';
    case "malformed-length":
      return "Address length is outside the expected range for a CKB address.";
    case "malformed-chars":
      return "Address contains characters that are not valid in a bech32-encoded CKB address.";
  }
}
