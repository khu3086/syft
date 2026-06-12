// Normalize the rich onboarding self-ID labels into the three matching buckets
// used by the reciprocal gender gate (Stage 1). This is a matching-only
// collapse — the user's full self-described identity is preserved elsewhere; we
// never rank on it, we only use it to avoid showing people the genders they
// explicitly aren't seeking.

import type { Gender } from "./types";

const ALL: Gender[] = ["man", "woman", "nonbinary"];

/** Map one self-ID label (or normalized value) to a matching bucket. */
export function normalizeGender(label: string | undefined | null): Gender {
  const s = (label ?? "").toLowerCase();
  if (s.includes("woman") || s.includes("women") || s === "f" || s === "female") return "woman";
  if (s.includes("man") || s.includes("men") || s === "m" || s === "male") return "man";
  // Non-binary, genderqueer, prefer-not-to-say, etc. → the inclusive bucket.
  return "nonbinary";
}

/** Map the multi-select gender answer to a single matching bucket (first wins). */
export function normalizeGenderList(labels: string[] | undefined | null): Gender {
  if (!labels || labels.length === 0) return "nonbinary";
  return normalizeGender(labels[0]);
}

/** Map the "who are you open to meeting?" answer to a set of buckets. */
export function normalizeSeeking(labels: string[] | undefined | null): Gender[] {
  if (!labels || labels.length === 0) return [...ALL]; // unspecified → open to everyone
  const out = new Set<Gender>();
  for (const l of labels) {
    const s = l.toLowerCase();
    if (s.includes("everyone") || s.includes("any")) return [...ALL];
    out.add(normalizeGender(l));
  }
  return out.size ? [...out] : [...ALL];
}
