"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Connections + chat store. When the user is signed in (Supabase configured),
// likes and messages persist in Postgres via /api/connections — cross-device, and
// feeding the outcome-learning loop (CLAUDE.md §7). When signed out / demo mode,
// it transparently falls back to a localStorage store on this device. Either way
// no replies are simulated — your messages save; the other person isn't faked.

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  at: number;
}

export interface Connection {
  id: string;
  name: string;
  age: number;
  city: string;
  likedAt: number;
  messages: ChatMessage[];
}

export interface LikeInput {
  id: string;
  name: string;
  age: number;
  city: string;
}

export interface ConnectionsApi {
  connections: Connection[];
  isLiked: (id: string) => boolean;
  like: (p: LikeInput) => void;
  toggleLike: (p: LikeInput) => void;
  removeConnection: (id: string) => void;
  sendMessage: (id: string, text: string) => void;
}

const KEY = "syft-connections-v1";
type Mode = "loading" | "remote" | "local";

export function useConnections(): ConnectionsApi {
  const [connections, setConnections] = useState<Connection[]>([]);
  const modeRef = useRef<Mode>("loading");
  const hydratedRef = useRef(false);
  const connRef = useRef<Connection[]>([]);

  // Keep a live ref so the stable callbacks below read current state.
  useEffect(() => {
    connRef.current = connections;
  }, [connections]);

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

  const like = useCallback(
    (p: LikeInput) => {
      if (connRef.current.some((c) => c.id === p.id)) return;
      setConnections((prev) => [{ ...p, likedAt: Date.now(), messages: [] }, ...prev]); // optimistic
      if (modeRef.current === "remote") remote("like", p.id);
    },
    [remote],
  );

  const toggleLike = useCallback(
    (p: LikeInput) => {
      const liked = connRef.current.some((c) => c.id === p.id);
      if (liked) {
        setConnections((prev) => prev.filter((c) => c.id !== p.id));
        if (modeRef.current === "remote") remote("unlike", p.id);
      } else {
        setConnections((prev) => [{ ...p, likedAt: Date.now(), messages: [] }, ...prev]);
        if (modeRef.current === "remote") remote("like", p.id);
      }
    },
    [remote],
  );

  const removeConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== id));
      if (modeRef.current === "remote") remote("unlike", id);
    },
    [remote],
  );

  const sendMessage = useCallback(
    (id: string, text: string) => {
      const t = text.trim();
      if (!t) return;
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, messages: [...c.messages, { from: "me", text: t, at: Date.now() }] } : c,
        ),
      );
      if (modeRef.current === "remote") remote("message", id, t);
    },
    [remote],
  );

  return { connections, isLiked, like, toggleLike, removeConnection, sendMessage };
}
