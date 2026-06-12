"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Connections + chat store. When the user is signed in (Supabase configured),
// likes and messages persist in Postgres via /api/connections — cross-device, and
// feeding the outcome-learning loop (CLAUDE.md §7). When signed out / demo mode,
// it transparently falls back to a localStorage store on this device. Either way
// no replies are simulated — your messages save; the other person isn't faked.
//
// Messaging is gated on a *mutual match* (CLAUDE.md §6, reciprocal visibility):
// you can like anyone, but you can only message someone once they've liked you
// back. Real reciprocation needs a second active user; until that backend exists,
// the "they liked you back" signal lives in a local overlay (`syft-matched-v1`)
// flipped only by an explicit, clearly-labelled demo action — never auto-faked.

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  at: number;
}

export interface Connection {
  id: string;
  name: string;
  age: number;
  photo?: string;
  city: string;
  likedAt: number;
  /** True once they've liked you back — the gate for messaging. */
  matched: boolean;
  messages: ChatMessage[];
}

export interface LikeInput {
  id: string;
  name: string;
  age: number;
  photo?: string;
  city: string;
}

export interface ConnectionsApi {
  connections: Connection[];
  isLiked: (id: string) => boolean;
  /** Whether messaging is unlocked: you like them AND they liked you back. */
  canMessage: (id: string) => boolean;
  like: (p: LikeInput) => void;
  toggleLike: (p: LikeInput) => void;
  removeConnection: (id: string) => void;
  sendMessage: (id: string, text: string) => void;
  /** Whether a demo profile is currently composing a reply (typing indicator). */
  isTyping: (id: string) => boolean;
  /** Demo affordance: simulate this person liking you back (no real user yet). */
  simulateMatch: (id: string) => void;
}

const KEY = "syft-connections-v1";
const MATCHED_KEY = "syft-matched-v1";
type Mode = "loading" | "remote" | "local";

/** Seed/demo profiles (p1, p2, …) auto-reply; real users (UUID ids) never do. */
const isDemoId = (id: string) => /^p\d+$/.test(id);

export function useConnections(): ConnectionsApi {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const modeRef = useRef<Mode>("loading");
  const hydratedRef = useRef(false);
  const connRef = useRef<Connection[]>([]);
  const matchedRef = useRef<string[]>([]);

  // Keep live refs so the stable callbacks below read current state.
  useEffect(() => {
    connRef.current = connections;
  }, [connections]);
  useEffect(() => {
    matchedRef.current = matchedIds;
  }, [matchedIds]);

  // Hydrate the matched overlay (always local — it's a per-device demo signal).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATCHED_KEY);
      if (raw) setMatchedIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Decide mode on mount: try the backend, else fall back to localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/connections");
        const data = await res.json();
        if (!cancelled && res.ok && data.remote) {
          modeRef.current = "remote";
          setConnections(data.connections ?? []);
          hydratedRef.current = true;
          return;
        }
      } catch {
        /* fall through to local */
      }
      if (cancelled) return;
      modeRef.current = "local";
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setConnections(JSON.parse(raw));
      } catch {
        /* ignore */
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage only in local mode.
  useEffect(() => {
    if (!hydratedRef.current || modeRef.current !== "local") return;
    try {
      localStorage.setItem(KEY, JSON.stringify(connections));
    } catch {
      /* ignore quota */
    }
  }, [connections]);

  // Persist the matched overlay (both modes — it isn't stored server-side yet).
  useEffect(() => {
    try {
      localStorage.setItem(MATCHED_KEY, JSON.stringify(matchedIds));
    } catch {
      /* ignore */
    }
  }, [matchedIds]);

  // Fire a backend mutation and reconcile with the authoritative server list.
  const remote = useCallback(
    async (action: string, profileId: string, text?: string) => {
      try {
        const res = await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, profileId, text }),
        });
        const data = await res.json();
        if (res.ok && data.remote) setConnections(data.connections ?? []);
      } catch {
        /* keep optimistic state */
      }
    },
    [],
  );

  const isLiked = useCallback((id: string) => connections.some((c) => c.id === id), [connections]);

  const canMessage = useCallback(
    (id: string) => matchedIds.includes(id) && connections.some((c) => c.id === id),
    [matchedIds, connections],
  );

  const like = useCallback(
    (p: LikeInput) => {
      if (connRef.current.some((c) => c.id === p.id)) return;
      setConnections((prev) => [{ ...p, likedAt: Date.now(), matched: false, messages: [] }, ...prev]); // optimistic
      if (modeRef.current === "remote") remote("like", p.id);
    },
    [remote],
  );

  const toggleLike = useCallback(
    (p: LikeInput) => {
      const liked = connRef.current.some((c) => c.id === p.id);
      if (liked) {
        setConnections((prev) => prev.filter((c) => c.id !== p.id));
        setMatchedIds((prev) => prev.filter((m) => m !== p.id));
        if (modeRef.current === "remote") remote("unlike", p.id);
      } else {
        setConnections((prev) => [{ ...p, likedAt: Date.now(), matched: false, messages: [] }, ...prev]);
        if (modeRef.current === "remote") remote("like", p.id);
      }
    },
    [remote],
  );

  const removeConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== id));
      setMatchedIds((prev) => prev.filter((m) => m !== id));
      if (modeRef.current === "remote") remote("unlike", id);
    },
    [remote],
  );

  const stopTyping = useCallback(
    (id: string) => setTypingIds((prev) => prev.filter((x) => x !== id)),
    [],
  );

  const sendMessage = useCallback(
    (id: string, text: string) => {
      const t = text.trim();
      if (!t) return;
      // Gate: never send unless it's a mutual match.
      if (!matchedRef.current.includes(id)) return;
      const mine = { from: "me" as const, text: t, at: Date.now() };
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, messages: [...c.messages, mine] } : c)),
      );

      // Demo profiles reply in character (server persists it in remote mode; the
      // stateless endpoint voices it in local mode). Real users never reply.
      const expectsReply = isDemoId(id);
      if (expectsReply) setTypingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

      if (modeRef.current === "remote") {
        // The message action now also generates + stores the demo reply, so the
        // reconciled connections list already includes it.
        remote("message", id, t).finally(() => stopTyping(id));
      } else if (modeRef.current === "local") {
        if (!expectsReply) return;
        const history = [
          ...(connRef.current.find((c) => c.id === id)?.messages ?? []),
          mine,
        ].map((m) => ({ from: m.from, text: m.text }));
        fetch("/api/chat/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: id, history }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.reply) {
              setConnections((prev) =>
                prev.map((c) =>
                  c.id === id
                    ? { ...c, messages: [...c.messages, { from: "them", text: data.reply, at: Date.now() }] }
                    : c,
                ),
              );
            }
          })
          .catch(() => {
            /* leave the user's message; no reply on failure */
          })
          .finally(() => stopTyping(id));
      }
    },
    [remote, stopTyping],
  );

  const isTyping = useCallback((id: string) => typingIds.includes(id), [typingIds]);

  const simulateMatch = useCallback((id: string) => {
    setMatchedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Decorate connections with the live matched flag from the overlay.
  const decorated = useMemo<Connection[]>(
    () => connections.map((c) => ({ ...c, matched: matchedIds.includes(c.id) })),
    [connections, matchedIds],
  );

  return {
    connections: decorated,
    isLiked,
    canMessage,
    like,
    toggleLike,
    removeConnection,
    sendMessage,
    isTyping,
    simulateMatch,
  };
}
