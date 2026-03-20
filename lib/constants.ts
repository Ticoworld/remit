/**
 * Minimum AI confidence score (0–1) required to trust an AI parse result.
 * If the model returns a lower score the result is discarded and the
 * regex fallback is used instead.
 */
export const AI_CONFIDENCE_THRESHOLD = 0.7;
