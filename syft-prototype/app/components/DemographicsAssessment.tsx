"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Answer = string | string[];

/** Human label for a slider value (e.g. age "27", height "175 cm · 5'9\""). */
function sliderLabel(id: string, v: number): string {
  if (id === "height") {
    const totalIn = Math.round(v / 2.54);
    const ft = Math.floor(totalIn / 12);
    const inch = totalIn % 12;
    return `${v} cm · ${ft}'${inch}"`;
  }
  return `${v}`;
}

interface DemographicsAssessmentProps {
  onComplete: (answers: Record<string, Answer>) => void;
}

interface Question {
  id: string;
  question: string;
  subtitle: string;
  type: "slider" | "range" | "text" | "number" | "chips-single" | "chips-multi";
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  /** Default [low, high] for a range question. */
  defaultRange?: [number, number];
  suffix?: string;
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: "age",
    question: "How old are you?",
    subtitle: "We use this to ensure accurate matching and legal compliance.",
    type: "slider",
    min: 18,
    max: 80,
    step: 1,
    default: 28,
    suffix: "years",
  },
  {
    id: "location",
    question: "Where are you based?",
    subtitle: "We'll prioritize people in your area, but you can always adjust range.",
    type: "text",
    placeholder: "City, State",
  },
  {
    id: "gender",
    question: "How do you identify?",
    subtitle: "Choose as many as feel right.",
    type: "chips-multi",
    options: ["Man", "Woman", "Non-binary", "Transgender man", "Transgender woman", "Genderqueer", "Prefer not to say"],
  },
  {
    id: "open_to",
    question: "Who are you open to meeting?",
    subtitle: "You can always update this later.",
    type: "chips-multi",
    options: ["Men", "Women", "Non-binary people", "Everyone"],
  },
  {
    id: "age_range",
    question: "What age range are you interested in?",
    subtitle: "Drag the ends to set the range. We treat it as a strong preference.",
    type: "range",
    min: 18,
    max: 80,
    step: 1,
    defaultRange: [25, 40],
  },
  {
    id: "relationship_type",
    question: "What are you looking for?",
    subtitle: "Be honest — this helps us find people who want the same thing.",
    type: "chips-single",
    options: ["Something serious", "Casual connection", "Not sure yet", "Open relationship", "Friendship first"],
  },
  {
    id: "distance",
    question: "How far are you willing to travel to meet someone?",
    subtitle: "We'll use this as a soft filter.",
    type: "chips-single",
    options: ["Under 5 km", "Under 15 km", "Under 30 km", "Anywhere"],
  },
  {
    id: "height",
    question: "How tall are you?",
    subtitle: "Optional — but some people care about this.",
    type: "slider",
    min: 140,
    max: 210,
    step: 1,
    default: 170,
    suffix: "",
    optional: true,
  },
];

