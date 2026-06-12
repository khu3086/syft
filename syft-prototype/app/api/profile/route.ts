// POST /api/profile  { demographics, voiceHighlights, name? }  ->  { persisted }
// The "embed once" pipeline: maps the logged-in user's intake into a Profile,
// runs Stage-0 (narrative + embedding) ONCE, and stores it in Postgres so the
// person enters the searchable pool. No-ops gracefully (persisted:false) in demo
// mode or when not signed in, so the prototype flow never breaks.

import { NextResponse } from "next/server";
import { embedAndStoreProfile, profileExists } from "@/lib/data/profiles";
import { geocodeCity } from "@/lib/data/geocode";
import { normalizeGenderList, normalizeSeeking } from "@/lib/matching/gender";
import { hasAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, RelationshipIntent } from "@/lib/matching/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/profile -> { signedIn, exists }
// Lets the client route a returning user straight to Search if they've already
// completed onboarding, instead of replaying the intake. Safe in demo mode.
export async function GET() {
  if (!isSupabaseConfigured() || !hasAdmin()) {
    return NextResponse.json({ signedIn: false, exists: false });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ signedIn: false, exists: false });
    return NextResponse.json({ signedIn: true, exists: await profileExists(user.id) });
  } catch {
    return NextResponse.json({ signedIn: false, exists: false });
  }
}

interface Demographics {
  age?: string;
  location?: string;
  gender?: string[];
  open_to?: string[];
  relationship_type?: string;
  distance?: string;
  height?: string;
}

function intentFrom(rt?: string): RelationshipIntent {
  switch (rt) {
    case "Casual connection":
    case "Open relationship":
      return "short-term";
    case "Friendship first":
      return "friendship";
    case "Not sure yet":
      return "unsure";
    case "Something serious":
    default:
      return "long-term";
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !hasAdmin()) {
    return NextResponse.json({ persisted: false, reason: "db-not-configured" });
  }

  // Require a signed-in user.
  let userId: string;
  let userName = "You";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ persisted: false, reason: "not-signed-in" }, { status: 401 });
    userId = user.id;
    userName = (user.user_metadata?.name as string) || user.email?.split("@")[0] || "You";
  } catch {
    return NextResponse.json({ persisted: false, reason: "auth-unavailable" }, { status: 401 });
  }

  let body: { demographics?: Demographics; voiceHighlights?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const d = body.demographics ?? {};
  const intent = intentFrom(d.relationship_type);
  const age = Number(d.age);

  // Compose the structured-assessment prose the narrative step expects.
  const assessment = [
    d.gender?.length ? `Identifies as ${d.gender.join(", ")}.` : "",
    `Looking for ${d.relationship_type ?? "a connection"}.`,
    d.open_to?.length ? `Open to meeting ${d.open_to.join(", ")}.` : "",
    d.distance ? `Willing to travel: ${d.distance}.` : "",
    d.height && d.height !== "Skip" ? `Height: ${d.height}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const city = d.location?.trim() || "Bengaluru, Karnataka";
  const coords = geocodeCity(city); // offline gazetteer → real lat/lng for distance filtering

  const profile: Profile = {
    id: userId,
    name: body.name?.trim() || userName,
    age: Number.isFinite(age) ? age : 30,
    // Structured gender/orientation for the reciprocal Stage-1 gate. Derived from
    // the same onboarding answers that also feed the assessment prose above.
    gender: normalizeGenderList(d.gender),
    seeking: normalizeSeeking(d.open_to),
    city,
    lat: coords.lat,
    lng: coords.lng,
    lastActiveDaysAgo: 0,
    intent,
    openTo: [intent],
    dealBreakers: [],
    rawSignals: {
      assessment: assessment || "New member.",
      promptResponses: [],
      voiceHighlights: body.voiceHighlights?.trim() || "",
    },
  };

  try {
    await embedAndStoreProfile(profile, userId);
    return NextResponse.json({ persisted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save your profile.";
    return NextResponse.json({ persisted: false, error: message }, { status: 500 });
  }
}
