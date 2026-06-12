"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowRight, MessageCircle, Heart, Star, ChevronDown, Paperclip, Globe, SlidersHorizontal, Mic, Clock } from "lucide-react";
import type { SearchResult } from "@/lib/matching/types";
import type { ConnectionsApi } from "./useConnections";
import { Avatar } from "./Avatar";

const EXAMPLE_PROMPTS = [
  "Someone who'd drag me to a weird art show, then argue about it over chai",
  "A reader who takes long walks and isn't afraid of silence",
  "Someone emotionally available, curious, and funny without trying too hard",
  "Calm energy, quietly ambitious, loves dogs and cooking elaborate dinners",
];

const AVATAR_BG = ["#D4C5B8", "#B8C5CC", "#C5C5B8", "#C5BCB8", "#C5C0B4"];

interface Turn {
  id: number;
  query: string;
  loading: boolean;
  result: SearchResult | null;
  error: string | null;
}

interface SearchPlatformProps {
  conn: ConnectionsApi;
  onOpenChat: (id: string) => void;
}

export function SearchPlatform({ conn, onOpenChat }: SearchPlatformProps) {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const counter = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const busy = turns.some((t) => t.loading);

  // Keep the newest turn in view as the conversation grows (chat-style).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  async function handleSearch() {
    const q = query.trim();
    if (!q || busy) return;
    const id = ++counter.current;
    // Append to the end of the thread (chronological — newest at the bottom).
    setTurns((prev) => [...prev, { id, query: q, loading: true, result: null, error: null }]);
    setQuery("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed.");
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, loading: false, result: data } : t)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed.";
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, loading: false, error: message } : t)));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  const started = turns.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrolling conversation (oldest → newest, like a chat) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!started ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-6 text-center">
            <h1 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, lineHeight: 1.25 }}>
              Who are you looking for?
            </h1>
            <p className="text-muted-foreground mb-7" style={{ fontSize: "0.9375rem", maxWidth: 460 }}>
              Describe them in your own words. Not happy with the five? Just refine and ask again — it&apos;s a conversation.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center" style={{ maxWidth: 600 }}>
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setQuery(prompt); inputRef.current?.focus(); }}
                  className="rounded-2xl px-4 py-2.5 border transition-all hover:border-foreground hover:bg-card active:scale-[0.98] text-left"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.8125rem", lineHeight: 1.45, background: "var(--card)", maxWidth: 280 }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6 w-full space-y-8">
            {turns.map((turn) => (
              <TurnBlock
                key={turn.id}
                turn={turn}
                conn={conn}
                onOpenChat={onOpenChat}
                expandedKey={expandedKey}
                setExpandedKey={setExpandedKey}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom composer — a dark "command" box floating on the gradient */}
      <div className="shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-2 pb-4 w-full">
          <div className="composer">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={started ? "Refine it — add a detail, change the vibe, ask again…" : "Describe who you're looking for…"}
              className="composer-input"
              rows={1}
            />
            <div className="composer-row">
              <button type="button" className="composer-icon" aria-label="Attach" disabled>
                <Paperclip size={17} />
              </button>
              <button type="button" className="composer-icon" aria-label="Location" disabled>
                <Globe size={17} />
              </button>
              <span className="composer-divider" />
              <button type="button" className="composer-icon" aria-label="Refine preferences" disabled>
                <SlidersHorizontal size={17} />
              </button>
              <button type="button" className="composer-icon" aria-label="Voice" disabled>
                <Mic size={17} />
              </button>
              <button
                onClick={handleSearch}
                disabled={!query.trim() || busy}
                className="composer-send"
                aria-label="Search"
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-2" style={{ fontSize: "0.75rem" }}>
            {busy ? "Syft is reading across the pool…" : "Press Enter to search · Shift+Enter for a new line"}
          </p>
        </div>
      </div>
    </div>
  );
}

