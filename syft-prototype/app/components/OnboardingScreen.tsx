"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Build your real profile",
    description:
      "Answer a few guided questions and complete short writing and voice prompts. Syft learns how you think, not just what you look like.",
  },
  {
    step: "02",
    title: "Describe who you're looking for",
    description:
      "Type it in your own words — as specific or as open as you want. No filters. No sliding scales. Just say it.",
  },
  {
    step: "03",
    title: "Meet five people who actually fit",
    description:
      "We surface a ranked shortlist with a clear reason for each match. You choose who to connect with.",
  },
];

type AuthView = "preview" | "signup" | "signin";

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [view, setView] = useState<AuthView>("preview");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  // Surface a callback failure passed back as ?auth_error=… (e.g. an email
  // confirmation link that didn't complete) instead of silently dumping the user
  // back on the start screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (!err) return;
    setView("signin");
    setError(
      err === "missing_code"
        ? "That sign-in link didn't complete. Try signing in with your email below."
        : `Sign-in failed: ${decodeURIComponent(err)}. Try your email below.`,
    );
    // Clean the URL so the message doesn't persist on refresh.
    params.delete("auth_error");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  async function handleSignUp() {
    setError(null);
    setNotice(null);
    if (!configured) {
      // No keys yet — let the prototype flow continue so the rest stays demoable.
      onComplete();
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // If the project requires email confirmation, there's no session yet.
      if (data.session) onComplete();
      else {
        setNotice("Check your email to confirm your account, then sign in.");
        setView("signin");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    setError(null);
    setNotice(null);
    if (!configured) {
      onComplete();
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  }


  const Feedback = () => (
    <>
      {!configured && (
        <p
          className="w-full rounded-xl px-4 py-3 mt-1"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}
        >
          Auth isn&apos;t connected yet — add your Supabase keys to enable real sign-in. For now you can continue in
          demo mode.
        </p>
      )}
      {error && (
        <p className="w-full rounded-xl px-4 py-3" style={{ background: "#fbf1ec", color: "#8a3d22", fontSize: "0.8125rem" }}>
          {error}
        </p>
      )}
      {notice && (
        <p className="w-full rounded-xl px-4 py-3" style={{ background: "var(--secondary)", color: "var(--foreground)", fontSize: "0.8125rem" }}>
          {notice}
        </p>
      )}
    </>
  );

  if (view === "preview") {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
        <header className="flex items-center justify-between px-8 py-6">
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.5rem" }} className="text-foreground tracking-tight">
            syft
          </span>
          <button
            onClick={() => setView("signin")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: "0.875rem" }}
          >
            Sign in
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-muted-foreground mb-4 tracking-wide uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.12em" }}>
              A new kind of dating
            </p>
            <h1
              className="text-foreground mb-6 leading-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 6vw, 3.5rem)", fontWeight: 500 }}
            >
              Describe your person.
              <br />
              <span style={{ fontStyle: "italic", color: "var(--accent)" }}>Meet your match.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto" style={{ fontSize: "1.0625rem" }}>
              No swiping. No endless feeds. Just tell Syft who you're looking for, and we'll surface five people who actually fit.
            </p>
          </div>

          <div className="w-full mb-14">
            <p className="text-muted-foreground mb-8 text-center" style={{ fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              How it works
            </p>
            <div className="space-y-6">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="flex gap-6 items-start">
                  <span
                    className="shrink-0 mt-0.5"
                    style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--accent)", fontSize: "0.875rem", minWidth: "2rem" }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="text-foreground mb-1" style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{item.title}</p>
                    <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "0.875rem" }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full space-y-3 max-w-sm mx-auto">
            <button
              onClick={() => setView("signup")}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Get started
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="text-muted-foreground mt-8 text-center" style={{ fontSize: "0.8125rem" }}>
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Terms</span> and{" "}
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
          </p>
        </main>
      </div>
    );
  }

  if (view === "signup") {
    const canSubmit = name.trim() && email.trim() && (configured ? password.length >= 6 : true);
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
        <header className="flex items-center justify-between px-8 py-6">
          <button onClick={() => setView("preview")} className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
            ← Back
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.5rem" }} className="text-foreground">
            syft
          </span>
          <button onClick={() => setView("signin")} className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
            Sign in
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto w-full">
          <h2 className="text-foreground mb-2 text-center" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500 }}>
            Create your account
          </h2>
          <p className="text-muted-foreground mb-10 text-center" style={{ fontSize: "0.9375rem" }}>
            Syft takes about 12 minutes to set up. It's worth it.
          </p>

          <div className="w-full space-y-4">
            <div>
              <label className="block text-foreground mb-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name is fine"
                className="w-full rounded-xl px-4 py-3.5 border outline-none transition-all focus:ring-2"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9375rem" }}
              />
            </div>
            <div>
              <label className="block text-foreground mb-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3.5 border outline-none transition-all focus:ring-2"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9375rem" }}
              />
            </div>
            <div>
              <label className="block text-foreground mb-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl px-4 py-3.5 border outline-none transition-all focus:ring-2"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9375rem" }}
              />
            </div>

            <Feedback />

            <button
              onClick={handleSignUp}
              disabled={!canSubmit || busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              {busy ? "Creating…" : "Continue"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </div>

          <div className="mt-10 space-y-2">
            {["No algorithm decides for you — you always choose", "Your assessment data stays private", "Real identity verification keeps the community safe"].map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
                  <Check size={10} color="white" strokeWidth={3} />
                </span>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{point}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // sign in view
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="flex items-center justify-between px-8 py-6">
        <button onClick={() => setView("preview")} className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
          ← Back
        </button>
        <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.5rem" }} className="text-foreground">
          syft
        </span>
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto w-full">
        <h2 className="text-foreground mb-2 text-center" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500 }}>
          Welcome back
        </h2>
        <p className="text-muted-foreground mb-10 text-center" style={{ fontSize: "0.9375rem" }}>
          Sign in to continue to Syft
        </p>

        <div className="w-full space-y-4">
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-3.5 border outline-none transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9375rem" }}
            />
          </div>
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3.5 border outline-none transition-all"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9375rem" }}
            />
          </div>

          <Feedback />

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p className="text-muted-foreground mt-6 text-center" style={{ fontSize: "0.875rem" }}>
          No account yet?{" "}
          <span className="text-foreground underline cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setView("signup")}>
            Get started
          </span>
        </p>
      </main>
    </div>
  );
}

