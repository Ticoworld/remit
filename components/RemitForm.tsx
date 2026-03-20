"use client";

import { useState } from "react";
import { RemitPolicy } from "@/lib/types";
import { POLICY_PRESETS } from "@/lib/demo-data";
import { validateCkbAddress, addressValidationMessage } from "@/lib/address-validation";
import { validateAddressListOnServer } from "@/app/actions/validate-address";

interface Props {
  policy: RemitPolicy;
  onSave: (policy: RemitPolicy) => void;
}

function validatePolicyFields(
  addresses: string[],
  maxSpend: number,
  threshold: number,
): string[] {
  const errors: string[] = [];

  if (addresses.length === 0) {
    errors.push("At least one approved recipient address is required.");
  }

  for (const addr of addresses) {
    const result = validateCkbAddress(addr);
    if (!result.ok) {
      const msg = addressValidationMessage(result);
      errors.push(`"${addr.slice(0, 20)}${addr.length > 20 ? "…" : ""}": ${msg}`);
      break; // surface one at a time to keep feedback readable
    }
  }

  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const a of addresses) {
    if (seen.has(a)) dupes.push(a);
    else seen.add(a);
  }
  if (dupes.length > 0) {
    errors.push(`Duplicate addresses are not allowed: ${dupes[0]}.`);
  }

  if (!Number.isFinite(maxSpend) || maxSpend <= 0) {
    errors.push("Max spend per action must be greater than 0.");
  }
  if (!Number.isFinite(threshold) || threshold <= 0) {
    errors.push("Approval threshold must be greater than 0.");
  }
  if (
    Number.isFinite(maxSpend) &&
    Number.isFinite(threshold) &&
    maxSpend > 0 &&
    threshold > maxSpend
  ) {
    errors.push(
      `Approval threshold (${threshold}) cannot exceed max spend (${maxSpend}).`,
    );
  }

  return errors;
}

export default function RemitForm({ policy, onSave }: Props) {
  const [addresses, setAddresses] = useState(
    policy.approvedAddresses.join("\n"),
  );
  const [maxSpend, setMaxSpend] = useState(String(policy.maxSpendPerAction));
  const [threshold, setThreshold] = useState(String(policy.approvalThreshold));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function applyPreset(preset: (typeof POLICY_PRESETS)[number]) {
    setAddresses(preset.policy.approvedAddresses.join("\n"));
    setMaxSpend(String(preset.policy.maxSpendPerAction));
    setThreshold(String(preset.policy.approvalThreshold));
    setErrors([]);
    setSaved(false);
  }

  async function handleSave() {
    const addrList = addresses
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);
    const maxSpendNum = parseFloat(maxSpend);
    const thresholdNum = parseFloat(threshold);

    const errs = validatePolicyFields(addrList, maxSpendNum, thresholdNum);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    // Secondary CCC-level check: validates bech32 checksum using the same
    // library as the transfer layer, catching addresses that slip past the
    // regex-only validateCkbAddress.
    const cccErr = await validateAddressListOnServer(addrList);
    if (cccErr) {
      setErrors([cccErr]);
      return;
    }

    setErrors([]);
    onSave({
      approvedAddresses: addrList,
      approvedAsset: "CKB",
      maxSpendPerAction: maxSpendNum,
      approvalThreshold: thresholdNum,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="border border-neutral-700 rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">Remit Policy</h2>
      </div>

      {/* Policy presets */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-neutral-500 uppercase tracking-widest">
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {POLICY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              title={preset.description}
              className="px-3 py-1 text-xs font-medium rounded border border-neutral-600 text-neutral-300 hover:border-neutral-400 hover:text-neutral-100 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-neutral-400">
          Approved recipient addresses{" "}
          <span className="text-neutral-600">(one per line)</span>
        </label>
        <textarea
          className="bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm font-mono text-neutral-100 resize-none focus:outline-none focus:border-neutral-400"
          rows={4}
          value={addresses}
          onChange={(e) => {
            setAddresses(e.target.value);
            setErrors([]);
          }}
          placeholder={"ckt1qz...\nckt1qy..."}
          spellCheck={false}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">
            Max spend per action{" "}
            <span className="text-neutral-600">(CKB)</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            className="bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-400"
            value={maxSpend}
            onChange={(e) => {
              setMaxSpend(e.target.value);
              setErrors([]);
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">
            Auto-execute threshold{" "}
            <span className="text-neutral-600">(CKB)</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            className="bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-400"
            value={threshold}
            onChange={(e) => {
              setThreshold(e.target.value);
              setErrors([]);
            }}
          />
          <p className="text-xs text-neutral-600">
            Transfers at or below this amount execute immediately when allowed.
            Above it: queued for approval.
          </p>
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="border border-red-700 rounded p-3 bg-neutral-900 flex flex-col gap-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">
              {e}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-medium rounded hover:bg-white transition-colors"
        >
          Save Policy
        </button>
        {saved && (
          <span className="text-sm text-green-400">Policy saved.</span>
        )}
      </div>
    </section>
  );
}
