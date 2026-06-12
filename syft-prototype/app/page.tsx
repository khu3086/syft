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
  // While we resolve the session + profile on load, hold rendering so a logged-in
  // user never flashes the onboarding/intake screens.
  const [booting, setBooting] = useState(true);
  // Intake collected across the flow, persisted into the pool at the end.
  const [demographics, setDemographics] = useState<Record<string, string | string[]>>({});
  const [voiceHighlights, setVoiceHighlights] = useState("");

  // Resolve the Supabase session on load: a returning user who already finished
  // onboarding (has a stored profile) jumps straight to Search; one who signed up
  // but didn't finish continues the intake. Reset to onboarding on sign-out.
  // No-ops cleanly (demo mode) until keys are configured.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setBooting(false);
      return;
    }
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        setSignedIn(true);
        try {
          const info = await fetch("/api/profile").then((r) => r.json());
          if (!active) return;
          setStage(info.exists ? "search" : "demographics");
        } catch {
          if (active) setStage("demographics");
        }
      }
      if (active) setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(Boolean(session));
      if (event === "SIGNED_OUT") setStage("onboarding");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
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

  // Hold a calm splash until the session/profile check resolves, so a signed-in
  // user is never shown the onboarding or intake screens by mistake.
  if (booting) {
    return (
      <div
        className="size-full flex items-center justify-center"
        style={{ fontFamily: "var(--font-ui)", background: "transparent" }}
      >
        <span
          aria-label="Loading Syft"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1.75rem",
            color: "var(--muted-foreground)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        >
          Syft
        </span>
      </div>
    );
  }

  return (
    <div className="app-shell size-full overflow-auto" style={{ fontFamily: "var(--font-ui)", background: "transparent" }}>
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
