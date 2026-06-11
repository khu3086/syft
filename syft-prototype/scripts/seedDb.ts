// Seed the Supabase pool with the 15 demo profiles + their precomputed embeddings
// (from data/embeddings.json — no recompute, no LLM/embedding calls). Run once
// after applying supabase/schema.sql:
//
//   pnpm db:seed
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.

import "dotenv/config";
import { loadPool } from "@/data/loadPool";
import { storeEmbeddedProfile } from "@/lib/data/profiles";
import { hasAdmin } from "@/lib/supabase/admin";

async function main() {
  if (!hasAdmin()) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before seeding.",
    );
  }

  const pool = loadPool(); // seed profiles merged with data/embeddings.json
  console.log(`Seeding ${pool.length} profiles into Supabase…`);

  for (const p of pool) {
    await storeEmbeddedProfile(p, null); // system profiles have no auth user
    console.log(`  ✓ ${p.name.padEnd(8)} (${p.embedding.length}-dim)`);
  }

  console.log(`\nDone — ${pool.length} profiles are now in the pool.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
