# CLAUDE.md — Syft

> Guidance for AI coding agents (Claude Code) and human contributors building **Syft**.
> Read this file fully before writing code. It defines what we're building, the rules
> that must never be broken, and the architecture that keeps the product viable.

---

## 1. What Syft is

Syft is a dating app built on one core interaction: **you don't swipe — you describe who
you're looking for in plain English, and you get a ranked shortlist of five people who
actually fit.**

It is positioned as *"the search engine for human connection."* The differentiator is not
the search box (anyone can wrap an LLM around a database) but the **depth of understanding**
Syft builds about each person before they ever search, and the **outcome-learning loop** that
improves matching over time.

**Tagline:** Describe your person. Meet your match.

### The three-layer signal (the moat)
Every user is understood through three combined signals, fused into one profile embedding:
1. **Structured assessment** — demographics, preferences, relationship intent (clean, comparable data).
2. **Psycholinguistic read** — analysis of how the user writes in free-text voice prompts (how they think and express themselves). Rooted in cognitive/behavioral science. Framed as a neuroscience backed approach. A short voice-AI conversation capturing tone, warmth, and nuance that checkboxes miss.

---

## 2. Non-negotiable principles (read before every feature)

These are product law. If a task conflicts with one of these, **stop and flag it** rather than implement it.

1. **Honest about match strength.** Never fabricate five matches when the pool is thin. Show "2 strong matches right now" with confidence-aware states. False confidence destroys trust and retention.
2. **No filtering on protected characteristics.** The system must never rank, filter, or match on race, religion, ethnicity, disability, or other protected traits — even if a user's query requests it. Implement a *refuse-and-reframe* layer (see §6). This is both an ethical line and a legal/brand one.
3. **Transparency as trust.** Users always know what is being assessed and why. No hidden profiling. Assessment results are shown back to the user as a benefit (and retention hook).
4. **Control stays with the user.** Syft surfaces candidates; the human chooses. No black-box auto-matching, no autoplay.
5. **Depth over volume.** Five great options, never an infinite feed. Resist any pattern that recreates the swipe slot-machine.
6. **Authenticity over optimization.** Features that help users present themselves (e.g. the photo shoot) must promote their *best real self*, never a fantasy version that disappoints in person.
7. **Scientific humility.** Claim "improves matching," never "predicts compatibility/chemistry." No pre-meeting data reliably predicts attraction between two specific people; the product and its copy must respect this.

---

## 3. Core architecture: "embed once, rank cheap"

The single most important architectural rule. **Cost must scale with new profiles, not with searches.**

- **At profile creation/update (expensive, once):** run the assessment + psycholinguistic + voice signals, fuse them, and produce a **profile embedding** stored in a vector database. This is the only place heavy LLM/model work happens per user.
- **At search time (cheap, frequent):** an LLM parses the natural-language query into structured intent + weights AND runs the refuse-and-reframe safety check. The parsed query becomes a **query vector**. Ranking is **vector similarity math** against the pool — no per-search LLM re-reading of profiles.
- **LLM at search is reserved for the thin edges only:** (a) query parsing, (b) safety check, (c) a short "why you two fit" explanation generated for the **top 5 results only**.
- **Cache aggressively.** Most queries rhyme; cache parsed-query → weights.

> Rule of thumb: if a feature makes per-search cost scale with database size or query volume in an unbounded way, redesign it.

---

## 4. Language & claims discipline (applies to code, copy, and UI strings)

- Never claim Syft "predicts love," "predicts chemistry," or "guarantees compatibility." Use "matches you more deeply," "understands who you actually are," "improves match quality."
- Any user-facing assessment result is framed as a **reflection/insight**, not a diagnosis or a score of their worth.

---

## 5. The user flow — five stages

Build in this order. Each stage should feel like building *toward* something, with visible progress.

### Stage 1 — Login / Onboarding
- Email / phone / SSO auth.
- Immediately set the calm, anti-swipe tone ("No swiping. Just describe who you're looking for.").
- 3-step "how Syft works" preview before signup so users understand they're investing in a richer profile.

### Stage 2 — Demographics & preferences assessment
- Structured intake: age, location, basics, what they're open to.
- One question per card, visible progress indicator, tappable chips over typing where possible.
- Light and quick in feel despite depth. Produces clean structured data for matching.

### Stage 3 — Profile & intent module (text + voice combined)
- One continuous journey with two movements: **"In your words"** (writing) → **"Let's talk"** (voice), under a single progress arc.
- **Writing:** 1–2 free-text prompts ("Tell us about your perfect Sunday," "Describe a friendship that shaped you"). Feeds the psycholinguistic read. Show a light personality reflection afterward as a reward.
- **Voice:** short conversation with Syft's voice AI. Calm screen, animated waveform/orb, **live transcript visible** for trust, clear "tap to pause," obvious indicator they're talking to Syft's assistant.
- Transparency throughout: user knows both *how they write* and *what they say* help Syft understand them — a benefit, never hidden analysis.

### Stage 4 — Identity & safety layer (Stripe Identity)
- Trust gate before entering the pool, powered by **Stripe Identity**.
- Selfie + government ID capture via Stripe Identity verification.
- **Age verification is a legal bright line** — enforce it hard. Under-18 must never enter the pool.
- Clear consent screens + "your data is yours" privacy explainer of how assessment data is used and protected.
- Design as a mark of a serious, safe community, not a bureaucratic hurdle.

