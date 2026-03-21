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
    <section className="border border-neutral-800/50 bg-neutral-900/10 rounded-xl p-5 flex flex-col gap-4 transition-all duration-300 hover:border-neutral-700/50">
      <div className="flex flex-col gap-4">
        {/* Section header */}
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-400 tracking-tight flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
              Rules Configuration
            </h2>
          </div>
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {POLICY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                title={preset.description}
                className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded border border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Approved addresses */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            Approved recipients <span className="text-neutral-600 lowercase tracking-normal font-medium">(one per line)</span>
          </label>
          <textarea
            className="w-full bg-black/50 border border-neutral-800/60 rounded-md px-3 py-2.5 text-[11px] leading-relaxed font-mono text-neutral-300 resize-y min-h-[60px] focus:outline-none focus:border-neutral-500 focus:bg-neutral-950 transition-colors shadow-inner [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800/80 [&::-webkit-scrollbar-thumb]:rounded-full"
            value={addresses}
            onChange={(e) => {
              setAddresses(e.target.value);
              setErrors([]);
            }}
            placeholder={"ckt1qz...\nckt1qy..."}
            spellCheck={false}
          />
        </div>

        {/* Spend limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Max spend <span className="text-neutral-600 lowercase tracking-normal font-medium">(ckb)</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full bg-neutral-950/40 border border-neutral-800/80 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:border-neutral-600 focus:bg-neutral-900/60 transition-colors"
              value={maxSpend}
              onChange={(e) => {
                setMaxSpend(e.target.value);
                setErrors([]);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Auto-execute below <span className="text-neutral-600 lowercase tracking-normal font-medium">(ckb)</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full bg-neutral-950/40 border border-neutral-800/80 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:border-neutral-600 focus:bg-neutral-900/60 transition-colors"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setErrors([]);
              }}
            />
          </div>
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="border border-red-900/30 rounded p-2 bg-red-950/10 flex flex-col gap-0.5 mt-1">
            {errors.map((e, i) => (
              <p key={i} className="text-[11px] font-medium text-red-400">
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-neutral-800 text-neutral-300 text-[11px] font-bold uppercase tracking-wider rounded hover:bg-neutral-700 hover:text-white active:scale-95 transition-all border border-neutral-700"
          >
            Save Rules
          </button>
          {saved && (
            <span className="text-[11px] text-green-500 font-medium flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              Saved
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
