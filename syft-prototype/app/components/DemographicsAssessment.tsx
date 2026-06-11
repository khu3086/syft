"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Answer = string | string[];

interface DemographicsAssessmentProps {
  onComplete: (answers: Record<string, Answer>) => void;
}

const QUESTIONS = [
  {
    id: "age",
    question: "How old are you?",
    subtitle: "We use this to ensure accurate matching and legal compliance.",
    type: "number",
    placeholder: "Your age",
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
    type: "chips-single",
    options: ["Under 160 cm", "160–170 cm", "170–180 cm", "180–190 cm", "Over 190 cm", "Skip"],
  },
];

export function DemographicsAssessment({ onComplete }: DemographicsAssessmentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const question = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;
  const currentAnswer = answers[question.id];

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

  function canAdvance() {
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
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
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
