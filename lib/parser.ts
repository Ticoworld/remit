import { ParsedAction } from "./types";

/**
 * Parses a natural-language task into a structured action.
 * Supported pattern: "send {amount} ckb to {address}"
 * Returns null if the input does not match the pattern.
 */
export function parseTask(input: string): ParsedAction | null {
  const pattern = /^send\s+(\d+(?:\.\d+)?)\s+ckb\s+to\s+(\S+)$/i;
  const match = input.trim().match(pattern);
  if (!match) return null;

  return {
    asset: "CKB",
    amount: parseFloat(match[1]),
    recipient: match[2],
    raw: input.trim(),
  };
}
