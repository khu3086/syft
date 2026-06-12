// Core domain types for the Syft three-stage matching engine.
//
// Entity A = the searcher (their natural-language query + their own profile).
// Entity B = a candidate profile in the pool.
// The funnel: rule filter (Stage 1) -> vector similarity (Stage 2) ->
// LLM deep reasoning on survivors only (Stage 3) -> composite score.

export type RelationshipIntent =
  | "long-term"
  | "short-term"
  | "friendship"
  | "marriage"
  | "unsure";

/**
 * Normalized gender identity used for the reciprocal orientation filter.
 * NOTE: gender/orientation preference is a legitimate dating filter, NOT one of
 * the §2 protected characteristics (race, religion, ethnicity, disability). It is
 * a hard, mutual gate in Stage 1 — never a ranking signal. The richer self-ID
 * labels from onboarding (e.g. "Transgender woman", "Genderqueer") are collapsed
 * to these three buckets for matching only.
 */
export type Gender = "man" | "woman" | "nonbinary";

/** The three raw signals Syft fuses into one profile (CLAUDE.md §1). */
export interface RawSignals {
  /** Structured assessment, summarized as prose for the narrative step. */
  assessment: string;
  /** Free-text voice-prompt answers (feeds the psycholinguistic read). */
  promptResponses: string[];
  /** Highlights from the Stage-3 voice conversation (tone, warmth, nuance). */
  voiceHighlights: string;
}

/** A candidate profile (Entity B). */
export interface Profile {
  id: string;
  name: string;
  age: number;
  /** Optional profile photo URL. Seed/demo profiles have one; real users until
   *  the photo-upload feature exists fall back to an initial avatar. */
  photo?: string;
  /** This person's gender (collapsed to a matching bucket). */
  gender: Gender;
  /** Genders this person is open to being matched with (their orientation). */
  seeking: Gender[];
  city: string;
  /** Approx coordinates for commuting-distance filtering. */
  lat: number;
  lng: number;
  /** How recently the person was active, in days. Drives the recency signal. */
  lastActiveDaysAgo: number;
  /** What this person is looking for. */
  intent: RelationshipIntent;
  /** Intents this person is open to being matched on. */
  openTo: RelationshipIntent[];
  /** Hard "no" signals stated by the person, in plain language. */
  dealBreakers: string[];
  rawSignals: RawSignals;
  /** Stage-0 outputs (computed once, never per-search). */
  narrative?: string;
  embedding?: number[];
}

/** A profile with its Stage-0 narrative + embedding guaranteed present. */
export interface EmbeddedProfile extends Profile {
  narrative: string;
  embedding: number[];
}

/** The searcher (Entity A) — used for reciprocal hard filters + distance. */
export interface Searcher {
  age: number;
  /** The searcher's own gender — candidates must be seeking it (reciprocal). */
  gender: Gender;
  /** Genders the searcher is open to meeting. */
  seeking: Gender[];
  city: string;
  lat: number;
  lng: number;
  /** What the searcher themselves is looking for. */
  intent: RelationshipIntent;
}

/** A refused query dimension (refuse-and-reframe, CLAUDE.md §6). */
export interface RefusedDimension {
  /** The protected characteristic the query tried to filter on. */
  dimension: string;
  /** User-facing stance copy ("We match on compatibility, not …"). */
  stance: string;
}

/** Structured intent extracted from the natural-language query (Stage 2 parse). */
export interface StructuredIntent {
  desiredAgeMin: number | null;
  desiredAgeMax: number | null;
  maxDistanceKm: number | null;
  relationshipIntent: RelationshipIntent | null;
  mustHaves: string[];
  niceToHaves: string[];
}

/** Output of the query parser (Haiku + structured output). */
export interface ParsedQuery {
  structuredIntent: StructuredIntent;
  /** A clean ~1-3 sentence narrative of who the searcher wants — this is embedded. */
  narrative: string;
  refusedDimensions: RefusedDimension[];
}

/** Stage-1 outcome for a single candidate. */
export interface RuleFit {
  passed: boolean;
  /** Fraction of applicable hard criteria satisfied, 0..1. */
  score: number;
  failedFilters: string[];
}

/** Stage-3 structured LLM reasoning output (mirrors the PDF §2.3). */
export interface LlmAssessment {
  score: number; // 0..1
  matchReasons: string[]; // 2..5
  riskFlags: string[]; // 0..3
  explanation: string; // the user-facing "why you two fit"
  nextStep: string;
}

/** Per-signal breakdown that feeds the composite. */
export interface SignalBreakdown {
  llm: number;
  semantic: number;
  ruleFit: number;
  recency: number;
}

export type MatchLabel = "Strong Match" | "Good Match" | "Moderate Match" | "Weak Match";

/** A score-tension diagnostic (PDF §5). */
export interface Tension {
  pattern: string;
  note: string;
}

/** A final ranked match for one candidate. */
export interface MatchResult {
  profileId: string;
  name: string;
  age: number;
  photo?: string;
  city: string;
  composite: number; // 0..1
  label: MatchLabel;
  breakdown: SignalBreakdown;
  assessment: LlmAssessment;
  tensions: Tension[];
}

/** Honest framing about how many real matches exist (CLAUDE.md §2.1). */
export interface HonestFraming {
  poolSize: number;
  passedStage1: number;
  scoredInStage3: number;
  returned: number;
  /** e.g. "2 strong matches right now". */
  message: string;
}

/** Telemetry proving the cost architecture (CLAUDE.md §3). */
export interface Telemetry {
  parseCalls: number; // Claude calls to parse the query
  queryEmbedCalls: number; // Voyage calls to embed the query
  profileEmbedCallsAtSearch: number; // MUST be 0 — profiles embed once, offline
  stage1Evaluations: number; // pure code, no model
  stage2Comparisons: number; // pure vector math, no model
  stage3LlmCalls: number; // <= topN, never one-per-pool
}

/** Full result of a search through the funnel. */
export interface SearchResult {
  query: string;
  results: MatchResult[];
  refusedDimensions: RefusedDimension[];
  honest: HonestFraming;
  telemetry: Telemetry;
}