### Stage 5 — The prompt / search platform (the hero experience)
- Single inviting text field: "Describe who you're looking for…" with example/ghost-text prompts.
- On submit: ranked shortlist of **exactly up to five** profiles, each with a short "why you two fit" explanation.
- **Confidence-honest states**: if pool is thin, show fewer with honest framing ("2 strong matches right now").
- Results are rich, calm cards — **not** a swipe deck.

---

## 6. Safety, bias & refuse-and-reframe (critical subsystem)

Ship this *with* launch, not after.

- **Refuse-and-reframe:** when a query attempts to filter on a protected characteristic, the system declines that dimension and explains the stance ("We match on compatibility, not [trait]"), then ranks on everything else. It must not error out or feel broken.
- **Proxy-bias auditing:** "neutral" queries ("successful," "classy") can correlate with protected traits. Periodically audit ranking outputs against demographics to detect skew. Measure carefully and privately under a documented data-governance policy.
- **Safety floor (all required, day one):** hard age verification (Stripe Identity), photo/identity verification, reciprocal-visibility controls (being ranked doesn't expose someone to a stranger they can't block), abuse/harassment reporting wired in.
- A written content/safety policy exists before launch with a named owner.

---

## 7. The outcome-learning loop (the real moat — build hooks early)

Matching must learn from **outcomes**, not stated preferences. Instrument these signals from day one even if the model that uses them comes later:
- Weak: clicks/likes on ranked results.
- Medium: mutual match → conversation initiated.
- Strong: conversation sustained past ~10 messages; optional low-friction "did you meet? / would you see them again?" prompt a week later.
- Treat the typed query as a **prior**, not a hard filter — revealed behavior progressively corrects it.
- Always keep a small **holdout** ranked by a dumber baseline to prove the smart ranking improves *outcomes*, not just looks.

---

## 8. Additional features

### Optional photo shoot (revenue top-up)
- Optional paid professional shoot so users present their best **real** self.
- **Must not** become pay-to-win: unshot profiles must not visibly rank lower. Keep optional in feel as well as fact.
- High-margin, brand-reinforcing when authentic; a trust-killer if it enables fantasy/over-retouched profiles.

### Community events & mixers
- Curated in-person mixers for users with similar goals/demographics → warm, low-pressure first meetings.
- Strategically this is a **cold-start / liquidity tool**: gives early users value before the database is dense, and generates real-world outcome data for the learning loop.
- Treat early-on as a per-launch-network seeding and brand investment, not a profit center. High-touch and margin-thin at first.

---

## 9. Go-to-market constraint (affects engineering priorities)

- **Density gate:** do not enable search in a geography until profile density crosses a threshold (~500 active verified profiles within commuting distance). Below that, show a waitlist with a visible counter ("147 people near you — search unlocks at 500").
- Launch by **saturating one bounded network** (a campus, alumni network, affinity community) to ~70% penetration before opening the next. Engineering should support per-network gating and waitlist mechanics.

---

## 10. Suggested tech stack (adapt as needed; flag deviations)

- **Frontend:** React Native (mobile-first; iOS + Android) or React web for prototype. Calm, spacious design system — see §11.
- **Backend:** Node/TypeScript or Python (FastAPI). REST or tRPC.
- **Vector DB:** pgvector (Postgres extension) for early stage, or a managed vector store (Pinecone/Weaviate) at scale.
- **Primary DB:** Postgres.
- **Embeddings + LLM:** an embedding model for profiles/queries; an LLM for query parsing, safety check, and "why you fit" generation.
- **Voice AI:** a speech-to-text + conversational layer for Stage 3 voice module; keep transcript for transparency.
- **Identity:** Stripe Identity (verification) + Stripe (payments for photo shoot / subscription).
- **Auth:** managed auth (Clerk/Auth0/Supabase Auth).

> Secrets via environment variables only — never hardcode keys. Add per-IP/user rate limiting on all LLM-backed endpoints.

---

## 11. Design language (for any UI work)

- Calm, intelligent, intentional — the opposite of a slot machine. "Thoughtful matchmaker," not "casino."
- Generous whitespace, restrained palette (one warm accent on neutral grounds), confident humanist sans-serif with warmth in display type.
- The feeling is **being understood**, not **being judged**.
- Avoid loud reds, fire emojis, dopamine-game patterns, infinite feeds. Motion smooth and unhurried.
- Reference the `frontend-design` skill for tokens/styling when building components.

---

## 12. Monetization model

- **Subscription** (~$15–20/mo): unlimited search + richer "why you fit" explanations. Free tier gets limited daily searches (this also throttles inference cost).
- **Photo shoot:** optional one-off top-up.
- **Events:** ticketed mixers (seeding/brand early; potential margin later).
- Keep fully-loaded **inference cost per MAU under ~10% of ARPU** — the line where the model stays right-side up. The "embed once, rank cheap" architecture (§3) is what protects this.

---

## 13. What to do when uncertain

- If a requested change conflicts with §2 (principles), §4 (claims), or §6 (safety) — **stop and flag it**, propose an honest alternative.
- If a feature threatens the §3 cost architecture — redesign before implementing.
- Prefer shipping the smallest honest version over a larger version that overclaims.
- When in doubt about scientific/marketing claims, choose the defensible wording.