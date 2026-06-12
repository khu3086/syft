// POST /api/speak  { text }  ->  audio/mpeg  (Syft's question, spoken via TTS)
// Returns 503 when voice isn't configured so the client falls back to browser TTS.

import { NextResponse } from "next/server";
import { speak, voiceConfigured } from "@/lib/voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!voiceConfigured()) {
    return NextResponse.json({ error: "TTS not configured." }, { status: 503 });
  }
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text required." }, { status: 400 });
  }
  try {
    const mp3 = await speak(text.trim().slice(0, 800)); // cap length defensively
    return new NextResponse(new Uint8Array(mp3), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speech synthesis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
