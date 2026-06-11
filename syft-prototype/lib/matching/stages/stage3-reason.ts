// Stage 3 — LLM deep reasoning (PDF §2.3). The one expensive step, applied ONLY
// to the top-N survivors of Stage 2 (never one-per-pool). Each pair gets a full
// structured assessment from the reasoning model. Concurrency is bounded to stay
// within small free-tier token-per-minute caps (the LLM client also retries 429s).

import { STAGE3_CONCURRENCY } from "../config";
import { reasonOnPair } from "../providers/llm";
import type { EmbeddedProfile, LlmAssessment, ParsedQuery, Searcher } from "../types";

export interface ReasonedCandidate {
  profileId: string;
  assessment: LlmAssessment;
}

/** Run an async mapper over items with a fixed max concurrency, preserving order. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Reason over each top-N candidate (bounded concurrency). One assessment each. */
export async function reasonTopN(
  parsed: ParsedQuery,
  searcher: Searcher,
  candidates: EmbeddedProfile[],
): Promise<ReasonedCandidate[]> {
  return mapLimit(candidates, STAGE3_CONCURRENCY, async (c) => ({
    profileId: c.id,
    assessment: await reasonOnPair(parsed, searcher, c),
  }));
}
