"use client";

import { useState, useRef } from "react";
import { Search, ArrowRight, MessageCircle, Heart, Star, ChevronDown } from "lucide-react";
import type { SearchResult } from "@/lib/matching/types";

const EXAMPLE_PROMPTS = [
  "Someone who'd drag me to a weird art show, then argue about it over tacos",
  "A reader who takes long walks and isn't afraid of silence",
  "Someone emotionally available, curious, and funny without trying too hard",
  "Calm energy, ambitious quietly, loves dogs and cooking elaborate dinners",
];

// Muted avatar grounds (from the Figma palette), cycled by rank.
const AVATAR_BG = ["#D4C5B8", "#B8C5CC", "#C5C5B8", "#C5BCB8", "#C5C0B4"];

export function SearchPlatform() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed.");
      setResult(data as SearchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const matches = result?.results ?? [];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.375rem" }} className="text-foreground">
          syft
        </span>
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" style={{ fontSize: "0.875rem" }}>
            My profile
          </span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontSize: "0.8125rem", fontWeight: 500 }}>
            Y
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, lineHeight: 1.25 }}>
            Who are you looking for?
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
            Describe them in your own words. Be as specific as you want.
          </p>
        </div>

        <div className="rounded-2xl border overflow-hidden mb-4 transition-all focus-within:ring-2" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 2px 8px rgba(28,25,22,0.04)" }}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Someone who'd drag me to a weird art show, then argue about it over tacos…"
            className="w-full resize-none outline-none bg-transparent px-6 pt-5 pb-3 leading-relaxed"
            style={{ color: "var(--foreground)", fontSize: "1.0625rem", minHeight: "100px" }}
            rows={3}
          />
          <div className="flex items-center justify-between px-4 pb-4 pt-1">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              Press Enter to search, or Shift+Enter for a new line
            </p>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.875rem", fontWeight: 500 }}
            >
              {loading ? (
                <>Finding matches…</>
              ) : (
                <>
                  <Search size={14} />
                  Find matches
                </>
              )}
            </button>
          </div>
        </div>

        {!result && !loading && !error && (
          <div className="flex flex-wrap gap-2 mb-12">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setQuery(prompt); inputRef.current?.focus(); }}
                className="rounded-full px-4 py-2 border transition-all hover:border-foreground hover:bg-card active:scale-95 text-left"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.8125rem", background: "var(--card)" }}
              >
                {prompt.length > 48 ? prompt.slice(0, 48) + "…" : prompt}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
              Syft is reading across the pool…
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(212,24,61,0.06)", border: "1px solid rgba(212,24,61,0.2)", color: "#9a2740", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {result && (
          <div>
            {/* Refuse-and-reframe notice */}
            {result.refusedDimensions.length > 0 && (
              <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                <span className="text-foreground" style={{ fontWeight: 500 }}>A note on your search. </span>
                <span className="text-muted-foreground">
                  {result.refusedDimensions.map((r) => r.stance).join(" ")} We ranked everyone else on the rest of what you described.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-muted-foreground mb-0.5" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Your matches
                </p>
                <p className="text-foreground" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 500 }}>
                  {result.honest.message}
                </p>
              </div>
              {matches.length > 0 && (
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>Ranked by fit</p>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "var(--secondary)" }}>
                <p className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 500 }}>
                  Nothing strong enough to show yet.
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  Syft would rather show fewer real matches than pad the list. Try widening what you&apos;re open to, or check back as more people join.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m, i) => {
                  const score = Math.round(m.composite * 100);
                  const tagline = m.assessment.matchReasons[0] ?? m.assessment.explanation;
                  return (
                    <div key={m.profileId} className="rounded-2xl border overflow-hidden transition-all hover:shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center" style={{ background: AVATAR_BG[i % AVATAR_BG.length], color: "var(--foreground)" }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500 }}>{m.name[0]}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-foreground" style={{ fontWeight: 500, fontSize: "1rem" }}>
                                {m.name}, {m.age}
                              </span>
                              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{m.city}</span>
                              <span
                                className="ml-auto rounded-full px-2.5 py-0.5 shrink-0"
                                style={{
                                  background: i === 0 ? "var(--accent)" : "var(--secondary)",
                                  color: i === 0 ? "var(--accent-foreground)" : "var(--muted-foreground)",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                }}
                              >
                                {score}% fit
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-2" style={{ fontSize: "0.8125rem" }}>{m.label}</p>
                            <p className="text-foreground" style={{ fontSize: "0.9rem", fontStyle: "italic", fontFamily: "var(--font-display)" }}>
                              &ldquo;{tagline}&rdquo;
                            </p>
                          </div>
                        </div>

                        <button
                          className="w-full flex items-center gap-2 mt-4 pt-4 border-t transition-colors hover:text-foreground text-left"
                          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}
                          onClick={() => setExpandedId(expandedId === m.profileId ? null : m.profileId)}
                        >
                          <Star size={13} style={{ color: "var(--accent)" }} />
                          <span>Why you two fit</span>
                          <ChevronDown size={14} className="ml-auto transition-transform" style={{ transform: expandedId === m.profileId ? "rotate(180deg)" : "none" }} />
                        </button>

                        {expandedId === m.profileId && (
                          <div className="mt-3">
                            <p className="leading-relaxed" style={{ color: "var(--foreground)", fontSize: "0.9rem", lineHeight: 1.65 }}>
                              {m.assessment.explanation}
                            </p>
                            {m.assessment.matchReasons.length > 0 && (
                              <ul className="mt-3 space-y-1.5">
                                {m.assessment.matchReasons.map((r, k) => (
                                  <li key={k} className="flex items-start gap-2" style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                                    <span style={{ color: "var(--accent)" }}>·</span>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {m.assessment.riskFlags.length > 0 && (
                              <p className="mt-3" style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                                <span style={{ color: "var(--accent)", fontWeight: 500 }}>Worth knowing: </span>
                                {m.assessment.riskFlags.join(" · ")}
                              </p>
                            )}
                            <p className="mt-3" style={{ fontSize: "0.85rem", color: "var(--foreground)" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 500 }}>A way in: </span>
                              {m.assessment.nextStep}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex border-t px-5 py-3 gap-3" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                        <button
                          onClick={() => toggleLike(m.profileId)}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:bg-card active:scale-95"
                          style={{ color: likedIds.has(m.profileId) ? "var(--accent)" : "var(--muted-foreground)", fontSize: "0.8125rem" }}
                        >
                          <Heart size={15} fill={likedIds.has(m.profileId) ? "currentColor" : "none"} />
                          {likedIds.has(m.profileId) ? "Liked" : "Like"}
                        </button>
                        <button
                          className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:bg-card active:scale-95 ml-auto"
                          style={{ color: "var(--foreground)", fontSize: "0.8125rem", fontWeight: 500 }}
                        >
                          <MessageCircle size={15} />
                          Send message
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: "var(--secondary)" }}>
              <p className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 500 }}>
                Not what you expected?
              </p>
              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.875rem" }}>
                Try refining your description — a little more specificity often surfaces a completely different set of people.
              </p>
              <button
                onClick={() => { setResult(null); setQuery(""); setError(null); }}
                className="rounded-xl px-6 py-2.5 border transition-all hover:border-foreground"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.875rem", background: "var(--card)" }}
              >
                Search again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
