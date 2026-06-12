// GET  /api/connections                 -> { remote, connections }
// POST /api/connections { action, profileId, text? } -> { remote, connections }
//
// The connection layer (likes + chat) persisted in Supabase, scoped to the
// signed-in user. When auth/DB isn't available (demo mode or signed out), returns
// { remote: false } so the client falls back to its local (device) store.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasAdmin } from "@/lib/supabase/admin";
import {
  listConnections,
  addLike,
  removeLike,
  addMessage,
  replyToConversation,
} from "@/lib/data/connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured() || !hasAdmin()) return null;
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ remote: false, connections: [] });
  try {
    return NextResponse.json({ remote: true, connections: await listConnections(userId) });
  } catch (e) {
    return NextResponse.json({ remote: false, connections: [], error: String(e) });
  }
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ remote: false });

  let body: { action?: string; profileId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { action, profileId, text } = body;
  if (typeof profileId !== "string") {
    return NextResponse.json({ error: "profileId required." }, { status: 400 });
  }

  try {
    if (action === "like") await addLike(userId, profileId);
    else if (action === "unlike") await removeLike(userId, profileId);
    else if (action === "message") {
      if (typeof text === "string" && text.trim()) {
        await addMessage(userId, profileId, text.trim());
        // Demo profiles answer in character; no-ops for real users.
        await replyToConversation(userId, profileId);
      }
    } else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

    return NextResponse.json({ remote: true, connections: await listConnections(userId) });
  } catch (e) {
    return NextResponse.json({ remote: false, error: String(e) }, { status: 500 });
  }
}
