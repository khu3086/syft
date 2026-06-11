// Refuse-and-reframe backstop (CLAUDE.md §2.2, §6).
//
// The query parser (llm.ts) is the primary line of defence — it strips protected
// characteristics into `refusedDimensions`. This module is a deterministic safety
// net: if a protected term still leaks into mustHaves / niceToHaves / narrative, we
// strip it here too, so the engine can NEVER filter or rank on a protected trait,
// even if the model misses. The search continues on everything else; it never errors.

import type { ParsedQuery, RefusedDimension } from "../types";

interface ProtectedCategory {
  dimension: string;
  stance: string;
  patterns: RegExp[];
}

const PROTECTED: ProtectedCategory[] = [
  {
    dimension: "race or skin colour",
    stance: "We match on compatibility, not race or skin colour.",
    patterns: [
      /\b(white|black|brown|asian|latino|latina|hispanic|caucasian|africans?)\b/i,
      /\bskin colou?r\b/i,
      /\b(race|racial)\b/i,
    ],
  },
  {
    dimension: "ethnicity or nationality",
    stance: "We match on compatibility, not ethnicity or nationality.",
    patterns: [/\bethnic(ity)?\b/i, /\bnationality\b/i, /\b(indian|chinese|arab|jewish)\b/i],
  },
  {
    dimension: "religion",
    stance: "We match on compatibility, not religion.",
    patterns: [
      /\b(christian|muslim|hindu|buddhist|jewish|catholic|sikh|atheist|religious)\b/i,
      /\breligion\b/i,
    ],
  },
  {
    dimension: "caste",
    stance: "We match on compatibility, not caste.",
    patterns: [/\bcaste\b/i, /\bbrahmin\b/i],
  },
  {
    dimension: "disability",
    stance: "We match on compatibility, not disability status.",
    patterns: [/\bdisab(led|ility)\b/i, /\bable[- ]?bodied\b/i],
  },
];

function matches(text: string, cat: ProtectedCategory): boolean {
  return cat.patterns.some((re) => re.test(text));
}

/** Strip any protected term that leaked into the parsed query; merge into refusals.
 *  Scans the filter arrays AND the narrative (which is embedded for matching), so a
 *  protected trait can never influence ranking — even if the model misses it. */
export function applyRefuseReframe(parsed: ParsedQuery): ParsedQuery {
  const refused: RefusedDimension[] = [...parsed.refusedDimensions];
  const seen = new Set(refused.map((r) => r.dimension));

  const flag = (cat: ProtectedCategory) => {
    if (!seen.has(cat.dimension)) {
      refused.push({ dimension: cat.dimension, stance: cat.stance });
      seen.add(cat.dimension);
    }
  };

  // Drop any filter-array item that names a protected trait.
  const stripList = (items: string[]): string[] =>
    items.filter((item) => {
      const hit = PROTECTED.find((cat) => matches(item, cat));
      if (hit) {
        flag(hit);
        return false;
      }
      return true;
    });

  // Redact protected terms from the narrative before it's embedded.
  let narrative = parsed.narrative;
  for (const cat of PROTECTED) {
    if (matches(narrative, cat)) {
      flag(cat);
      for (const re of cat.patterns) {
        narrative = narrative.replace(new RegExp(re.source, "gi"), "");
      }
    }
  }
  narrative = narrative.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();

  return {
    structuredIntent: {
      ...parsed.structuredIntent,
      mustHaves: stripList(parsed.structuredIntent.mustHaves),
      niceToHaves: stripList(parsed.structuredIntent.niceToHaves),
    },
    narrative,
    refusedDimensions: refused,
  };
}
