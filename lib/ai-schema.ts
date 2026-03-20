/**
 * Zod schema for the AI parser output.
 *
 * This is the single source of truth for what we accept from the model.
 * Every field is validated strictly — no coercion, no optional leniency.
 * If the model returns anything that doesn't match, safeParse returns
 * success:false and the caller falls back to the regex parser.
 */

import { z } from "zod";

export const AiActionSchema = z.object({
  intent:    z.literal("transfer"),
  asset:     z.literal("CKB"),          // only CKB is accepted
  amountCkb: z.number().positive(),     // must be > 0
  recipient: z.string().min(1),         // non-empty address string
});

export const AiParseResultSchema = z.object({
  status:      z.enum(["parsed", "unparsed"]),
  action:      AiActionSchema.nullable(),
  confidence:  z.number().min(0).max(1),
  rationale:   z.string(),
  rawUserTask: z.string(),
});

/** TypeScript type inferred from the Zod schema — do not define separately. */
export type AiParseResult = z.infer<typeof AiParseResultSchema>;
