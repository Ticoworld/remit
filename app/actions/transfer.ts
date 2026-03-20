"use server";

import { ccc } from "@ckb-ccc/core";
import { MIN_TRANSFER_CKB } from "@/lib/validation";

/**
 * Executes a CKB transfer using the server-side executor wallet.
 *
 * Works on both local OffCKB devnet and CKB testnet — the active network
 * is determined entirely by environment variables, not code changes.
 *
 * Required env vars:
 *   REMIT_NETWORK_MODE     — "local" | "testnet"  (preferred; checked first)
 *   CKB_RPC_URL            — JSON-RPC endpoint
 *                            local:   http://127.0.0.1:28114
 *                            testnet: https://testnet.ckb.dev/rpc
 *   DEV_SENDER_PRIVATE_KEY — 32-byte hex private key of the funded executor wallet
 *
 * Call this only after the remit evaluator returns "allowed" or an approval-queue
 * item has been approved by a policy owner.
 */

/**
 * Queries the running CKB node for the genesis block and returns the txHash of
 * the dep-group transaction (always genesis tx index 1 in every CKB chain).
 *
 * This is needed for local OffCKB devnet: the secp256k1 dep-group txHash
 * differs per devnet genesis and cannot be hardcoded. The testnet dep-group
 * txHash (0xf8de3bb4…) is baked into TESTNET_SCRIPTS and is wrong for devnet.
 */
async function fetchGenesisDepGroupTxHash(rpcUrl: string): Promise<string> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "get_block_by_number",
    params: ["0x0", "0x2", false],
    id: 1,
  });
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch genesis block from ${rpcUrl}: HTTP ${res.status}`,
    );
  }
  const data = (await res.json()) as {
    result: { transactions: Array<{ hash: string }> };
    error?: { message: string };
  };
  if (data.error) {
    throw new Error(`RPC error fetching genesis block: ${data.error.message}`);
  }
  const txs = data.result?.transactions;
  if (!txs || txs.length < 2) {
    throw new Error(
      "Genesis block has unexpected structure (expected ≥2 transactions).",
    );
  }
  // Genesis layout (all CKB chains):
  //   index 0 → cellbase (system script CODE cells)
  //   index 1 → dep-group tx (wraps secp256k1 + multisig into dep-group outputs)
  return txs[1].hash;
}

export async function executeTransfer(
  recipientAddress: string,
  amountCkb: number,
): Promise<{ txHash: string }> {
  const rpcUrl = process.env.CKB_RPC_URL;
  const privateKey = process.env.DEV_SENDER_PRIVATE_KEY;

  if (!rpcUrl) throw new Error("Missing env var: CKB_RPC_URL");
  if (!privateKey) throw new Error("Missing env var: DEV_SENDER_PRIVATE_KEY");

  // Guard: enforce minimum cell capacity before touching the node.
  if (!Number.isFinite(amountCkb) || amountCkb < MIN_TRANSFER_CKB) {
    throw new Error(
      `Transfer rejected: ${amountCkb} CKB is below the minimum cell capacity of ${MIN_TRANSFER_CKB} CKB.`,
    );
  }

  // ── Network-mode detection ─────────────────────────────────────────────────
  // Primary:  REMIT_NETWORK_MODE env var ("local" | "testnet").
  // Fallback: treat localhost / 127.0.0.1 RPC URLs as local devnet.
  const networkMode = process.env.REMIT_NETWORK_MODE;
  const isLocal =
    networkMode === "local" ||
    (!networkMode &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(rpcUrl));

  // ── Client construction ────────────────────────────────────────────────────
  // For local OffCKB devnet we must override the Secp256k1Blake160 cellDep.
  //
  // Problem: ClientPublicTestnet bakes in TESTNET_SCRIPTS, which hardcodes the
  // Secp256k1Blake160 dep-group at testnet genesis txHash 0xf8de3bb4….
  // CCC auto-injects this cell dep into every secp256k1 transaction it builds.
  // The local OffCKB devnet does NOT have that transaction — its dep-group is
  // at a different txHash in its own genesis block.
  //
  // Fix: when local, dynamically fetch the dep-group txHash from genesis block
  // tx[1] (the dep-group tx, present in every CKB chain). This avoids
  // hardcoding a txHash that differs per devnet instance/OffCKB version.
  //
  // We also spread the full TESTNET_SCRIPTS so other getKnownScript() calls
  // (AnyoneCanPay, TypeId, etc.) continue to resolve without throwing.
  let client: ccc.ClientPublicTestnet;

  if (isLocal) {
    const depGroupTxHash = await fetchGenesisDepGroupTxHash(rpcUrl);

    const devnetSecp256k1Override: ccc.ScriptInfoLike = {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      // output index 0 of the genesis dep-group tx is the
      // secp256k1-blake160 + multisig combined dep-group.
      cellDeps: [
        {
          cellDep: {
            outPoint: { txHash: depGroupTxHash, index: 0 },
            depType: "depGroup",
          },
        },
      ],
    };

    const localScripts = {
      ...new ccc.ClientPublicTestnet().scripts,
      [ccc.KnownScript.Secp256k1Blake160]: devnetSecp256k1Override,
    };

    client = new ccc.ClientPublicTestnet({ url: rpcUrl, scripts: localScripts });
  } else {
    client = new ccc.ClientPublicTestnet({ url: rpcUrl });
  }

  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

  // Resolve the recipient address string into a lock script.
  // Address.fromString does a full bech32/bech32m decode with checksum
  // verification. If it throws, we re-raise with a friendly message so the
  // UI can display it instead of a raw CCC stack trace.
  let recipientAddr: Awaited<ReturnType<typeof ccc.Address.fromString>>;
  try {
    recipientAddr = await ccc.Address.fromString(recipientAddress, client);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Invalid recipient address "${recipientAddress}": ${raw}. ` +
        `Ensure the address is a valid CKB testnet/devnet address (starts with "ckt1").`,
    );
  }

  // 1 CKB = 10^8 shannons. fixedPointFrom handles decimal amounts.
  const capacityShannons = ccc.fixedPointFrom(amountCkb);

  // Build: one output cell owned by the recipient.
  const tx = ccc.Transaction.from({
    outputs: [{ lock: recipientAddr.script, capacity: capacityShannons }],
    outputsData: ["0x"],
  });

  // Collect live cells from the sender until inputs cover the output capacity.
  await tx.completeInputsByCapacity(signer);

  // Add a change output back to the sender and deduct the transaction fee.
  await tx.completeFeeBy(signer, BigInt(1000));

  // Broadcast. Re-surface any errors clearly.
  const txHash = await signer.sendTransaction(tx);
  return { txHash };
}
