// Tunable knobs for the matching engine, all in one place (PDF §3 calls the
// composite weights domain-specific and tunable).

import type { SignalBreakdown } from "./types";

/** Composite-score weights. Must sum to ~1.0. Adapted from the PDF §3 table:
 *  the PDF's "traction" row doesn't map to dating, so its weight folds into the
 *  LLM assessment; "recency" becomes profile active-ness. */
export const WEIGHTS: SignalBreakdown = {
  llm: 0.45,
  semantic: 0.3,
  ruleFit: 0.15,
  recency: 0.1,
};

/** How many Stage-1 survivors advance to expensive Stage-3 reasoning (PDF: 10-20).
 *  Kept modest so a full search stays within small free-tier token-per-minute caps. */
export const TOP_N = 6;

/** Max concurrent Stage-3 reasoning calls. Low to respect free-tier TPM limits
 *  (e.g. Groq's 12k tokens/min); raise it on a paid tier or local Ollama. */
export const STAGE3_CONCURRENCY = 2;

/** Composite floor below which we do NOT surface a match (confidence honesty). */
export const COMPOSITE_FLOOR = 0.55;

/** Max results ever returned (Syft shows up to five, never an infinite feed). */
export const MAX_RESULTS = 5;

/** A candidate is dropped in Stage 1 if it satisfies fewer than this share of
 *  applicable hard criteria. */
export const RULE_FIT_MIN = 0.5;

/** Above this pool size, retrieve candidates via the pgvector RPC (ANN recall in
 *  the DB) instead of loading + scoring the whole pool in-process. Below it, the
 *  whole pool is cheap to load and the in-memory funnel is exact. */
export const RPC_POOL_THRESHOLD = 200;

/** How many candidates the pgvector RPC returns for refinement (rules + Stage 3).
 *  Generous so rule-passing matches survive the ANN recall step. */
export const RETRIEVE_K = 60;

/** Score-band thresholds (PDF §4). */
export const LABEL_BANDS = {
  strong: 0.85,
  good: 0.65,
  moderate: 0.45,
} as const;

/** LLM backend — any OpenAI-compatible server, configured via env. Defaults to
 *  Groq's free tier (open-source Llama models). Works unchanged with Ollama
 *  (fully local, no key), OpenRouter, LM Studio, or Together by setting LLM_BASE_URL
 *  / LLM_API_KEY / LLM_MODEL. */
export const LLM = {
  baseURL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY || "",
  /** Cheap, high-frequency: query parsing + profile narratives. */
  fastModel: process.env.LLM_MODEL || "llama-3.1-8b-instant",
  /** Reasoning model for Stage 3 (top-N only). */
  reasonModel:
    process.env.LLM_REASON_MODEL || process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  /** If the reasoning model is rate-limited (e.g. a free-tier daily cap → 429),
   *  Stage 3 falls back to this cheaper model so search stays up. Defaults to the
   *  fast model, which has a separate, larger quota. */
  reasonFallbackModel:
    process.env.LLM_REASON_FALLBACK_MODEL || process.env.LLM_MODEL || "llama-3.1-8b-instant",
} as const;

/** Local open-source embedding model (Transformers.js — no API key, runs in Node). */
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";

/** How far back "recently active" counts as fully fresh (days). */
export const RECENCY_FULL_DAYS = 7;
/** Beyond this many days, recency contributes ~0. */
export const RECENCY_ZERO_DAYS = 90;

/** Recency contribution 1..0 based on last-active days. */
export function recencyScore(lastActiveDaysAgo: number): number {
  if (lastActiveDaysAgo <= RECENCY_FULL_DAYS) return 1;
  if (lastActiveDaysAgo >= RECENCY_ZERO_DAYS) return 0;
  const span = RECENCY_ZERO_DAYS - RECENCY_FULL_DAYS;
  return 1 - (lastActiveDaysAgo - RECENCY_FULL_DAYS) / span;
}
