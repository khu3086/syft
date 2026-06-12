// The funnel orchestrator. Wires Stage 1 -> Stage 2 -> Stage 3 -> composite, and
// returns a confidence-honest shortlist (up to MAX_RESULTS, never padded) plus
// telemetry proving the cost architecture (CLAUDE.md §3): no per-profile LLM calls
// at search time, and at most TOP_N reasoning calls.

import {
  COMPOSITE_FLOOR,
  MAX_RESULTS,
  TOP_N,
  recencyScore,
} from "./config";
import { composite, labelFor, tensionsFor } from "./compose";
import { parseQuery } from "./providers/llm";
import { applyRefuseReframe } from "./safety/refuseReframe";
import { evaluateRules } from "./stages/stage1-rules";
import { scoreSemantic, topNBySemantic } from "./stages/stage2-semantic";
import { reasonTopN } from "./stages/stage3-reason";
import type {
  EmbeddedProfile,
  HonestFraming,
  MatchResult,
  RuleFit,
  Searcher,
  SearchResult,
  Telemetry,
} from "./types";

function framing(
  poolSize: number,
  passedStage1: number,
  scoredInStage3: number,
  returned: number,
  strong: number,
): HonestFraming {
  // Honest about *strength*, not stingy with *options*: we surface up to five
  // eligible people and tell the truth about how many are strong fits.
  let message: string;
  if (returned === 0) {
    message =
      "No eligible matches near you right now. As more people join, we'll surface them here.";
  } else if (strong === returned) {
    message = `Your top ${returned} ${returned === 1 ? "match" : "matches"}.`;
  } else if (strong === 0) {
    message = `Your ${returned} closest ${returned === 1 ? "match" : "matches"} right now — these are the best fits so far rather than perfect ones.`;
  } else {
    message = `Your top ${returned} matches — ${strong} ${strong === 1 ? "is a strong fit" : "are strong fits"}, the rest are close.`;
  }
  return { poolSize, passedStage1, scoredInStage3, returned, message };
}

/** Run a natural-language search through the full funnel. */
export async function search(
  queryText: string,
  searcher: Searcher,
  pool: EmbeddedProfile[],
): Promise<SearchResult> {
  const telemetry: Telemetry = {
    parseCalls: 0,
    queryEmbedCalls: 0,
    profileEmbedCallsAtSearch: 0, // by construction — profiles embed in Stage 0
    stage1Evaluations: 0,
    stage2Comparisons: 0,
    stage3LlmCalls: 0,
  };

  // --- Parse + refuse-and-reframe (one cheap LLM call) ---
  const parsedRaw = await parseQuery(queryText);
  telemetry.parseCalls += 1;
  const parsed = applyRefuseReframe(parsedRaw);

  // --- Stage 1: rule filter (pure code) ---
  const ruleFits = new Map<string, RuleFit>();
  const survivors: EmbeddedProfile[] = [];
  for (const c of pool) {
    const rf = evaluateRules(parsed, searcher, c);
    telemetry.stage1Evaluations += 1;
    ruleFits.set(c.id, rf);
    if (rf.passed) survivors.push(c);
  }

  // --- Stage 2: semantic similarity (one query embedding + vector math) ---
  const { scores: semantic } = await scoreSemantic(parsed.narrative, survivors);
  telemetry.queryEmbedCalls += 1;
  telemetry.stage2Comparisons += survivors.length;
  const topIds = new Set(topNBySemantic(semantic, TOP_N));
  const topCandidates = survivors.filter((c) => topIds.has(c.id));

  // --- Stage 3: deep reasoning (top-N only) ---
  const reasoned = await reasonTopN(parsed, searcher, topCandidates);
  telemetry.stage3LlmCalls += topCandidates.length;
  const reasonedById = new Map(reasoned.map((r) => [r.profileId, r.assessment]));

  // --- Composite + confidence-honest selection ---
  const scored: MatchResult[] = topCandidates.map((c) => {
    const breakdown = {
      llm: reasonedById.get(c.id)!.score,
      semantic: semantic.get(c.id)!.score,
      ruleFit: ruleFits.get(c.id)!.score,
      recency: recencyScore(c.lastActiveDaysAgo),
    };
    const comp = composite(breakdown);
    return {
      profileId: c.id,
      name: c.name,
      age: c.age,
      city: c.city,
      composite: comp,
      label: labelFor(comp),
      breakdown,
      assessment: reasonedById.get(c.id)!,
      tensions: tensionsFor(breakdown),
    };
  });

  // Return the best available shortlist (up to MAX_RESULTS) — everyone here has
  // already passed the legitimate HARD filters (gender/orientation, age,
  // distance, intent), so these are real, eligible people. We deliberately do NOT
  // hard-drop on an absolute composite cutoff: a long, specific query naturally
  // lowers scores, and hiding decent candidates left users with too few options.
  // Honesty is preserved by the per-card strength label and the summary below,
  // which reports how many are *strong* — never by padding with ineligible people
  // (CLAUDE.md §2.1: be honest about strength, not stingy with options).
  const results = scored
    .sort((a, b) => b.composite - a.composite)
    .slice(0, MAX_RESULTS);
  const strong = results.filter((r) => r.composite >= COMPOSITE_FLOOR).length;

  return {
    query: queryText,
    results,
    refusedDimensions: parsed.refusedDimensions,
    honest: framing(pool.length, survivors.length, topCandidates.length, results.length, strong),
    telemetry,
  };
}
