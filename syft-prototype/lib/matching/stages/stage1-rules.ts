// Stage 1 — Rule-based filtering (PDF §2.1). Near-zero cost: pure predicates,
// no model. Eliminates impossible matches on hard, non-negotiable criteria and
// produces a Rule Fit Score (fraction of applicable filters satisfied).
//
// NOTE: protected characteristics are never filters here — refuse-and-reframe
// stripped them upstream (safety/refuseReframe.ts), so they can't reach Stage 1.

import { RULE_FIT_MIN } from "../config";
import type { EmbeddedProfile, ParsedQuery, RuleFit, Searcher } from "../types";

/** Approx great-circle distance between two lat/lng points, in km. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Evaluate hard filters for one candidate. Each applicable filter is binary. */
export function evaluateRules(
  parsed: ParsedQuery,
  searcher: Searcher,
  candidate: EmbeddedProfile,
): RuleFit {
  const si = parsed.structuredIntent;
  const checks: { name: string; pass: boolean }[] = [];

  // Age range (only if the searcher specified one).
  if (si.desiredAgeMin != null) {
    checks.push({ name: "age >= min", pass: candidate.age >= si.desiredAgeMin });
  }
  if (si.desiredAgeMax != null) {
    checks.push({ name: "age <= max", pass: candidate.age <= si.desiredAgeMax });
  }

  // Commuting distance (only if specified).
  if (si.maxDistanceKm != null) {
    const km = haversineKm(searcher.lat, searcher.lng, candidate.lat, candidate.lng);
    checks.push({ name: "within distance", pass: km <= si.maxDistanceKm });
  }

  // Relationship-intent overlap: the candidate must be open to what the searcher
  // wants (use the parsed intent if present, else the searcher's own intent).
  const wantedIntent = si.relationshipIntent ?? searcher.intent;
  const intentOk =
    candidate.intent === wantedIntent || candidate.openTo.includes(wantedIntent);
  checks.push({ name: "intent overlap", pass: intentOk });

  // Mutual deal-breaker check: if a must-have phrase echoes one of the
  // candidate's stated deal-breakers, that's an impossible match.
  const dealBreakerHit = si.mustHaves.some((m) =>
    candidate.dealBreakers.some((d) => d.toLowerCase().includes(m.toLowerCase())),
  );
  if (si.mustHaves.length > 0) {
    checks.push({ name: "no deal-breaker conflict", pass: !dealBreakerHit });
  }

  // Score = fraction of applicable filters satisfied. With no hard filters at
  // all, every candidate trivially passes (score 1).
  const applicable = checks.length;
  const passed = checks.filter((c) => c.pass).length;
  const score = applicable === 0 ? 1 : passed / applicable;
  const failedFilters = checks.filter((c) => !c.pass).map((c) => c.name);

  return { passed: score >= RULE_FIT_MIN, score, failedFilters };
}
