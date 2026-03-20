/**
 * Maps raw devnet execution errors to user-friendly messages.
 * Always preserves the original error string for debugging.
 */

export interface ExecErrorInfo {
  /** Short, human-readable explanation shown in the UI. */
  friendly: string;
  /** Original error string for debugging. */
  debug: string;
}

export function friendlyExecError(raw: string): ExecErrorInfo {
  const debug = raw;

  if (/minimum cell capacity|61 ckb|below.*minimum|insufficient.*capacity.*transfer|rejected.*61/i.test(raw)) {
    return {
      friendly:
        "Amount is below the minimum cell capacity (61 CKB). Increase the transfer amount.",
      debug,
    };
  }

  if (/malformed|invalid.*address|address.*invalid|unknown.*prefix|bech32|decode.*fail/i.test(raw)) {
    return {
      friendly:
        'Recipient address is malformed or uses the wrong network prefix. Use a "ckt"-prefixed devnet address.',
      debug,
    };
  }

  if (/ECONNREFUSED|ENOTFOUND|fetch.*fail|connect.*refused|network.*unavail|ETIMEDOUT|socket hang/i.test(raw)) {
    return {
      friendly:
        "Cannot reach the local CKB node. Make sure the devnet is running: offckb node",
      debug,
    };
  }

  if (/no live cell|insufficient.*cell|not enough.*capacity|inputs.*capacity/i.test(raw)) {
    return {
      friendly:
        "The executor wallet has insufficient CKB. Top up the devnet sender account.",
      debug,
    };
  }

  if (/duplicate.*transaction|already.*exist/i.test(raw)) {
    return {
      friendly:
        "This transaction was already submitted. Check the history for the previous tx hash.",
      debug,
    };
  }

  return {
    friendly: "Execution failed. See the debug message below.",
    debug,
  };
}
