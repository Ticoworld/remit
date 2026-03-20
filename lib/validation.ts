import { ParsedAction } from "./types";
import { validateCkbAddress, addressValidationMessage } from "./address-validation";

/** Minimum capacity for a bare secp256k1 cell on CKB. */
export const MIN_TRANSFER_CKB = 61;

export function validateRecipient(address: string): string | null {
  const result = validateCkbAddress(address);
  return addressValidationMessage(result);
}

export function validateAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Amount must be a positive number.";
  }
  if (amount < MIN_TRANSFER_CKB) {
    return `Amount must be at least ${MIN_TRANSFER_CKB} CKB (minimum cell capacity). Got: ${amount} CKB.`;
  }
  return null;
}

/** Returns the first validation error, or null if the action is valid. */
export function validateParsedAction(action: ParsedAction): string | null {
  return validateRecipient(action.recipient) ?? validateAmount(action.amount);
}
