// POST /api/chat/reply  { profileId, history: [{ from, text }] }  ->  { reply }
//
// Stateless in-character reply for a DEMO seed profile, used by the client's
// local (signed-out / demo) chat store — it has the thread in the browser and
// just needs the next line. Returns { reply: null } for any id that isn't a demo
// profile, so a real user is never voiced (see lib/chat.ts).

import { NextResponse } from "next/server";
import { generateDemoReply, type ChatTurn } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { profileId?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { profileId, history } = body;
  if (typeof profileId !== "string") {
    return NextResponse.json({ error: "profileId required." }, { status: 400 });
  }

  // Sanitize the supplied thread into the {from,text} shape, capped for cost.
  const turns: ChatTurn[] = Array.isArray(history)
    ? history
        .filter(
          (m): m is ChatTurn =>
            !!m &&
            typeof (m as ChatTurn).text === "string" &&
            ((m as ChatTurn).from === "me" || (m as ChatTurn).from === "them"),
        )
        .slice(-12)
        .map((m) => ({ from: m.from, text: m.text.slice(0, 1000) }))
    : [];

  try {
    const reply = await generateDemoReply(profileId, turns);
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reply generation failed.";
    return NextResponse.json({ reply: null, error: message }, { status: 500 });
  }
}
