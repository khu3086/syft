// GET  /api/transcribe              -> { configured }   (does the client use Whisper or fall back?)
// POST /api/transcribe  (multipart: audio) -> { text }   (Whisper speech-to-text)

import { NextResponse } from "next/server";
import { transcribe, voiceConfigured } from "@/lib/voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ configured: voiceConfigured() });
}

export async function POST(req: Request) {
  if (!voiceConfigured()) {
    return NextResponse.json({ error: "Transcription not configured.", configured: false }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No audio provided." }, { status: 400 });
    }
    const text = await transcribe(audio);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
