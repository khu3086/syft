// Connections repository — likes + messages, persisted in Supabase. All access
// goes through the service-role admin client, scoped to the authenticated user
// (the API route supplies the verified userId). The liked person's display info
// is joined from the profiles pool, so we never store it twice.

import { createAdminClient } from "@/lib/supabase/admin";

export interface RemoteMessage {
  from: "me" | "them";
  text: string;
  at: number;
}

export interface RemoteConnection {
  id: string;
  name: string;
  age: number;
  city: string;
  likedAt: number;
  messages: RemoteMessage[];
}

export async function listConnections(userId: string): Promise<RemoteConnection[]> {
  const sb = createAdminClient();

  const { data: likes, error: likesErr } = await sb
    .from("likes")
    .select("profile_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (likesErr) throw new Error(`likes load failed: ${likesErr.message}`);
  if (!likes || likes.length === 0) return [];

  const ids = likes.map((l) => l.profile_id as string);

  const { data: profs } = await sb
    .from("profiles")
    .select("id, name, age, city")
    .in("id", ids);
  const profMap = new Map((profs ?? []).map((p) => [p.id as string, p]));

  const { data: msgs } = await sb
    .from("messages")
    .select("profile_id, sender, body, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const byProfile = new Map<string, RemoteMessage[]>();
  for (const m of msgs ?? []) {
    const arr = byProfile.get(m.profile_id as string) ?? [];
    arr.push({
      from: m.sender === "them" ? "them" : "me",
      text: m.body as string,
      at: new Date(m.created_at as string).getTime(),
    });
    byProfile.set(m.profile_id as string, arr);
  }

  return likes.map((l) => {
    const p = profMap.get(l.profile_id as string);
    return {
      id: l.profile_id as string,
      name: (p?.name as string) ?? "Someone",
      age: (p?.age as number) ?? 0,
      city: (p?.city as string) ?? "",
      likedAt: new Date(l.created_at as string).getTime(),
      messages: byProfile.get(l.profile_id as string) ?? [],
    };
  });
}

export async function addLike(userId: string, profileId: string): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("likes")
    .upsert({ user_id: userId, profile_id: profileId }, { onConflict: "user_id,profile_id" });
  if (error) throw new Error(`like failed: ${error.message}`);
}

export async function removeLike(userId: string, profileId: string): Promise<void> {
  const sb = createAdminClient();
  await sb.from("messages").delete().eq("user_id", userId).eq("profile_id", profileId);
  await sb.from("likes").delete().eq("user_id", userId).eq("profile_id", profileId);
}

export async function addMessage(userId: string, profileId: string, text: string): Promise<void> {
  const sb = createAdminClient();
  // Messaging implies a connection — ensure the like exists.
  await sb.from("likes").upsert({ user_id: userId, profile_id: profileId }, { onConflict: "user_id,profile_id" });
  const { error } = await sb
    .from("messages")
    .insert({ user_id: userId, profile_id: profileId, sender: "me", body: text });
  if (error) throw new Error(`message failed: ${error.message}`);
}
