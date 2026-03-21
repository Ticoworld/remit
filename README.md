# Remit

Remit is a permissioned execution runtime for AI agents on CKB.

## Problem

AI agents can propose actions, but unrestricted wallet access is unsafe. Users need bounded execution, not blind trust. Remit solves allow, queue, and block routing for proposed on-chain actions.

## Solution

The user defines rules for an execution wallet. When an agent task is interpreted into an Agent Proposal, it is checked against these rules. Remit then decides whether to:
- allow execution
- queue for approval
- block execution

## Core flow

1. **User task:** A natural-language task is submitted.
2. **AI proposal:** The agent interprets the task into a structured action (asset, amount, recipient).
3. **Policy engine:** Remit evaluates the proposal against the active Rules Configuration.
4. **Decision:** Remit outputs the evaluation state (Allowed, Approval-needed, or Blocked).

## Current features

- Configurable rules (approved recipients, max spend, auto-execute thresholds).
- Natural-language runtime parser with fallback logic.
- Agent Proposal observability (showing confidence and rationale).
- Trust Pipeline visualization.
- Deterministic decision states (Allowed, Approval-needed, Blocked).
- Integrated Approval Queue with "Approve & Execute" and "Reject" flows.
- Runtime log with decision and execution history.
- Toggleable environments (Local Devnet and CKB Testnet).
- Testnet transaction broadcast with live explorer linking.

## Why this matters for CKB

Remit acts as a permissioned execution runtime for AI agents on CKB. It provides bounded authority for agent wallets, treasury bots, and payment agents, proving that CKB supports controlled agent execution, not just raw automation.

## Tech stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Blockchain Interaction:** `@ckb-ccc/connector-react`
- **Validation:** Zod

## Local setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

## Environment variables

Configure these in your `.env.local` file:

```env
# Required for execution
DEV_SENDER_PRIVATE_KEY=0x...
REMIT_NETWORK_MODE=local # or testnet

# Required for network connection
CKB_RPC_URL=http://127.0.0.1:28114
CKB_EXPLORER_TX_BASE_URL=https://pudge.explorer.nervos.org/transaction/

# Optional: Required for AI parsing capabilities
ANTHROPIC_BASE_URL=
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_MODEL=
```

## Running locally

Local mode uses a local devnet node.

1. Ensure your CKB node is running at `http://127.0.0.1:28114`.
2. Set `REMIT_NETWORK_MODE=local` in your `.env.local`.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Running on testnet

Testnet mode connects directly to the CKB Testnet and broadcasts real transactions.

1. Set `REMIT_NETWORK_MODE=testnet` in your `.env.local`.
2. Update the `CKB_RPC_URL` to point to a testnet node (e.g., `https://testnet.ckb.dev/`).
3. Ensure your `DEV_SENDER_PRIVATE_KEY` holds testnet CKB.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Demo scenarios

The UI derives execution logic dynamically from the active "Rules Configuration". To test the evaluation engine, use the built-in **Quick Actions** below the task input. 

These chips automatically generate context-aware agent tasks based on your current limits:
- **Allowed:** Generates a task where the amount is safely below the auto-execute threshold.
- **Needs Approval:** Generates a task where the amount exceeds the auto-execute threshold but remains below the maximum spend limit.
- **Blocked:** Generates a task sending funds to an unknown, unapproved recipient address.

## Current limitations

- **Server-side executor:** The application currently relies on a single server-side wallet defined via environment variable.
- **Unified roles:** The policy owner configuring the rules and the executor broadcasting the transactions act as the same identity in this MVP.
- **Parsing capabilities:** The natural language parser is scoped to "send {amount} to {recipient}" intents.
- **Secret management:** Standard `.env` secret management is used. It is not production-grade or secure for mainnet funds.
- **Off-chain enforcement:** The policy logic is currently enforced via application-tier middleware, not natively on-chain as a CKB script.

## Future work

- Transition policy enforcement from application middleware to an on-chain CKB script (smart contract).
- Abstract the executor role to support multi-wallet architecture and hardware wallet signatures via CCC.
- Expand intent parsing to handle complex multi-step interactions and varied asset types (e.g., xUDT).

## License

MIT License
