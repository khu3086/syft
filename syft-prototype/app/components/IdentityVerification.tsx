"use client";

import { useState } from "react";
import { ArrowRight, Shield, Camera, CreditCard, Check, Lock } from "lucide-react";

interface IdentityVerificationProps {
  onComplete: () => void;
}

type Step = "intro" | "consent" | "id-capture" | "selfie" | "processing" | "complete";

const STEPS_META = [
  { id: "consent", label: "Consent" },
  { id: "id-capture", label: "Government ID" },
  { id: "selfie", label: "Selfie" },
  { id: "complete", label: "Verified" },
];

export function IdentityVerification({ onComplete }: IdentityVerificationProps) {
  const [step, setStep] = useState<Step>("intro");
  const [consentChecked, setConsentChecked] = useState(false);
  const [idCaptured, setIdCaptured] = useState(false);
  const [selfieCaptured, setSelfieCaptured] = useState(false);

  const stepIndex = STEPS_META.findIndex((s) => s.id === step);

  if (step === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ fontFamily: "var(--font-ui)" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "var(--secondary)" }}>
            <Shield size={26} color="var(--accent)" />
          </div>

          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Identity & safety
          </p>
          <h2 className="text-foreground mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.625rem, 4vw, 2.125rem)", fontWeight: 500, lineHeight: 1.3 }}>
            Syft is a verified community
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
            Every person on Syft has confirmed who they are. It takes two minutes, it's powered by Stripe Identity, and it's what makes real connection possible.
          </p>

          <div className="space-y-4 mb-10 text-left">
            {[
              { icon: CreditCard, title: "Age verification", desc: "Confirms you're 18+ — a legal requirement, not a preference." },
              { icon: Shield, title: "Identity verification", desc: "Cuts catfishing at the root. Everyone you see is a real person." },
              { icon: Lock, title: "Your data stays yours", desc: "Verification data is handled by Stripe and deleted after confirmation. Syft never stores your ID." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--secondary)" }}>
                  <Icon size={16} color="var(--accent)" />
                </div>
                <div>
                  <p className="text-foreground mb-0.5" style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{title}</p>
                  <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "0.875rem" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("consent")}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
          >
            Begin verification
            <ArrowRight size={16} />
          </button>

          <p className="text-muted-foreground mt-4" style={{ fontSize: "0.8125rem" }}>
            Powered by <span className="text-foreground" style={{ fontWeight: 500 }}>Stripe Identity</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.25rem" }} className="text-foreground">syft</span>
          <span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: "0.8125rem" }}>
            <Lock size={12} />
            Stripe Identity
          </span>
        </div>

        <div className="flex items-center gap-2">
          {STEPS_META.map((s, i) => {
            const isActive = s.id === step;
            const isDone = stepIndex > i;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: isDone ? "var(--accent)" : isActive ? "var(--foreground)" : "var(--muted)", transition: "all 0.3s" }}
                  >
                    {isDone ? (
                      <Check size={10} color="white" strokeWidth={3} />
                    ) : (
                      <span style={{ fontSize: "0.6rem", color: isActive ? "white" : "var(--muted-foreground)" }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: isActive ? "var(--foreground)" : "var(--muted-foreground)", display: "none" }} className="sm:inline">
                    {s.label}
                  </span>
                </div>
                {i < STEPS_META.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: isDone ? "var(--accent)" : "var(--border)", minWidth: "20px", transition: "all 0.3s" }} />
                )}
              </div>
            );
          })}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
        {step === "consent" && (
          <div className="w-full">
            <h2 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500 }}>
              Before we begin
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
              Stripe Identity will ask you to take a photo of a government-issued ID and a short selfie video. Here's exactly what happens to that data:
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Your ID is scanned to confirm your name, age, and that it's genuine.",
                "Your selfie is compared to the ID photo to confirm it's really you.",
                "Stripe processes this data securely. Syft only receives a verified/not verified result.",
                "You can request deletion of your verification data at any time.",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: "var(--secondary)", color: "var(--accent)", fontSize: "0.7rem", fontWeight: 600 }}>
                    {i + 1}
                  </span>
                  <p className="text-foreground leading-relaxed" style={{ fontSize: "0.875rem" }}>{point}</p>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 mb-8 cursor-pointer">
              <div
                onClick={() => setConsentChecked((c) => !c)}
                className="w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={{ background: consentChecked ? "var(--accent)" : "transparent", borderColor: consentChecked ? "var(--accent)" : "var(--border)" }}
              >
                {consentChecked && <Check size={11} color="white" strokeWidth={3} />}
              </div>
              <span className="text-foreground leading-relaxed" style={{ fontSize: "0.875rem" }}>
                I consent to Stripe Identity processing my ID and biometric data for verification purposes, as described above.
              </span>
            </label>

            <button
              onClick={() => setStep("id-capture")}
              disabled={!consentChecked}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              I agree — continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === "id-capture" && (
          <div className="w-full text-center">
            <div
              className="w-full rounded-2xl border-2 border-dashed mb-6 flex flex-col items-center justify-center py-16 cursor-pointer transition-all hover:border-foreground"
              style={{ borderColor: idCaptured ? "var(--accent)" : "var(--border)", background: idCaptured ? "rgba(221,126,51,0.05)" : "var(--card)" }}
              onClick={() => setIdCaptured(true)}
            >
              {idCaptured ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--accent)" }}>
                    <Check size={22} color="white" strokeWidth={2.5} />
                  </div>
                  <p className="text-foreground" style={{ fontWeight: 500, fontSize: "0.9375rem" }}>ID captured</p>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>Tap to retake</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--secondary)" }}>
                    <CreditCard size={24} color="var(--accent)" />
                  </div>
                  <p className="text-foreground mb-1" style={{ fontWeight: 500, fontSize: "0.9375rem" }}>Government ID</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Passport, driver's license, or national ID</p>
                  <p className="mt-3" style={{ fontSize: "0.8125rem", color: "var(--accent)" }}>Tap to capture →</p>
                </>
              )}
            </div>

            <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontSize: "0.8125rem" }}>
              Place your ID on a flat surface in good lighting. Make sure all four corners are visible and text is clear.
            </p>

            <button
              onClick={() => setStep("selfie")}
              disabled={!idCaptured}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === "selfie" && (
          <div className="w-full text-center">
            <h2 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 500 }}>
              Now a quick selfie
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
              We'll compare this to your ID photo to confirm it's really you. No filters, good lighting, face the camera straight on.
            </p>

            <div
              className="w-48 h-48 rounded-full border-2 border-dashed flex flex-col items-center justify-center mx-auto mb-8 cursor-pointer transition-all hover:border-foreground"
              style={{ borderColor: selfieCaptured ? "var(--accent)" : "var(--border)", background: selfieCaptured ? "rgba(221,126,51,0.05)" : "var(--card)" }}
              onClick={() => setSelfieCaptured(true)}
            >
              {selfieCaptured ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
                  <Check size={22} color="white" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  <Camera size={28} color="var(--muted-foreground)" className="mb-2" />
                  <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Tap to open camera</p>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setStep("processing");
                setTimeout(() => setStep("complete"), 2200);
              }}
              disabled={!selfieCaptured}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Submit for verification
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="w-20 h-20 rounded-full border-2 animate-spin" style={{ borderColor: "var(--muted)", borderTopColor: "var(--accent)" }} />
            </div>
            <h2 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500 }}>
              Verifying…
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
              This usually takes a few seconds.
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="text-center max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: "var(--accent)" }}>
              <Check size={32} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500 }}>
              You're verified.
            </h2>
            <p className="text-muted-foreground mb-10 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
              Welcome to a community where everyone is who they say they are. Now, tell us who you're looking for.
            </p>
            <button
              onClick={onComplete}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Go to Syft
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
