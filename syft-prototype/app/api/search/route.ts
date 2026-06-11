// POST /api/search  { query: string }  ->  SearchResult
// Runs the full three-stage funnel. The pool comes from Postgres (pgvector) when
// configured, ranked as the LOGGED-IN user; it falls back to the in-memory seed
// pool / default searcher so the prototype still works without a database.
// Server-only — the LLM key and the raw pool never reach the client.

import { NextResponse } from "next/server";
import { search } from "@/lib/matching/engine";
import { defaultSearcher } from "@/data/profiles.seed";
import { loadPool } from "@/data/loadPool";
import {
  loadEmbeddedPoolFromDb,
  getSearcherForUser,
  countPool,
  matchProfileIds,
  fetchEmbeddedProfilesByIds,
} from "@/lib/data/profiles";
import { embedQuery } from "@/lib/matching/providers/embeddings";
import { RPC_POOL_THRESHOLD, RETRIEVE_K } from "@/lib/matching/config";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EmbeddedProfile, Searcher } from "@/lib/matching/types";

export const runtime = "nodejs";
// Each search makes live LLM/embedding calls; don't cache.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let query: unknown;
  try {
    ({ query } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof query !== "string" || query.trim().length < 3) {
    return NextResponse.json(
      { error: "Describe who you're looking for in a sentence or two." },
      { status: 400 },
    );
  }

  try {
    // Rank as the logged-in user when we can identify them; else the demo searcher.
    let searcher: Searcher = defaultSearcher;
    let viewerId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          viewerId = user.id;
          const s = await getSearcherForUser(user.id);
          if (s) searcher = s;
        }
      } catch {
        /* not signed in / auth unavailable — fall back to the demo searcher */
      }
    }

    // Resolve the candidate pool:
    //  - large DB pool  → pgvector RPC recalls the top-K candidates (rank cheap in
    //    the DB via the HNSW index); the engine then refines those K.
    //  - small DB pool  → load it all and let the in-memory funnel be exact.
    //  - no DB          → the seeded file pool.
    let pool: EmbeddedProfile[];
    try {
      const total = await countPool(); // null when the DB isn't configured
      if (total !== null && total > RPC_POOL_THRESHOLD) {
        const queryEmbedding = await embedQuery(query.trim());
        const ids = await matchProfileIds(queryEmbedding, RETRIEVE_K, viewerId);
        pool = await fetchEmbeddedProfilesByIds(ids);
      } else if (total !== null) {
        const dbPool = await loadEmbeddedPoolFromDb();
        pool = dbPool && dbPool.length > 0 ? dbPool : loadPool();
      } else {
        pool = loadPool();
      }
    } catch {
      pool = loadPool();
    }

    // Never rank the searcher against their own profile.
    if (viewerId) pool = pool.filter((p) => p.id !== viewerId);

    const result = await search(query.trim(), searcher, pool);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
