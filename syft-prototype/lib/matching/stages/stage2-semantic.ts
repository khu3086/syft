// Stage 2 — Semantic vector similarity (PDF §2.2). Very low cost: one query
// embedding, then in-memory cosine against survivors (production: a pgvector
// ANN query). Profiles are NOT re-embedded here — that happened once in Stage 0.

import { cosine, cosineTo01, embedQuery } from "../providers/embeddings";
import type { EmbeddedProfile } from "../types";

export interface SemanticScore {
  profileId: string;
  /** Raw cosine in [-1, 1]. */
  cosine: number;
  /** Normalized to [0, 1] for composite blending. */
  score: number;
}

/** Embed the query narrative once and rank candidates by cosine similarity. */
export async function scoreSemantic(
  queryNarrative: string,
  candidates: EmbeddedProfile[],
): Promise<{ queryVector: number[]; scores: Map<string, SemanticScore> }> {
  const queryVector = await embedQuery(queryNarrative);
  const scores = new Map<string, SemanticScore>();
  for (const c of candidates) {
    const cos = cosine(queryVector, c.embedding);
    scores.set(c.id, { profileId: c.id, cosine: cos, score: cosineTo01(cos) });
  }
  return { queryVector, scores };
}

/** Top-N candidate ids by semantic score (descending). */
export function topNBySemantic(
  scores: Map<string, SemanticScore>,
  n: number,
): string[] {
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.profileId);
}
