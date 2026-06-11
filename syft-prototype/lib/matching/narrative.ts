// Stage 0 — "embed once" (CLAUDE.md §3). Runs once per profile, offline, never
// in the search path: fuse the three raw signals into a curated narrative
// (PDF "What to embed"), then embed that narrative into a single vector.

import { embedDocument } from "./providers/embeddings";
import { narrate } from "./providers/llm";
import type { EmbeddedProfile, Profile } from "./types";

/** Produce the canonical narrative + embedding for one profile. */
export async function buildProfileEmbedding(profile: Profile): Promise<EmbeddedProfile> {
  const narrative = profile.narrative ?? (await narrate(profile));
  const embedding = await embedDocument(narrative);
  return { ...profile, narrative, embedding };
}
