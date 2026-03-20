/**
 * localStorage persistence helpers.
 * All functions are safe to call on the server (they no-op when window is
 * undefined), so they can be imported freely in client components.
 *
 * Dates are stored as ISO strings and revived automatically on load.
 */

import {
  ApprovalQueueItem,
  ExecutionLogEntry,
  RemitPolicy,
} from "./types";

const KEY_POLICY  = "remit:policy";
const KEY_HISTORY = "remit:history";
const KEY_QUEUE   = "remit:queue";

// ─── Date revival ─────────────────────────────────────────────────────────────

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value);
  }
  return value;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw, dateReviver) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private browsing — silently ignore.
  }
}

// ─── Policy ───────────────────────────────────────────────────────────────────

export function loadPolicy(): RemitPolicy | null {
  return load<RemitPolicy>(KEY_POLICY);
}

export function savePolicy(p: RemitPolicy): void {
  save(KEY_POLICY, p);
}

// ─── Execution history ────────────────────────────────────────────────────────

export function loadHistory(): ExecutionLogEntry[] {
  return load<ExecutionLogEntry[]>(KEY_HISTORY) ?? [];
}

export function saveHistory(entries: ExecutionLogEntry[]): void {
  save(KEY_HISTORY, entries);
}

// ─── Approval queue ───────────────────────────────────────────────────────────

export function loadQueue(): ApprovalQueueItem[] {
  return load<ApprovalQueueItem[]>(KEY_QUEUE) ?? [];
}

export function saveQueue(items: ApprovalQueueItem[]): void {
  save(KEY_QUEUE, items);
}
