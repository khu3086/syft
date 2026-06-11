// Loads the precomputed Stage-0 embeddings and merges them with the seed profiles
// into a ready-to-rank pool. Used by the API route so a search never re-embeds
// profiles. Throws a clear error if embeddings haven't been generated yet.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { seedProfiles } from "./profiles.seed";
import type { EmbeddedProfile } from "@/lib/matching/types";

interface StoredEmbedding {
  id: string;
  narrative: string;
  embedding: number[];
}

let cached: EmbeddedProfile[] | null = null;

export function loadPool(): EmbeddedProfile[] {
  if (cached) return cached;

  const path = join(process.cwd(), "data", "embeddings.json");
  let stored: StoredEmbedding[];
  try {
    stored = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(
      "data/embeddings.json not found. Run `pnpm embed:seed` once to generate " +
        "profile embeddings before searching.",
    );
  }

  const byId = new Map(stored.map((s) => [s.id, s]));
  cached = seedProfiles.map((p) => {
    const e = byId.get(p.id);
    if (!e) {
      throw new Error(
        `No embedding for profile "${p.id}". Re-run \`pnpm embed:seed\` after editing the seed pool.`,
      );
    }
    return { ...p, narrative: e.narrative, embedding: e.embedding };
  });
  return cached;
}
