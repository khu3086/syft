/**
 * Build-time warm-up: pulls the local sentence-transformer (all-MiniLM-L6-v2)
 * into the on-disk cache so it's baked into the Docker image. The first
 * production search is then instant and doesn't depend on the Hugging Face hub
 * being reachable at runtime. Pure local embedding — no API key required.
 */
import { embedQuery } from "../lib/matching/providers/embeddings";

async function main() {
  const t0 = Date.now();
  const v = await embedQuery("warm up the local embedding model");
  console.log(`model warm: ${v.length}-dim vector in ${Date.now() - t0}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
