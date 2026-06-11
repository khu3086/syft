# Syft — Semantic Matching Engine (prototype)

A working prototype of the **three-stage matching funnel** (rule filter → semantic
vector similarity → LLM deep reasoning → composite score), adapted to Syft's
"describe your person" search and driven from a calm web UI.

- **Entity A** = the searcher's plain-English query + their profile.
- **Entity B** = candidate profiles in the seeded pool.
- **Output** = a confidence-honest shortlist of **up to 5** with a "why you two fit"
  explanation for each.

It honors Syft's `CLAUDE.md` rules: *embed once, rank cheap* (§3), *refuse-and-reframe*
on protected characteristics (§6), *confidence-honest* results (§2/§5), and *claims
discipline* (§4 — "improves match quality," never "predicts chemistry").

## The funnel

| Stage | What | Cost | Where |
|---|---|---|---|
| 0 | Narrative + embedding per profile (run once, offline) | 1 fast-LLM call + 1 local embed/profile | `scripts/embedSeed.ts` |
| 1 | Rule-based hard filters → Rule Fit | ~0 (pure code) | `lib/matching/stages/stage1-rules.ts` |
| 2 | Query parse + cosine similarity → top-N | 1 fast-LLM call + 1 local query embed | `lib/matching/stages/stage2-semantic.ts` |
| 3 | LLM deep reasoning on top-N only | ≤ N reasoning-LLM calls | `lib/matching/stages/stage3-reason.ts` |
| — | Composite blend + label + tensions | ~0 | `lib/matching/compose.ts` |

**Models (open-source / free):** embeddings run **locally** with Transformers.js
(`all-MiniLM-L6-v2`, no key). The LLM is any **OpenAI-compatible** server — defaults to
**Groq's free tier** (open Llama models); switch to **Ollama** (local, no key),
OpenRouter, or LM Studio via env. See `.env.example`.

Telemetry on every search proves the cost shape: `profileEmbedCallsAtSearch` is always
0, and `stage3LlmCalls ≤ TOP_N` — never one-per-pool.

## Run it

```bash
cd syft-prototype
pnpm install
cp .env.example .env        # add a free Groq key (or point at local Ollama) — see the file
pnpm embed:seed             # Stage 0: writes data/embeddings.json (run once)
pnpm dev                    # open http://localhost:3000
```

Embeddings need no key (they run locally; the model downloads once on first use).
Only the LLM backend needs configuring — the default is Groq's free tier.

Type a query into the prompt box (or tap an example) and you'll get the ranked cards.

**Headless funnel check** (no browser):

```bash
pnpm embed:seed "warm, curious person who loves the outdoors and quiet weekends"
```

Try a refuse-and-reframe case — e.g. a query that filters on religion or race — and
note the dimension is declined with stance copy while the rest of the search still ranks.

## Tuning

All knobs live in `lib/matching/config.ts`: composite `WEIGHTS`, `TOP_N`,
`COMPOSITE_FLOOR`, `MAX_RESULTS`, label bands, and the `LLM` / `EMBEDDING_MODEL` backend
(all env-overridable). Stage 2 uses the fast model; Stage 3 uses the reasoning model.

## Notes
- **Embeddings = local Transformers.js** (`all-MiniLM-L6-v2`, 384-dim): open-source, no
  key, no per-call cost. The model downloads from the Hugging Face hub once and is cached.
- **LLM = any OpenAI-compatible server.** Default Groq free tier; Ollama / OpenRouter /
  LM Studio / Together work by setting `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`.
- Vectors are compared **in memory** over the seed pool. Production swaps this for
  **pgvector** behind the same `lib/matching/providers/embeddings.ts` interface — no
  change to the funnel.
- Styling is plain CSS (design tokens in `app/globals.css`) rather than Tailwind, to keep
  the prototype's build lean; the §11 design language is unchanged.
