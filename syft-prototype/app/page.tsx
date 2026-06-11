"use client";

// Stage controller — the Figma "Combine Profile and Intent Module" App.tsx flow:
// onboarding → demographics → profile-intent → identity → search, with a bottom
// dev stage-nav. Onboarding now gates on real Supabase auth; the rest of the flow
// follows once signed in. The profile-intent stage is the live AI voice movement,
// and the final stage is search wired to the matching engine.

import { useEffect, useState } from "react";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { DemographicsAssessment } from "./components/DemographicsAssessment";
import { ProfileIntentModule } from "./components/ProfileIntentModule";
import { IdentityVerification } from "./components/IdentityVerification";
import { MainApp } from "./components/MainApp";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Stage = "onboarding" | "demographics" | "profile-intent" | "identity" | "search";
const STAGE_ORDER: Stage[] = ["onboarding", "demographics", "profile-intent", "identity", "search"];

export default function Home() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [signedIn, setSignedIn] = useState(false);
  // Intake collected across the flow, persisted into the pool at the end.
  const [demographics, setDemographics] = useState<Record<string, string | string[]>>({});
  const [voiceHighlights, setVoiceHighlights] = useState("");

  // Track the Supabase session: skip onboarding for returning users, and reset to
  // onboarding on sign-out. No-ops cleanly until keys are configured.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSignedIn(true);
        setStage((s) => (s === "onboarding" ? "demographics" : s));
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(Boolean(session));
      if (event === "SIGNED_OUT") setStage("onboarding");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function advanceStage() {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx < STAGE_ORDER.length - 1) setStage(STAGE_ORDER[idx + 1]);
  }

  // After identity, run the "embed once" pipeline: persist the user's intake as an
  // embedded profile so they enter the searchable pool. No-ops in demo mode / when
  // not signed in; the flow continues either way.
  async function finishOnboarding() {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demographics, voiceHighlights }),
      });
    } catch {
      /* ignore — never block the flow on persistence */
    }
    advanceStage();
  }

  async function signOut() {
    if (isSupabaseConfigured()) {
      try {
        await createClient().auth.signOut();
      } catch {
        /* ignore */
      }
    }
    setSignedIn(false);
    setStage("onboarding");
  }

  return (
    <div className="app-shell size-full overflow-auto" style={{ fontFamily: "var(--font-ui)", background: "var(--background)" }}>
      {/* Dev stage nav — visible only during development */}
      <nav className="stagenav" aria-label="Stage navigation (dev)">
        {STAGE_ORDER.map((s) => (
          <button key={s} onClick={() => setStage(s)} className={stage === s ? "active" : ""}>
            {s.replace("-", " ")}
          </button>
        ))}
      </nav>

      {/* Sign-out — only once authenticated */}
      {signedIn && (
        <button
          onClick={signOut}
          className="fixed z-50 rounded-full px-3 py-1.5 transition-colors"
          style={{
            top: "max(0.75rem, env(safe-area-inset-top))",
            right: "0.75rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
            fontSize: "0.75rem",
          }}
        >
          Sign out
        </button>
      )}

      {stage === "onboarding" && <OnboardingScreen onComplete={advanceStage} />}
      {stage === "demographics" && (
        <DemographicsAssessment
          onComplete={(answers) => {
            setDemographics(answers);
            advanceStage();
          }}
        />
      )}
      {stage === "profile-intent" && (
        <ProfileIntentModule
          onComplete={(h) => {
            setVoiceHighlights(h);
            advanceStage();
          }}
        />
      )}
      {stage === "identity" && <IdentityVerification onComplete={finishOnboarding} />}
      {stage === "search" && <MainApp />}
    </div>
  );
}
