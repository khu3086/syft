// A real, AI-driven voice conversation for Stage 3 "Let's talk".
//
//   Syft speaks a question  (OpenAI TTS, or browser SpeechSynthesis fallback)
//   → you answer out loud   (recorded, then Whisper STT — or browser SR fallback)
//   → Syft reads the answer and STEERS the next question (/api/interview → LLM)
//
// When OPENAI_API_KEY is configured (GET /api/transcribe → {configured:true}) the
// answers are recorded with MediaRecorder and transcribed by Whisper (/api/transcribe),
// and questions are spoken by OpenAI TTS (/api/speak). With no key it transparently
// falls back to the browser's SpeechRecognition / SpeechSynthesis. Either way there's
// a typed fallback, and the transcript card stays visible as the trust affordance.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, ArrowRight } from "lucide-react";

// ---- Minimal Web Speech API types (non-standard, not in lib.dom) ----
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  0: SRAlternative;
  isFinal: boolean;
}
interface SRResultList {
  length: number;
  [index: number]: SRResult;
}
interface SRResultEvent {
  results: SRResultList;
}
interface SRInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SRResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type SRCtor = new () => SRInstance;

function getSRCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Prefer a calm, natural-sounding voice across platforms. macOS/Safari expose
// "Samantha", "Ava", "Serena"; Chrome adds "Google …"; Edge adds "Microsoft … Natural".
// We fall back to the first English voice, then anything available.
const CALM_VOICE_HINTS = [
  "Ava", "Samantha", "Allison", "Serena", "Zoe", "Nicky", "Karen", "Moira", "Fiona",
  "Google UK English Female", "Google US English",
  "Microsoft Aria", "Microsoft Jenny", "Microsoft Sonia", "Natural",
];

function pickCalmVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  for (const hint of CALM_VOICE_HINTS) {
    const v = voices.find((vo) => vo.name.toLowerCase().includes(hint.toLowerCase()));
    if (v) return v;
  }
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  return en[0] ?? voices[0];
}

interface Turn {
  role: "assistant" | "user";
  text: string;
}
type Phase = "intro" | "speaking" | "listening" | "transcribing" | "awaiting" | "thinking" | "done";

interface VoiceConversationProps {
  /** Called when the conversation finishes (or is skipped), with the user's spoken
   *  answers joined as "voice highlights" for the profile's psycholinguistic read. */
  onDone: (voiceHighlights: string) => void;
  /** Reports how many answers the user has given (drives the parent progress arc). */
  onProgress?: (answers: number) => void;
}

