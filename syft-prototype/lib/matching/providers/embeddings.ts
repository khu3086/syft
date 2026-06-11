// Embedding provider — local & open-source via Transformers.js.
//
// Runs an open sentence-transformer (all-MiniLM-L6-v2, 384-dim) entirely in Node
// with NO API key and NO per-call cost. The model downloads from the Hugging Face
// hub on first use and is cached locally thereafter. Profiles and queries embed
// with the SAME model so they share one vector space. Swapping the vector backend
// later (e.g. pgvector + a hosted embedding model) stays behind this seam.

import { pipeline } from "@huggingface/transformers";
import { EMBEDDING_MODEL } from "../config";

// Minimal local type for the feature-extraction pipeline. Avoids referencing the
// library's huge overloaded pipeline union (which trips TS2590).
type Extractor = (
  texts: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      EMBEDDING_MODEL,
    ) as unknown as Promise<Extractor>;
  }
  return extractorPromise;
}

// Kept for API symmetry with hosted providers; this local model doesn't need it.
type EmbedInputType = "query" | "document";

/** Embed a batch of texts into normalized mean-pooled sentence vectors. */
export async function embed(
  texts: string[],
  _inputType: EmbedInputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}

/** Embed one document (a profile narrative). */
export async function embedDocument(text: string): Promise<number[]> {
  const [v] = await embed([text], "document");
  return v;
}

/** Embed one query narrative. */
export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embed([text], "query");
  return v;
}

/** Cosine similarity of two equal-length vectors, in [-1, 1]. */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Map cosine to a 0..1 similarity score for composite blending. For normalized
 *  sentence-transformer vectors, related English text lands ~0.3-0.6 and unrelated
 *  near 0, so clamping the raw cosine to [0,1] preserves the most discrimination. */
export function cosineTo01(c: number): number {
  return Math.max(0, Math.min(1, c));
}
