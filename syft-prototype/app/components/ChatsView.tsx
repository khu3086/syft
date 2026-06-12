"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Heart, MessageCircle, Lock, Clock } from "lucide-react";
import type { ConnectionsApi } from "./useConnections";

const AVATAR_BG = ["#D4C5B8", "#B8C5CC", "#C5C5B8", "#C5BCB8", "#C5C0B4"];
const bgFor = (id: string) =>
  AVATAR_BG[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];

function timeLabel(at: number) {
  try {
    return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface ChatsViewProps {
  conn: ConnectionsApi;
  openChatId: string | null;
  setOpenChatId: (id: string | null) => void;
  onGoDiscover: () => void;
}

export function ChatsView({ conn, openChatId, setOpenChatId, onGoDiscover }: ChatsViewProps) {
  const open = openChatId ? conn.connections.find((c) => c.id === openChatId) : null;

  if (open) {
    return <ChatWindow conn={conn} connectionId={open.id} onBack={() => setOpenChatId(null)} />;
  }

  // --- Conversation list ---
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 w-full h-full overflow-y-auto">
      <div className="mb-6">
        <p className="text-muted-foreground mb-0.5" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Messages
        </p>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500 }}>
          People you&apos;ve liked
        </h1>
      </div>

      {conn.connections.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--secondary)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--card)" }}>
            <Heart size={20} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 500 }}>
            No conversations yet.
          </p>
          <p className="text-muted-foreground mb-5" style={{ fontSize: "0.875rem" }}>
            When you like someone in Discover, they&apos;ll show up here and you can start a conversation.
          </p>
          <button
            onClick={onGoDiscover}
            className="rounded-xl px-6 py-2.5 transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--foreground)", color: "var(--primary-foreground)", fontSize: "0.875rem", fontWeight: 500 }}
          >
            Find someone
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conn.connections.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                onClick={() => setOpenChatId(c.id)}
                className="w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center" style={{ background: bgFor(c.id), color: "var(--foreground)" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 500 }}>{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground" style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                      {c.name}, {c.age}
                    </p>
                    {c.matched && (
                      <span className="rounded-full px-2 py-0.5 shrink-0" style={{ background: "var(--accent)", color: "var(--accent-foreground)", fontSize: "0.625rem", fontWeight: 600 }}>
                        Match
                      </span>
                    )}
                  </div>
                  {c.matched ? (
                    <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>
                      {last ? last.text : "Say hello — start the conversation"}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                      <Clock size={12} />
                      Liked · waiting for them to like you back
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}

interface ChatWindowProps {
  conn: ConnectionsApi;
  connectionId: string;
  onBack: () => void;
}

function ChatWindow({ conn, connectionId, onBack }: ChatWindowProps) {
  const connection = conn.connections.find((c) => c.id === connectionId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [connection?.messages.length]);

  if (!connection) {
    onBack();
    return null;
  }

  const matched = connection.matched;

  function send() {
    const t = draft.trim();
    if (!t) return;
    conn.sendMessage(connectionId, t);
    setDraft("");
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to messages">
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: bgFor(connection.id), color: "var(--foreground)" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 500 }}>{connection.name[0]}</span>
        </div>
        <div>
          <p className="text-foreground" style={{ fontWeight: 500, fontSize: "0.95rem" }}>
            {connection.name}, {connection.age}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{connection.city}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {matched ? (
          <>
            {/* Honest framing — mutual match, no simulated replies */}
            <div className="rounded-xl px-4 py-3 mx-auto text-center" style={{ background: "var(--secondary)", maxWidth: 360 }}>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.55 }}>
                You and <span className="text-foreground" style={{ fontWeight: 500 }}>{connection.name}</span> liked each
                other. Say hello — your messages are saved here. Syft never fakes a reply.
              </p>
            </div>

            {connection.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className="rounded-2xl px-4 py-2.5"
                  style={{
                    maxWidth: "75%",
                    background: m.from === "me" ? "var(--accent)" : "var(--card)",
                    color: m.from === "me" ? "var(--accent-foreground)" : "var(--foreground)",
                    border: m.from === "me" ? "none" : "1px solid var(--border)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
                  <span style={{ display: "block", fontSize: "0.65rem", opacity: 0.6, marginTop: 3, textAlign: "right" }}>
                    {timeLabel(m.at)}
                  </span>
                </div>
              </div>
            ))}

            {connection.messages.length === 0 && (
              <div className="text-center pt-6">
                <MessageCircle size={22} style={{ color: "var(--muted-foreground)", margin: "0 auto 8px" }} />
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  Break the ice — what made you curious about {connection.name}?
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--secondary)" }}>
              <Lock size={20} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <p className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 500 }}>
              Not a match yet
            </p>
            <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 320 }}>
              You liked <span className="text-foreground" style={{ fontWeight: 500 }}>{connection.name}</span>. You&apos;ll be
              able to message them once they like you back — Syft never fakes a reply or a match.
            </p>
            <button
              onClick={() => conn.simulateMatch(connection.id)}
              className="mt-6 rounded-xl px-4 py-2 border border-dashed transition-all hover:bg-card active:scale-95"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontSize: "0.75rem" }}
              title="Demo only: simulate a mutual match so you can test messaging"
            >
              Simulate they liked you back (demo)
            </button>
          </div>
        )}
      </div>

      {/* Composer — unlocked only on a mutual match */}
      {matched ? (
        <div className="flex items-end gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message ${connection.name}…`}
            rows={1}
            className="flex-1 resize-none outline-none rounded-2xl px-4 py-3 border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "0.9rem", maxHeight: 120 }}
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="rounded-full p-3 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 px-4 py-4 border-t text-muted-foreground" style={{ borderColor: "var(--border)", fontSize: "0.8125rem" }}>
          <Lock size={14} />
          Messaging unlocks when {connection.name} likes you back
        </div>
      )}
    </div>
  );
}