export default function VoiceConversation({ onDone, onProgress }: VoiceConversationProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Whether OpenAI voice (Whisper STT + TTS) is available; resolved on mount.
  const [openaiVoice, setOpenaiVoice] = useState(false);

  const srSupported = useMemo(() => !!getSRCtor(), []);
  const recRef = useRef<SRInstance | null>(null);
  const finalRef = useRef("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // OpenAI-voice machinery.
  const openaiVoiceRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect whether the server can do Whisper + TTS (OPENAI_API_KEY set).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/transcribe")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const on = !!d.configured;
        setOpenaiVoice(on);
        openaiVoiceRef.current = on;
      })
      .catch(() => {
        /* leave fallback on */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the available browser voices and pick a calm one (used only as fallback).
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      voiceRef.current = pickCalmVoice(window.speechSynthesis.getVoices());
    };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  // Report answer count up to the parent (progress arc).
  useEffect(() => {
    onProgress?.(turns.filter((t) => t.role === "user").length);
  }, [turns, onProgress]);

  function stopAudio() {
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
    audioRef.current = null;
  }

  // Browser-synthesis fallback — slightly slower and softer than default.
  function browserSay(text: string, onSpoken: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) {
      onSpoken();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.92;
    u.pitch = 0.96;
    u.onend = () => onSpoken();
    u.onerror = () => onSpoken();
    window.speechSynthesis.speak(u);
  }

  // Speak a line: OpenAI TTS when available, else the browser voice.
  function say(text: string, onSpoken: () => void) {
    if (!text) {
      onSpoken();
      return;
    }
    if (!openaiVoiceRef.current) {
      browserSay(text, onSpoken);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("tts unavailable");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        stopAudio();
        const audio = new Audio(url);
        audioRef.current = audio;
        const finish = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) audioRef.current = null;
          onSpoken();
        };
        audio.onended = finish;
        audio.onerror = finish;
        await audio.play();
      } catch {
        // TTS failed (autoplay block, network, etc.) — fall back to browser voice.
        browserSay(text, onSpoken);
      }
    })();
  }

  // Keep the transcript scrolled to the latest line.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, interim, phase]);

  // Clean up speech, recognition, recording + playback on unmount.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopAudio();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  // Ask the LLM for the next turn given the full history, then speak it.
  async function fetchTurn(history: Turn[]) {
    setPhase("thinking");
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Interview failed.");

      if (data.done) {
        const line: string = data.closing || "Thank you — that gives me a real sense of you.";
        setTurns([...history, { role: "assistant", text: line }]);
        setPhase("speaking");
        say(line, () => setPhase("done"));
      } else {
        const q: string = data.question || "Tell me a little about yourself.";
        setTurns([...history, { role: "assistant", text: q }]);
        setPhase("speaking");
        say(q, () => beginListening());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Interview failed.");
      setPhase("awaiting");
    }
  }

  // Start capturing the answer — Whisper recording when available, else browser SR.
  function beginListening() {
    setError(null);
    if (openaiVoiceRef.current) {
      void beginRecording();
      return;
    }
    beginBrowserSR();
  }

  // --- OpenAI / Whisper path: record audio, transcribe on stop ---
  async function beginRecording() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      beginBrowserSR(); // can't record → try browser SR, else typed fallback
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => void onRecordingStop(mr.mimeType);
      setInterim("");
      setPhase("listening");
      mr.start();
    } catch {
      setPhase("awaiting"); // mic permission denied → typed fallback
    }
  }

  async function onRecordingStop(mimeType: string) {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
    chunksRef.current = [];
    if (!blob.size) {
      setPhase("awaiting");
      return;
    }
    setPhase("transcribing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "answer.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed.");
      const text = (data.text || "").trim();
      if (text) submitAnswer(text);
      else {
        setError("I didn't catch that — try again, or type your answer.");
        setPhase("awaiting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed.");
      setPhase("awaiting");
    }
  }

  // --- Browser SpeechRecognition fallback path ---
  function beginBrowserSR() {
    const Ctor = getSRCtor();
    if (!Ctor) {
      setPhase("awaiting"); // no STT → typed fallback
      return;
    }
    try {
      const rec = new Ctor();
      recRef.current = rec;
      finalRef.current = "";
      setInterim("");
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        let finalText = "";
        let interimText = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        finalRef.current = finalText;
        setInterim((finalText + " " + interimText).trim());
      };
      rec.onerror = () => setPhase("awaiting");
      rec.onend = () => {
        const answer = finalRef.current.trim();
        if (answer) submitAnswer(answer);
        else setPhase("awaiting"); // heard nothing → let them retry or type
      };
      setPhase("listening");
      rec.start();
    } catch {
      setPhase("awaiting");
    }
  }

  function stopListening() {
    if (openaiVoiceRef.current) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* onstop will fire */
      }
      return;
    }
    try {
      recRef.current?.stop();
    } catch {
      /* onend will fire */
    }
  }

  function submitAnswer(text: string) {
    setInterim("");
    const next: Turn[] = [...turns, { role: "user", text }];
    setTurns(next);
    fetchTurn(next);
  }

  function submitTyped() {
    const t = typed.trim();
    if (t.length < 2) return;
    setTyped("");
    submitAnswer(t);
  }

  // The user's spoken answers, joined — fed to the profile's psycholinguistic read.
  function finish() {
    onDone(turns.filter((t) => t.role === "user").map((t) => t.text).join(" "));
  }

  const speaking = phase === "speaking";
  const listening = phase === "listening";
  const orbLive = speaking || listening;
  const micAvailable = openaiVoice || srSupported;

  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant")?.text;
  const questionText =
    phase === "intro" ? "Let’s talk." : lastAssistant || "Let’s begin.";

  const statusText =
    phase === "intro"
      ? "A short, real conversation. Syft asks, you answer out loud."
      : speaking
        ? "Syft is speaking…"
        : listening
          ? "Listening… speak naturally."
          : phase === "transcribing"
            ? "Transcribing your answer…"
            : phase === "thinking"
              ? "Syft is thinking…"
              : phase === "awaiting"
                ? micAvailable
                  ? "Tap the mic to answer, or type below."
                  : "Type your answer below."
                : "That’s everything Syft needs.";

  return (
    <div className="vc">
      <span className="vc-tag">
        <span className={`pip${orbLive ? " live" : ""}`} /> You&apos;re talking with Syft&apos;s assistant
      </span>

      <div className="vc-orb-wrap">
        <div className={`vc-orb${speaking ? " speaking" : ""}${listening ? " listening" : ""}`} />
        <span className={`vc-ring r1${orbLive ? " on" : ""}`} />
        <span className={`vc-ring r2${orbLive ? " on" : ""}`} />
      </div>

      <div className={`vc-eq${listening ? " live" : ""}`} aria-hidden>
        {Array.from({ length: 7 }).map((_, k) => (
          <i key={k} />
        ))}
      </div>

      <h2 className="vc-question">{questionText}</h2>
      <p className="vc-status">{statusText}</p>

      {/* Live transcript — the trust affordance */}
      {(turns.length > 0 || interim) && (
        <div className="vc-transcript" ref={scrollRef} aria-live="polite">
          {turns.map((t, i) => (
            <p key={i} className={t.role === "assistant" ? "q" : "a"}>
              <strong>{t.role === "assistant" ? "Syft" : "You"}:</strong> {t.text}
            </p>
          ))}
          {interim && (
            <p className="a" style={{ opacity: 0.7 }}>
              <strong>You:</strong> {interim}
              <span className="vc-caret" />
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="error" style={{ marginTop: 16, width: "100%", textAlign: "left" }}>
          {error}
        </div>
      )}

      {/* Controls per phase */}
      <div className="vc-actions">
        {phase === "intro" && (
          <>
            <button className="vc-mic" onClick={() => fetchTurn([])} aria-label="Begin the conversation">
              <Mic size={26} />
            </button>
            <span className="vc-hint">Tap to begin</span>
            <button className="vc-link" onClick={finish}>
              Skip the conversation
            </button>
          </>
        )}

        {listening && (
          <>
            <button className="vc-mic stop" onClick={stopListening} aria-label="Done answering">
              <Square size={22} fill="currentColor" />
            </button>
            <span className="vc-hint">Tap when you&apos;re done</span>
          </>
        )}

        {(speaking || phase === "thinking" || phase === "transcribing") && (
          <button className="vc-link" onClick={finish}>
            Skip the conversation
          </button>
        )}

        {phase === "awaiting" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {micAvailable && (
              <>
                <button className="vc-mic" onClick={beginListening} aria-label="Answer by voice">
                  <Mic size={26} />
                </button>
                <span className="vc-hint">Tap to answer, or type below</span>
              </>
            )}
            <textarea
              className="vc-field"
              placeholder="…or type your answer"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitTyped();
              }}
            />
            <button className="vc-pillbtn" onClick={submitTyped} disabled={typed.trim().length < 2}>
              Send <ArrowRight size={15} />
            </button>
          </div>
        )}

        {phase === "done" && (
          <button className="vc-pillbtn" onClick={finish}>
            Finish profile <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
