/**
 * Server-only helper. Import only from server actions.
 *
 * Fetches the AI model endpoint and returns the raw parsed JSON as `unknown`.
 * Callers are responsible for validating the shape with the Zod schema in
 * lib/ai-schema.ts — this function intentionally does NOT cast or validate.
 *
 * Required env vars:
 *   ANTHROPIC_BASE_URL   — e.g. https://api.anthropic.com
 *   ANTHROPIC_AUTH_TOKEN — API key
 *   ANTHROPIC_MODEL      — e.g. claude-haiku-4-5-20251001
 */

const SYSTEM_PROMPT = `You are a strict JSON extractor for CKB blockchain transfer instructions.

Given a natural-language user task, extract the transfer intent.
Return ONLY valid JSON — no markdown, no prose, no explanation outside the JSON.

Output schema:
{
  "status": "parsed" | "unparsed",
  "action": {
    "intent": "transfer",
    "asset": "CKB",
    "amountCkb": <positive number>,
    "recipient": "<address string>"
  } | null,
  "confidence": <0.0–1.0>,
  "rationale": "<one short sentence>",
  "rawUserTask": "<copy of the original user text>"
}

Rules:
- Set status "parsed" only when asset is CKB, amountCkb > 0, and recipient is non-empty.
- Do NOT invent, guess, or fill in missing values.
- If amount, asset, or recipient is missing or ambiguous, set status "unparsed" and action null.
- asset must be exactly the string "CKB"; any other asset yields "unparsed".
- confidence reflects certainty (0 = guessing, 1 = certain).
- rationale is one sentence explaining your decision.`;

export async function aiParseTask(userTask: string): Promise<unknown> {
  const baseUrl    = process.env.ANTHROPIC_BASE_URL;
  const authToken  = process.env.ANTHROPIC_AUTH_TOKEN;
  const model      = process.env.ANTHROPIC_MODEL;

  if (!baseUrl || !authToken || !model) {
    throw new Error(
      "AI parser: missing env vars (ANTHROPIC_BASE_URL / ANTHROPIC_AUTH_TOKEN / ANTHROPIC_MODEL)",
    );
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": authToken,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userTask }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`AI parser HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data?.content?.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("AI parser: empty response content");

  // Strip markdown code fences if the model wraps the JSON despite instructions.
  const jsonStr = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // Return raw parsed JSON — the caller validates the shape via Zod.
  return JSON.parse(jsonStr);
}
