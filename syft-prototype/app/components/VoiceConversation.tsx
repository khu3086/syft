// A real, AI-driven voice conversation for Stage 3 "Let's talk".
//
//   Syft speaks a question  (browser SpeechSynthesis / TTS)
//   → you answer out loud   (browser SpeechRecognition / STT, live transcript)
//   → Syft reads the answer and STEERS the next question (/api/interview → LLM)
//
// Calm, voice-first design: a breathing terracotta orb that pulses when Syft
// speaks and glows when listening, the current question in large serif, and a
// live transcript card (the trust affordance — you always see what's captured).
// All free / in-browser: no paid voice service. Graceful fallbacks: if the
// browser has no SpeechRecognition (e.g. Firefox), you can type; if there's no
// SpeechSynthesis, the question is shown but not spoken.

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
type Phase = "intro" | "speaking" | "listening" | "awaiting" | "thinking" | "done";

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

  const srSupported = useMemo(() => !!getSRCtor(), []);
  const recRef = useRef<SRInstance | null>(null);
  const finalRef = useRef("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load the available voices and pick a calm one (voices populate async).
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

  // Speak a line in the calm voice — slightly slower and softer than default.
  const say = (text: string, onSpoken: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) {
      onSpoken();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.92; // a touch slower — unhurried
    u.pitch = 0.96; // slightly softer
    u.onend = () => onSpoken();
    u.onerror = () => onSpoken();
    window.speechSynthesis.speak(u);
  };

  // Keep the transcript scrolled to the latest line.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, interim, phase]);

  // Clean up speech + recognition on unmount.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
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

  function beginListening() {
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
          : phase === "thinking"
            ? "Syft is thinking…"
            : phase === "awaiting"
              ? srSupported
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

        {(speaking || phase === "thinking") && (
          <button className="vc-link" onClick={finish}>
            Skip the conversation
          </button>
        )}

        {phase === "awaiting" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {srSupported && (
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
