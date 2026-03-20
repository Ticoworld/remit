"use server";

import { aiParseTask } from "@/lib/ai-parser";
import { AiParseResultSchema } from "@/lib/ai-schema";
import { AI_CONFIDENCE_THRESHOLD } from "@/lib/constants";
import { parseTask } from "@/lib/parser";
import { AiAttemptRecord, ParsedAction, ParserUsed } from "@/lib/types";

export interface ParseTaskResult {
  parsedAction: ParsedAction | null;
  parserUsed: ParserUsed;
  /** Full AI trust audit record — always present, regardless of outcome. */
  aiAttempt: AiAttemptRecord;
  parseError: string | null;
}

/**
 * Server action: AI parse → Zod validate → confidence gate → regex fallback.
 *
 * Trust boundary:
 *   1. aiParseTask() returns raw unknown JSON — no cast, no assumption.
 *   2. AiParseResultSchema validates the full shape with Zod.
 *   3. confidence must be >= AI_CONFIDENCE_THRESHOLD.
 *   4. If any gate fails, the outcome is recorded and regex takes over.
 *   5. Regex parser is the final safety net.
 */
export async function parseTaskAction(task: string): Promise<ParseTaskResult> {
  let parsedAction: ParsedAction | null = null;
  let parserUsed: ParserUsed = "fallback";
  let aiAttempt: AiAttemptRecord = { outcome: "ai-skipped" };

  const hasAiConfig = !!(
    process.env.ANTHROPIC_BASE_URL &&
    process.env.ANTHROPIC_AUTH_TOKEN &&
    process.env.ANTHROPIC_MODEL
  );

  if (hasAiConfig) {
    // ── Gate 1: fetch raw JSON from model ──────────────────────────────────────
    let rawJson: unknown = null;
    let fetchFailed = false;
    try {
      rawJson = await aiParseTask(task);
    } catch {
      fetchFailed = true;
    }

    if (fetchFailed) {
      aiAttempt = { outcome: "ai-error" };
    } else {
      // ── Gate 2: strict Zod schema validation ───────────────────────────────
      const schemaResult = AiParseResultSchema.safeParse(rawJson);

      if (!schemaResult.success) {
        aiAttempt = { outcome: "ai-invalid-schema" };
      } else {
        // Stamp rawUserTask from our side so the model cannot mutate it.
        const aiResult = { ...schemaResult.data, rawUserTask: task };

        if (aiResult.status === "unparsed" || !aiResult.action) {
          // ── Gate 3a: model declined to parse ─────────────────────────────
          aiAttempt = {
            outcome:    "ai-unparsed",
            confidence: aiResult.confidence,
            rationale:  aiResult.rationale,
          };
        } else if (aiResult.confidence < AI_CONFIDENCE_THRESHOLD) {
          // ── Gate 3b: confidence threshold ────────────────────────────────
          aiAttempt = {
            outcome:    "ai-low-confidence",
            confidence: aiResult.confidence,
            rationale:  aiResult.rationale,
          };
        } else {
          // ── Gate 4: accept ────────────────────────────────────────────────
          parsedAction = {
            asset:     aiResult.action.asset,
            amount:    aiResult.action.amountCkb,
            recipient: aiResult.action.recipient,
            raw:       task,
          };
          parserUsed = "ai";
          aiAttempt = {
            outcome:    "ai-accepted",
            confidence: aiResult.confidence,
            rationale:  aiResult.rationale,
          };
        }
      }
    }
  }

  // ── Regex fallback (runs whenever AI did not produce a result) ────────────────
  if (!parsedAction) {
    parsedAction = parseTask(task);
    parserUsed   = "fallback";
  }

  if (!parsedAction) {
    return {
      parsedAction: null,
      parserUsed:   "fallback",
      aiAttempt,
      parseError:   `Could not parse "${task}". Supported pattern: send {amount} ckb to {address}`,
    };
  }

  return { parsedAction, parserUsed, aiAttempt, parseError: null };
}
