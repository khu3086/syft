// Demo chat replies. The prototype's seed profiles answer a member's messages in
// character (driven by their own narrative/voice), so a conversation feels alive
// before there's a second real user. This is the ONLY place replies are produced,
// and it is deliberately restricted to seed/demo profiles:
//
//   demoPersona(id) looks the profile up in the seed pool. A real user's profile
//   (a UUID id) is never in that pool, so generateDemoReply() returns null for
//   them — Syft never fabricates a reply from a real person (CLAUDE.md §2/§6).
//
// The UI labels these replies as AI/demo for transparency (CLAUDE.md §3).

import { loadPool } from "@/data/loadPool";
import { replyAsProfile, type ChatTurn } from "@/lib/matching/providers/llm";
import type { EmbeddedProfile } from "@/lib/matching/types";

export type { ChatTurn };

/** The seed persona for an id, or null if it isn't a demo profile we may voice. */
export function demoPersona(profileId: string): EmbeddedProfile | null {
  try {
    return loadPool().find((p) => p.id === profileId) ?? null;
  } catch {
    return null; // embeddings.json missing → no personas available
  }
}

/** Whether this id belongs to a demo profile that auto-replies. */
export function isDemoProfile(profileId: string): boolean {
  return demoPersona(profileId) !== null;
}

/**
 * Generate an in-character reply for a demo profile given the conversation so
 * far, or null if the id isn't a demo profile (e.g. a real user — never faked).
 */
export async function generateDemoReply(
  profileId: string,
  history: ChatTurn[],
): Promise<string | null> {
  const persona = demoPersona(profileId);
  if (!persona) return null;
  return replyAsProfile(persona, history);
}
