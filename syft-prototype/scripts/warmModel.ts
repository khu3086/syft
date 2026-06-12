/**
 * Build-time warm-up: pulls the local sentence-transformer (all-MiniLM-L6-v2)
 * into the on-disk cache so it's baked into the Docker image. The first
 * production search is then instant and doesn't depend on the Hugging Face hub
 * being reachable at runtime. Pure local embedding — no API key required.
 *
 * This is an OPTIMISATION, not a build requirement: the seed pool is already
 * pre-embedded in data/embeddings.json, and if the model can't be fetched at
 * build time it downloads lazily on the first search instead. So a flaky/timed-
 * out Hugging Face download must NEVER fail the deploy — we retry, then continue.
 */
import { embedQuery } from "../lib/matching/providers/embeddings";

const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const t0 = Date.now();
      const v = await embedQuery("warm up the local embedding model");
      console.log(`model warm: ${v.length}-dim vector in ${Date.now() - t0}ms`);
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[warm:model] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${msg}`);
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 5000); // 5s, 10s, 15s backoff
    }
  }
  // Out of retries — don't block the build. The model downloads on first use.
  console.warn(
    "[warm:model] could not pre-cache the embedding model (Hugging Face unreachable) — " +
      "continuing the build; it will download lazily on the first search at runtime.",
  );
}

// Never exit non-zero: warming is best-effort and must not fail the deploy.
main().catch((e) => {
  console.warn("[warm:model] unexpected error (ignored, build continues):", e);
});
