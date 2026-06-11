// Composite scoring + interpretation (PDF §3, §4, §5).
// Blends the four signals into one 0..1 score, assigns a label band, and surfaces
// score-tension diagnostics (where individual signals disagree).

import { LABEL_BANDS, WEIGHTS } from "./config";
import type { MatchLabel, SignalBreakdown, Tension } from "./types";

/** Weighted blend of the four signals. */
export function composite(b: SignalBreakdown): number {
  const score =
    b.llm * WEIGHTS.llm +
    b.semantic * WEIGHTS.semantic +
    b.ruleFit * WEIGHTS.ruleFit +
    b.recency * WEIGHTS.recency;
  return Math.max(0, Math.min(1, score));
}

export function labelFor(composite: number): MatchLabel {
  if (composite >= LABEL_BANDS.strong) return "Strong Match";
  if (composite >= LABEL_BANDS.good) return "Good Match";
  if (composite >= LABEL_BANDS.moderate) return "Moderate Match";
  return "Weak Match";
}

/** Diagnose the PDF's §5 score-tension patterns from the signal breakdown. */
export function tensionsFor(b: SignalBreakdown): Tension[] {
  const out: Tension[] = [];
  if (b.llm >= 0.85 && b.semantic <= 0.4) {
    out.push({
      pattern: "High reasoning / low semantic",
      note:
        "Strong fit despite very different self-descriptions — the model found a " +
        "non-obvious connection. Trust the explanation.",
    });
  }
  if (b.llm <= 0.45 && b.semantic >= 0.7) {
    out.push({
      pattern: "Low reasoning / high semantic",
      note:
        "They sound similar on the surface, but a practical blocker was found. " +
        "Similar language doesn't mean a compatible fit.",
    });
  }
  if (b.ruleFit >= 0.9 && b.llm <= 0.5) {
    out.push({
      pattern: "High rule fit / low reasoning",
      note: "All the boxes check out, but deeper reasoning found concerns — read the risks.",
    });
  }
  return out;
}
