// Profile repository — the data layer behind the matching engine.
//
//  Read path:  loadEmbeddedPoolFromDb() returns the searchable pool (embedded
//              profiles) from Postgres; getSearcherForUser() derives the Searcher
//              (Entity A) from the logged-in user's stored row.
//  Write path: storeEmbeddedProfile() inserts an already-embedded profile (used by
//              the seed script); embedAndStoreProfile() runs Stage-0 once
//              (narrative + embedding) and stores it (used at signup).
//
// All DB access goes through the service-role admin client, so the raw pool is
// never exposed to clients (clients only ever receive ranked MatchResults).

import type {
  EmbeddedProfile,
  Profile,
  RelationshipIntent,
  Searcher,
} from "@/lib/matching/types";
import { normalizeGender, normalizeSeeking } from "@/lib/matching/gender";
import { buildProfileEmbedding } from "@/lib/matching/narrative";
import { createAdminClient, hasAdmin } from "@/lib/supabase/admin";

interface ProfileRow {
  id: string;
  user_id: string | null;
  name: string;
  age: number;
  gender: string | null;
  seeking: string[] | null;
  city: string;
  lat: number;
  lng: number;
  last_active_days_ago: number;
  intent: string;
  open_to: string[];
  deal_breakers: string[];
  raw_signals: Profile["rawSignals"];
  narrative: string | null;
  embedding: number[] | string | null;
}

// pgvector returns the embedding as a JSON-ish string over PostgREST; accept both.
function parseEmbedding(e: ProfileRow["embedding"]): number[] {
  if (Array.isArray(e)) return e;
  if (typeof e === "string") {
    try {
      return JSON.parse(e);
    } catch {
      return [];
    }
  }
  return [];
}

function rowToEmbedded(r: ProfileRow): EmbeddedProfile | null {
  const embedding = parseEmbedding(r.embedding);
  if (!r.narrative || embedding.length === 0) return null;
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    // Tolerate legacy rows seeded before gender existed: an absent gender →
    // "nonbinary", absent seeking → open to everyone, so they still surface
    // rather than silently dropping out of every search.
    gender: normalizeGender(r.gender),
    seeking: normalizeSeeking(r.seeking),
    city: r.city,
    lat: r.lat,
    lng: r.lng,
    lastActiveDaysAgo: r.last_active_days_ago,
    intent: r.intent as RelationshipIntent,
    openTo: (r.open_to ?? []) as RelationshipIntent[],
    dealBreakers: r.deal_breakers ?? [],
    rawSignals: r.raw_signals,
    narrative: r.narrative,
    embedding,
  };
}

/** Count of searchable (embedded, in-pool) profiles, or null when no DB. */
export async function countPool(): Promise<number | null> {
  if (!hasAdmin()) return null;
  const sb = createAdminClient();
  const { count, error } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("in_pool", true)
    .not("embedding", "is", null);
  if (error) return null;
  return count ?? 0;
}

/**
 * Vector-recall via the pgvector RPC (HNSW index): returns the ids of the top-k
 * profiles by cosine similarity to the query embedding, excluding the viewer.
 * This is the "rank cheap in the DB" path used once the pool is large.
 */
export async function matchProfileIds(
  queryEmbedding: number[],
  k: number,
  excludeUserId: string | null,
): Promise<string[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.rpc("match_profiles", {
    // pgvector accepts a '[..]' literal — most robust across PostgREST.
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: k,
    exclude_user: excludeUserId,
  });
  if (error) throw new Error(`match_profiles failed: ${error.message}`);
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

/** Fetch the full embedded rows for a set of ids (the RPC candidate set). */
export async function fetchEmbeddedProfilesByIds(ids: string[]): Promise<EmbeddedProfile[]> {
  if (ids.length === 0) return [];
  const sb = createAdminClient();
  const { data, error } = await sb.from("profiles").select("*").in("id", ids);
  if (error) throw new Error(`Candidate fetch failed: ${error.message}`);
  return (data as ProfileRow[]).map(rowToEmbedded).filter(Boolean) as EmbeddedProfile[];
}

/** The searchable pool from Postgres, or null when the DB isn't configured. */
export async function loadEmbeddedPoolFromDb(): Promise<EmbeddedProfile[] | null> {
  if (!hasAdmin()) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("in_pool", true)
    .not("embedding", "is", null);
  if (error) throw new Error(`DB pool load failed: ${error.message}`);
  return (data as ProfileRow[]).map(rowToEmbedded).filter(Boolean) as EmbeddedProfile[];
}

/** Whether this user already has a stored profile (i.e. finished onboarding). */
export async function profileExists(userId: string): Promise<boolean> {
  if (!hasAdmin()) return false;
  const sb = createAdminClient();
  const { count, error } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return false;
  return (count ?? 0) > 0;
}

/** Derive the Searcher (Entity A) from a user's stored profile, or null. */
export async function getSearcherForUser(userId: string): Promise<Searcher | null> {
  if (!hasAdmin()) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("profiles")
    .select("age, gender, seeking, city, lat, lng, intent")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    age: data.age,
    gender: normalizeGender(data.gender),
    seeking: normalizeSeeking(data.seeking),
    city: data.city,
    lat: data.lat,
    lng: data.lng,
    intent: data.intent as RelationshipIntent,
  };
}

function toRow(profile: Profile, embedded: EmbeddedProfile, userId: string | null) {
  return {
    id: profile.id,
    user_id: userId,
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    seeking: profile.seeking,
    city: profile.city,
    lat: profile.lat,
    lng: profile.lng,
    last_active_days_ago: profile.lastActiveDaysAgo,
    intent: profile.intent,
    open_to: profile.openTo,
    deal_breakers: profile.dealBreakers,
    raw_signals: profile.rawSignals,
    narrative: embedded.narrative,
    // Store as a pgvector literal string — robust across PostgREST.
    embedding: JSON.stringify(embedded.embedding),
    in_pool: true,
    updated_at: new Date().toISOString(),
  };
}

/** Insert/replace an already-embedded profile (seed path — no recompute). */
export async function storeEmbeddedProfile(
  embedded: EmbeddedProfile,
  userId: string | null,
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("profiles")
    .upsert(toRow(embedded, embedded, userId), { onConflict: "id" });
  if (error) throw new Error(`Profile upsert failed (${embedded.id}): ${error.message}`);
}

/** Stage-0 "embed once" then store — the real signup pipeline. */
export async function embedAndStoreProfile(profile: Profile, userId: string): Promise<void> {
  const embedded = await buildProfileEmbedding(profile);
  const sb = createAdminClient();
  const { error } = await sb
    .from("profiles")
    .upsert(toRow(profile, embedded, userId), { onConflict: "id" });
  if (error) throw new Error(`Profile upsert failed (${profile.id}): ${error.message}`);
}
