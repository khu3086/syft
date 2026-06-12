// OpenAI voice helpers for the Stage 3 "Let's talk" interview:
//   - transcribe(): Whisper speech-to-text for the user's spoken answers
//   - speak():      text-to-speech so Syft reads its questions aloud
//
// Both are no-ops unless OPENAI_API_KEY is set; the client checks voiceConfigured()
// (exposed via GET /api/transcribe) and falls back to the browser's built-in
// SpeechRecognition / SpeechSynthesis when voice isn't configured.

import OpenAI, { toFile } from "openai";
import { VOICE } from "./matching/config";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!VOICE.apiKey) {
    throw new Error("Voice features need OPENAI_API_KEY (set it in .env to enable Whisper + TTS).");
  }
  if (!client) {
    client = new OpenAI({ apiKey: VOICE.apiKey, baseURL: VOICE.baseURL, maxRetries: 2 });
  }
  return client;
}

/** Whether OpenAI voice is available (key present). */
export function voiceConfigured(): boolean {
  return !!VOICE.apiKey;
}

/** Transcribe a recorded audio clip to text via Whisper. */
export async function transcribe(audio: Blob): Promise<string> {
  const openai = getClient();
  const buf = Buffer.from(await audio.arrayBuffer());
  // Name the upload so the API infers the container from the extension.
  const file = await toFile(buf, "answer.webm", { type: audio.type || "audio/webm" });
  const res = await openai.audio.transcriptions.create({
    file,
    model: VOICE.sttModel,
    language: "en",
  });
  return (res.text ?? "").trim();
}

/** The audio container speak() returns, and its HTTP content type. */
export const TTS_FORMAT = VOICE.ttsFormat;
export const TTS_CONTENT_TYPE = VOICE.ttsFormat === "wav" ? "audio/wav" : "audio/mpeg";

/** Synthesize speech for one short line of text; returns the audio bytes.
 *  Input is clipped to the provider's per-request cap (Orpheus ~200 chars) — the
 *  client chunks longer text into sentences and calls this per chunk. */
export async function speak(text: string): Promise<Buffer> {
  const openai = getClient();
  const res = await openai.audio.speech.create({
    model: VOICE.ttsModel,
    voice: VOICE.ttsVoice as "shimmer",
    input: text.slice(0, VOICE.maxInputChars),
    response_format: VOICE.ttsFormat,
    // `speed` is an OpenAI-only knob; Orpheus rejects unknown params.
    ...(VOICE.provider === "openai" ? { speed: 0.95 } : {}),
  });
  return Buffer.from(await res.arrayBuffer());
}
