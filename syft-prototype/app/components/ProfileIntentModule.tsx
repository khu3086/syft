"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import VoiceConversation from "./VoiceConversation";

interface ProfileIntentModuleProps {
  onComplete: (voiceHighlights: string) => void;
}

// Stage 3 is a voice-first conversation: Syft asks, you answer out loud, and it
// steers from your answers. The interview wraps after ~6 answers, so we drive the
// progress arc from the running answer count.
const MAX_ANSWERS = 6;

export function ProfileIntentModule({ onComplete }: ProfileIntentModuleProps) {
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState(0);
  const [highlights, setHighlights] = useState("");

  const progress = done ? 100 : Math.min((answers / MAX_ANSWERS) * 100, 92);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="px-8 py-6">
        <div className="flex items-center justify-between mb-1">
          <span
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.25rem" }}
            className="text-foreground"
          >
            syft
          </span>
          <span
            className="rounded-full px-3 py-1 inline-flex items-center gap-2"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)", fontSize: "0.75rem" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor", opacity: 0.9 }} />
            Let&apos;s talk
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden mt-5" style={{ height: "2px", background: "var(--muted)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-xl mx-auto w-full">
        {done ? (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ background: "var(--secondary)" }}
            >
              <Check size={32} color="var(--accent)" strokeWidth={2.5} />
            </div>
            <h2
              className="text-foreground mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500 }}
            >
              That was wonderful.
            </h2>
            <p
              className="text-muted-foreground mb-10 leading-relaxed"
              style={{ fontSize: "0.9375rem", maxWidth: "320px", margin: "0 auto 2.5rem" }}
            >
              Syft now has a real understanding of who you are. One last step: verifying your identity so we can keep
              this a safe community.
            </p>
            <button
              onClick={() => onComplete(highlights)}
              className="flex items-center gap-2 rounded-xl px-8 py-4 transition-all hover:opacity-90 active:scale-95 mx-auto"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Continue to verification
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <VoiceConversation
            onDone={(h) => {
              setHighlights(h);
              setDone(true);
            }}
            onProgress={setAnswers}
          />
        )}
      </main>
    </div>
  );
}