function TurnBlock({
  turn,
  conn,
  onOpenChat,
  expandedKey,
  setExpandedKey,
}: {
  turn: Turn;
  conn: ConnectionsApi;
  onOpenChat: (id: string) => void;
  expandedKey: string | null;
  setExpandedKey: (k: string | null) => void;
}) {
  const matches = turn.result?.results ?? [];

  return (
    <div>
      {/* The query you asked, as a chat turn */}
      <div className="flex justify-end mb-4">
        <div className="rounded-2xl px-4 py-2.5" style={{ background: "var(--secondary)", color: "var(--foreground)", maxWidth: "85%", fontSize: "0.9rem", lineHeight: 1.5 }}>
          {turn.query}
        </div>
      </div>

      {turn.loading && (
        <div className="text-center py-10">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: "0.9rem" }}>Syft is reading across the pool…</p>
        </div>
      )}

      {turn.error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(212,24,61,0.06)", border: "1px solid rgba(212,24,61,0.2)", color: "#9a2740", fontSize: "0.875rem" }}>
          {turn.error}
        </div>
      )}

      {turn.result && (
        <div>
          {turn.result.refusedDimensions.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              <span className="text-foreground" style={{ fontWeight: 500 }}>A note on your search. </span>
              <span className="text-muted-foreground">
                {turn.result.refusedDimensions.map((r) => r.stance).join(" ")} We ranked everyone else on the rest of what you described.
              </span>
            </div>
          )}

          <p className="text-foreground mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 500 }}>
            {turn.result.honest.message}
          </p>

          {matches.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--secondary)" }}>
              <p className="text-foreground mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 500 }}>
                Nothing strong enough to show yet.
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                Syft would rather show fewer real matches than pad the list. Try refining above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((m, i) => {
                const score = Math.round(m.composite * 100);
                const tagline = m.assessment.matchReasons[0] ?? m.assessment.explanation;
                const key = `${turn.id}:${m.profileId}`;
                const liked = conn.isLiked(m.profileId);
                const matched = conn.canMessage(m.profileId);
                const likeInput = { id: m.profileId, name: m.name, age: m.age, photo: m.photo, city: m.city };
                return (
                  <div key={m.profileId} className="rounded-2xl border overflow-hidden transition-all hover:shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar name={m.name} photo={m.photo} size={56} bg={AVATAR_BG[i % AVATAR_BG.length]} fontSize={20} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-foreground" style={{ fontWeight: 500, fontSize: "1rem" }}>{m.name}, {m.age}</span>
                            <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{m.city}</span>
                            <span className="ml-auto rounded-full px-2.5 py-0.5 shrink-0" style={{ background: i === 0 ? "var(--accent)" : "var(--secondary)", color: i === 0 ? "var(--accent-foreground)" : "var(--muted-foreground)", fontSize: "0.75rem", fontWeight: 500 }}>
                              {score}% fit
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2" style={{ fontSize: "0.8125rem" }}>{m.label}</p>
                          <p className="text-foreground" style={{ fontSize: "0.9rem", fontStyle: "italic", fontFamily: "var(--font-display)" }}>&ldquo;{tagline}&rdquo;</p>
                        </div>
                      </div>

                      <button
                        className="w-full flex items-center gap-2 mt-4 pt-4 border-t transition-colors hover:text-foreground text-left"
                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}
                        onClick={() => setExpandedKey(expandedKey === key ? null : key)}
                      >
                        <Star size={13} style={{ color: "var(--accent)" }} />
                        <span>Why you two fit</span>
                        <ChevronDown size={14} className="ml-auto transition-transform" style={{ transform: expandedKey === key ? "rotate(180deg)" : "none" }} />
                      </button>

                      {expandedKey === key && (
                        <div className="mt-3">
                          <p className="leading-relaxed" style={{ color: "var(--foreground)", fontSize: "0.9rem", lineHeight: 1.65 }}>{m.assessment.explanation}</p>
                          {m.assessment.matchReasons.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {m.assessment.matchReasons.map((r, k) => (
                                <li key={k} className="flex items-start gap-2" style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                                  <span style={{ color: "var(--accent)" }}>·</span>{r}
                                </li>
                              ))}
                            </ul>
                          )}
                          {m.assessment.riskFlags.length > 0 && (
                            <p className="mt-3" style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 500 }}>Worth knowing: </span>{m.assessment.riskFlags.join(" · ")}
                            </p>
                          )}
                          <p className="mt-3" style={{ fontSize: "0.85rem", color: "var(--foreground)" }}>
                            <span style={{ color: "var(--accent)", fontWeight: 500 }}>A way in: </span>{m.assessment.nextStep}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center border-t px-5 py-3 gap-3" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                      <button
                        onClick={() => conn.toggleLike(likeInput)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:bg-card active:scale-95"
                        style={{ color: liked ? "var(--accent)" : "var(--muted-foreground)", fontSize: "0.8125rem" }}
                      >
                        <Heart size={15} fill={liked ? "currentColor" : "none"} />
                        {liked ? "Liked" : "Like"}
                      </button>

                      {matched ? (
                        <button
                          onClick={() => onOpenChat(m.profileId)}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:bg-card active:scale-95 ml-auto"
                          style={{ color: "var(--foreground)", fontSize: "0.8125rem", fontWeight: 500 }}
                        >
                          <MessageCircle size={15} />
                          Message
                          <ArrowRight size={13} />
                        </button>
                      ) : liked ? (
                        <div className="ml-auto flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                            <Clock size={13} />
                            Waiting for them to like you back
                          </span>
                          <button
                            onClick={() => conn.simulateMatch(m.profileId)}
                            className="rounded-lg px-2.5 py-1 border border-dashed transition-all hover:bg-card active:scale-95"
                            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.6875rem" }}
                            title="Demo only: simulate a mutual match so you can test messaging"
                          >
                            Simulate match (demo)
                          </button>
                        </div>
                      ) : (
                        <span className="ml-auto text-muted-foreground text-right" style={{ fontSize: "0.75rem" }}>
                          Like first — you can message once they like you back
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
