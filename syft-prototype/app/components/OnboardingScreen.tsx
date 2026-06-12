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

  // Surface an OAuth/callback failure passed back as ?auth_error=… so a failed
  // Google sign-in doesn't silently dump the user back on the start screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (!err) return;
    setView("signin");
    setError(
      err === "missing_code"
        ? "Google sign-in didn't complete. Try again, or use your email below."
        : `Google sign-in failed: ${decodeURIComponent(err)}. You can use your email below.`,
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

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    if (!configured) {
      onComplete();
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Redirects away to Google; nothing else to do here.
    } catch (e) {
      // Fallback: Google OAuth isn't enabled on the Supabase project (or another
      // provider/setup issue). Don't dead-end on a cryptic error — steer the user
      // to email sign-up, which always works, with a friendly explanation.
      const msg = e instanceof Error ? e.message : String(e);
      const providerUnavailable =
        /provider is not enabled|unsupported provider|validation_failed|not enabled/i.test(msg);
      setBusy(false);
      if (providerUnavailable) {
        setNotice("Google sign-in isn't set up yet — continue with your email below.");
      } else {
        setError("Google sign-in didn't work just now. Use your email instead.");
      }
      // Make sure the user lands on a view that has the email form + feedback.
      if (view === "preview") setView("signup");
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
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-4 border transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: "var(--border)", fontSize: "0.9375rem", color: "var(--foreground)" }}
            >
              <GoogleIcon />
              Continue with Google
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

            <div className="relative flex items-center py-2">
              <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
              <span className="mx-4 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>or</span>
              <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
            </div>

            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-4 border transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: "var(--border)", fontSize: "0.9375rem", color: "var(--foreground)", background: "var(--card)" }}
            >
              <GoogleIcon />
              Continue with Google
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

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-4 border transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
            style={{ borderColor: "var(--border)", fontSize: "0.9375rem", color: "var(--foreground)", background: "var(--card)" }}
          >
            <GoogleIcon />
            Continue with Google
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
