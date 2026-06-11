// Stage 0 runner — "embed once". Builds the narrative + embedding for every seed
// profile and writes them to data/embeddings.json, so the running app never embeds
// profiles in the search path. Run once after editing the seed pool:
//
//   pnpm embed:seed
//
// Optional headless funnel check — pass a query to run a full search end-to-end:
//
//   pnpm embed:seed "warm, curious person who loves the outdoors"

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildProfileEmbedding } from "@/lib/matching/narrative";
import { search } from "@/lib/matching/engine";
import { defaultSearcher, seedProfiles } from "@/data/profiles.seed";
import type { EmbeddedProfile } from "@/lib/matching/types";

interface StoredEmbedding {
  id: string;
  narrative: string;
  embedding: number[];
}

const OUT_PATH = join(process.cwd(), "data", "embeddings.json");

async function main() {
  console.log(`Stage 0: narrating + embedding ${seedProfiles.length} profiles…`);
  const embedded: EmbeddedProfile[] = [];
  for (const p of seedProfiles) {
    const e = await buildProfileEmbedding(p);
    embedded.push(e);
    console.log(`  ✓ ${p.name.padEnd(8)} (${e.embedding.length}-dim)`);
  }

  const stored: StoredEmbedding[] = embedded.map((e) => ({
    id: e.id,
    narrative: e.narrative,
    embedding: e.embedding,
  }));
  writeFileSync(OUT_PATH, JSON.stringify(stored, null, 2));
  console.log(`\nWrote ${stored.length} embeddings -> ${OUT_PATH}`);

  const query = process.argv[2];
  if (!query) {
    console.log('\nTip: pass a query to test the funnel, e.g.\n  pnpm embed:seed "loves trail running and quiet weekends"');
    return;
  }

  console.log(`\n--- Running funnel for: "${query}" ---`);
  const res = await search(query, defaultSearcher, embedded);
  if (res.refusedDimensions.length) {
    console.log("\nRefused (refuse-and-reframe):");
    for (const r of res.refusedDimensions) console.log(`  • ${r.stance}`);
  }
  console.log(`\n${res.honest.message}\n`);
  for (const m of res.results) {
    console.log(`${m.name}, ${m.age} — ${m.label} (${(m.composite * 100) | 0}%)`);
    console.log(`  why: ${m.assessment.explanation}`);
    if (m.assessment.riskFlags.length) console.log(`  risks: ${m.assessment.riskFlags.join("; ")}`);
    for (const t of m.tensions) console.log(`  ⚖ ${t.pattern}: ${t.note}`);
    console.log("");
  }
  console.log("Telemetry:", JSON.stringify(res.telemetry));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
