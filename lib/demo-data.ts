import { RemitPolicy } from "./types";
import { MIN_TRANSFER_CKB } from "./validation";

export interface PolicyPreset {
  name: string;
  description: string;
  policy: RemitPolicy;
}

export interface DemoScenario {
  label: string;
  task: string;
  outcome: "allowed" | "approval-needed" | "blocked";
}

// Real OffCKB devnet funded addresses (account #0 is the sender wallet).
// DEMO_ADDR_A — account #1 (approved, primary recipient)
export const DEMO_ADDR_A = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt435c3epyrupszm7khk6weq5lrlyt52lg48ucew";
// DEMO_ADDR_B — account #2 (approved, secondary recipient; used in Demo Sandbox)
export const DEMO_ADDR_B = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

// An address that is NOT in any preset — guaranteed to trigger "blocked".
// account #3 (funded but not in any approved list)
const UNKNOWN_ADDR = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0xt7prh3dy3gu9z45svp89q0d6f6c46cg9dp9mn";

export const POLICY_PRESETS: PolicyPreset[] = [
  {
    name: "Demo Sandbox",
    description: "Wide limits — all three outcome types are reachable",
    policy: {
      approvedAddresses: [DEMO_ADDR_A, DEMO_ADDR_B],
      approvedAsset: "CKB",
      maxSpendPerAction: 1000,
      approvalThreshold: 100,
    },
  },
  {
    name: "Basic Ops",
    description: "Moderate limits — larger transfers require approval",
    policy: {
      approvedAddresses: [DEMO_ADDR_A],
      approvedAsset: "CKB",
      maxSpendPerAction: 500,
      approvalThreshold: 150,
    },
  },
  {
    name: "Tight Treasury",
    description: "Strict limits — almost everything queued or blocked",
    policy: {
      approvedAddresses: [DEMO_ADDR_A],
      approvedAsset: "CKB",
      maxSpendPerAction: 200,
      approvalThreshold: 80,
    },
  },
];

/**
 * Compute realistic demo scenarios for the given policy.
 * Each scenario is guaranteed to hit the claimed outcome when evaluated.
 */
export function getDemoScenarios(policy: RemitPolicy): DemoScenario[] {
  const addr = policy.approvedAddresses[0];
  const scenarios: DemoScenario[] = [];

  // ── Allowed ──────────────────────────────────────────────────────────────────
  // amount < threshold, <= maxSpend, >= MIN_TRANSFER_CKB
  if (addr) {
    const candidate = policy.approvalThreshold - 1;
    if (candidate >= MIN_TRANSFER_CKB && candidate <= policy.maxSpendPerAction) {
      scenarios.push({
        label: "Allowed",
        task: `send ${candidate} ckb to ${addr}`,
        outcome: "allowed",
      });
    }
  }

  // ── Approval-needed ───────────────────────────────────────────────────────────
  // amount > threshold, <= maxSpend, >= MIN_TRANSFER_CKB
  if (addr) {
    const candidate = policy.approvalThreshold + 1;
    if (candidate >= MIN_TRANSFER_CKB && candidate <= policy.maxSpendPerAction) {
      scenarios.push({
        label: "Needs Approval",
        task: `send ${candidate} ckb to ${addr}`,
        outcome: "approval-needed",
      });
    }
  }

  // ── Blocked ───────────────────────────────────────────────────────────────────
  // Always use an address that is not in the active policy.
  const blockedAddr = [UNKNOWN_ADDR, DEMO_ADDR_B, DEMO_ADDR_A].find(
    (a) => !policy.approvedAddresses.includes(a),
  ) ?? UNKNOWN_ADDR;

  scenarios.push({
    label: "Blocked",
    task: `send 80 ckb to ${blockedAddr}`,
    outcome: "blocked",
  });

  return scenarios;
}
