"use client";

import { useState } from "react";
import { Search as SearchIcon, MessageCircle } from "lucide-react";
import { SearchPlatform } from "./SearchPlatform";
import { ChatsView } from "./ChatsView";
import { useConnections } from "./useConnections";

// The post-onboarding app: a Discover (search) view and a Messages (chats) view,
// sharing one connections store. This replaces rendering SearchPlatform directly.
export function MainApp() {
  const conn = useConnections();
  const [view, setView] = useState<"discover" | "messages">("discover");
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  function openChat(id: string) {
    setOpenChatId(id);
    setView("messages");
  }

  const Tab = ({ id, label, icon, badge }: { id: "discover" | "messages"; label: string; icon: React.ReactNode; badge?: number }) => {
    const active = view === id;
    return (
      <button
        onClick={() => {
          setView(id);
          if (id === "messages") setOpenChatId(null);
        }}
        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all"
        style={{
          background: active ? "var(--foreground)" : "transparent",
          color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
          fontSize: "0.8125rem",
          fontWeight: 500,
        }}
      >
        {icon}
        {label}
        {badge ? (
          <span
            className="rounded-full px-1.5"
            style={{
              background: active ? "var(--primary-foreground)" : "var(--accent)",
              color: active ? "var(--foreground)" : "var(--accent-foreground)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              lineHeight: "1.25rem",
              minWidth: "1.25rem",
              textAlign: "center",
            }}
          >
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.375rem" }} className="text-foreground">
          syft
        </span>
        <nav className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--secondary)" }}>
          <Tab id="discover" label="Discover" icon={<SearchIcon size={14} />} />
          <Tab id="messages" label="Messages" icon={<MessageCircle size={14} />} badge={conn.connections.length} />
        </nav>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontSize: "0.8125rem", fontWeight: 500 }}>
          Y
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {view === "discover" ? (
          <SearchPlatform conn={conn} onOpenChat={openChat} />
        ) : (
          <ChatsView conn={conn} openChatId={openChatId} setOpenChatId={setOpenChatId} onGoDiscover={() => setView("discover")} />
        )}
      </div>
    </div>
  );
}
