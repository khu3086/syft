"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Registers the service worker and offers a calm, dismissable "Install Syft"
// affordance when the browser fires beforeinstallprompt (Chrome/Edge/Android).
// iOS Safari has no programmatic prompt — users Add to Home Screen from Share —
// so we surface a one-line hint there instead.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register the service worker (production build serves /sw.js from public/).
    if ("serviceWorker" in navigator) {
      const onLoad = () =>
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      window.addEventListener("load", onLoad);
      // If the page is already loaded, register now.
      if (document.readyState === "complete") onLoad();
    }

    if (isStandalone() || sessionStorage.getItem("syft-install-dismissed")) {
      setDismissed(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS gets no event — show the manual hint once.
    if (isIos() && !isStandalone()) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    setShowIosHint(false);
    setDeferred(null);
    try {
      sessionStorage.setItem("syft-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Syft"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        zIndex: 60,
        width: "min(420px, calc(100vw - 2rem))",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        boxShadow: "0 12px 40px rgba(28,25,22,0.12)",
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          flexShrink: 0,
          background: "var(--accent)",
          color: "var(--accent-foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "1.25rem",
        }}
        aria-hidden
      >
        s
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "var(--foreground)", fontSize: "0.9rem", fontWeight: 500 }}>
          Install Syft
        </p>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.8rem", lineHeight: 1.35 }}>
          {deferred
            ? "Add it to your home screen for a calmer, full-screen experience."
            : "Tap Share, then “Add to Home Screen.”"}
        </p>
      </div>

      {deferred && (
        <button
          onClick={install}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "var(--foreground)",
            color: "var(--primary-foreground)",
            borderRadius: "0.6rem",
            padding: "0.5rem 0.85rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <Download size={15} />
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ color: "var(--muted-foreground)", padding: 4, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