export function DemographicsAssessment({ onComplete }: DemographicsAssessmentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const question = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;
  const currentAnswer = answers[question.id];

  // A slider/range always has a value — commit its default the moment it's shown
  // so the answer reflects what's on screen (and "Next" is enabled) without a nudge.
  useEffect(() => {
    if (answers[question.id] !== undefined) return;
    if (question.type === "slider") {
      setAnswers((prev) => ({ ...prev, [question.id]: String(question.default ?? question.min ?? 0) }));
    } else if (question.type === "range") {
      const [lo, hi] = question.defaultRange ?? [question.min ?? 18, question.max ?? 80];
      setAnswers((prev) => ({ ...prev, [question.id]: `${lo}-${hi}` }));
    }
  }, [question.id, question.type, question.default, question.min, question.defaultRange, answers]);

  function handleChipSingle(option: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  }

  function handleChipMulti(option: string) {
    const current = (answers[question.id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setAnswers((prev) => ({ ...prev, [question.id]: updated }));
  }

  function handleTextChange(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function setSlider(value: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: String(value) }));
  }

  function parseRange(): [number, number] {
    const [dlo, dhi] = question.defaultRange ?? [question.min ?? 18, question.max ?? 80];
    if (typeof currentAnswer === "string" && currentAnswer.includes("-")) {
      const [lo, hi] = currentAnswer.split("-").map(Number);
      if (Number.isFinite(lo) && Number.isFinite(hi)) return [lo, hi];
    }
    return [dlo, dhi];
  }

  function setRange(lo: number, hi: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: `${lo}-${hi}` }));
  }

  function toggleSkip() {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: prev[question.id] === "Skip" ? String(question.default ?? question.min ?? 0) : "Skip",
    }));
  }

  function canAdvance() {
    // Sliders/ranges are always valid — they carry a value (or an explicit "Skip").
    if (question.type === "slider" || question.type === "range") return true;
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    return String(currentAnswer).trim().length > 0;
  }

  function next() {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(answers);
    }
  }

  function back() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.25rem" }} className="text-foreground">
            syft
          </span>
          <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            {currentIndex + 1} of {QUESTIONS.length}
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: "2px", background: "var(--muted)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-8 max-w-xl mx-auto w-full">
        <div key={question.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            About you
          </p>
          <h2
            className="text-foreground mb-2"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 500, lineHeight: 1.3 }}
          >
            {question.question}
          </h2>
          <p className="text-muted-foreground mb-10" style={{ fontSize: "0.9375rem" }}>
            {question.subtitle}
          </p>

          {question.type === "slider" && (() => {
            const skipped = currentAnswer === "Skip";
            const value =
              !skipped && currentAnswer != null && currentAnswer !== ""
                ? Number(currentAnswer)
                : question.default ?? question.min ?? 0;
            return (
              <div>
                <div className="flex items-baseline gap-2 mb-5">
                  <span
                    className="text-foreground"
                    style={{ fontFamily: "var(--font-display)", fontSize: "2.75rem", fontWeight: 500, lineHeight: 1 }}
                  >
                    {skipped ? "—" : sliderLabel(question.id, value)}
                  </span>
                  {!skipped && question.suffix && (
                    <span className="text-muted-foreground" style={{ fontSize: "1rem" }}>{question.suffix}</span>
                  )}
                </div>
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  step={question.step}
                  value={value}
                  disabled={skipped}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--accent)", opacity: skipped ? 0.4 : 1, cursor: "pointer" }}
                />
                <div className="flex justify-between mt-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  <span>{sliderLabel(question.id, question.min ?? 0)}</span>
                  <span>{sliderLabel(question.id, question.max ?? 0)}{question.id === "age" ? "+" : ""}</span>
                </div>
                {question.optional && (
                  <button
                    onClick={toggleSkip}
                    className="mt-6 rounded-full px-4 py-2 border transition-all active:scale-95"
                    style={{
                      background: skipped ? "var(--foreground)" : "var(--card)",
                      borderColor: skipped ? "var(--foreground)" : "var(--border)",
                      color: skipped ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    Prefer not to say
                  </button>
                )}
              </div>
            );
          })()}

          {question.type === "range" && (() => {
            const min = question.min ?? 18;
            const max = question.max ?? 80;
            const [lo, hi] = parseRange();
            const pct = (v: number) => ((v - min) / (max - min)) * 100;
            return (
              <div>
                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-foreground" style={{ fontFamily: "var(--font-display)", fontSize: "2.75rem", fontWeight: 500, lineHeight: 1 }}>
                    {lo}–{hi}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "1rem" }}>years</span>
                </div>
                <div className="dual-range">
                  <div className="track" />
                  <div className="fill" style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
                  <input
                    type="range" min={min} max={max} step={question.step} value={lo}
                    onChange={(e) => setRange(Math.min(Number(e.target.value), hi), hi)}
                    aria-label="Minimum age"
                  />
                  <input
                    type="range" min={min} max={max} step={question.step} value={hi}
                    onChange={(e) => setRange(lo, Math.max(Number(e.target.value), lo))}
                    aria-label="Maximum age"
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  <span>{min}</span>
                  <span>{max}+</span>
                </div>
              </div>
            );
          })()}

          {(question.type === "text" || question.type === "number") && (
            <input
              type={question.type === "number" ? "number" : "text"}
              value={(currentAnswer as string) || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={question.placeholder}
              className="w-full rounded-xl px-5 py-4 border outline-none transition-all focus:ring-2"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "1.0625rem" }}
              autoFocus
            />
          )}

          {question.type === "chips-single" && (
            <div className="flex flex-wrap gap-2.5">
              {question.options!.map((option) => {
                const selected = currentAnswer === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleChipSingle(option)}
                    className="rounded-full px-5 py-2.5 border transition-all hover:border-foreground active:scale-95"
                    style={{
                      background: selected ? "var(--foreground)" : "var(--card)",
                      borderColor: selected ? "var(--foreground)" : "var(--border)",
                      color: selected ? "var(--primary-foreground)" : "var(--foreground)",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "chips-multi" && (
            <div className="flex flex-wrap gap-2.5">
              {question.options!.map((option) => {
                const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleChipMulti(option)}
                    className="rounded-full px-5 py-2.5 border transition-all hover:border-foreground active:scale-95"
                    style={{
                      background: selected ? "var(--foreground)" : "var(--card)",
                      borderColor: selected ? "var(--foreground)" : "var(--border)",
                      color: selected ? "var(--primary-foreground)" : "var(--foreground)",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 pb-10 flex items-center justify-between max-w-xl mx-auto w-full">
        <button
          onClick={back}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
          style={{ fontSize: "0.9375rem", visibility: currentIndex === 0 ? "hidden" : "visible" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={next}
          disabled={!canAdvance()}
          className="flex items-center gap-2 rounded-xl px-7 py-3.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
        >
          {currentIndex < QUESTIONS.length - 1 ? "Next" : "Continue"}
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
}
