-- Syft data layer — profiles + pgvector embeddings.
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- (Embeddings are 384-dim from the local all-MiniLM-L6-v2 model.)

create extension if not exists vector;

create table if not exists public.profiles (
  id                    text primary key,                          -- 'p1'… for seeds; the auth user id for real users
  user_id               uuid references auth.users(id) on delete cascade, -- null for seed/system profiles
  name                  text not null,
  age                   int  not null,
  gender                text,                                      -- 'man' | 'woman' | 'nonbinary' (matching bucket)
  seeking               text[] not null default '{}',              -- genders this person is open to meeting
  city                  text not null,
  lat                   double precision not null default 0,
  lng                   double precision not null default 0,
  last_active_days_ago  int  not null default 0,
  intent                text not null,                             -- RelationshipIntent
  open_to               text[] not null default '{}',
  deal_breakers         text[] not null default '{}',
  raw_signals           jsonb  not null default '{}'::jsonb,       -- { assessment, promptResponses[], voiceHighlights }
  narrative             text,                                      -- Stage-0 output
  embedding             vector(384),                               -- Stage-0 output ("embed once")
  in_pool               boolean not null default true,             -- only embedded (and later: verified) profiles are searchable
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Migrate tables created before the gender/seeking columns existed (no-op on a
-- fresh table). Re-running this whole file is safe.
alter table public.profiles add column if not exists gender  text;
alter table public.profiles add column if not exists seeking text[] not null default '{}';

-- One profile per authenticated user.
create unique index if not exists profiles_user_id_idx
  on public.profiles (user_id) where user_id is not null;

-- Approximate-nearest-neighbour index for cosine similarity (Stage 2 at scale).
create index if not exists profiles_embedding_idx
  on public.profiles using hnsw (embedding vector_cosine_ops);

-- Row Level Security: a user may read/write only their OWN row. The matching pool
-- is read server-side with the service-role key and never exposed to clients
-- (reciprocal visibility — CLAUDE.md §6).
alter table public.profiles enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id);

-- pgvector similarity RPC — used to "rank in the DB" as the pool grows (the app
-- currently fetches the embedded pool and ranks in-process; this is the scale path).
create or replace function public.match_profiles(
  query_embedding vector(384),
  match_count int default 20,
  exclude_user uuid default null
)
returns table (id text, similarity float)
language sql stable
as $$
  select p.id, 1 - (p.embedding <=> query_embedding) as similarity
  from public.profiles p
  where p.embedding is not null
    and p.in_pool = true
    and (exclude_user is null or p.user_id is distinct from exclude_user)
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Likes + messages (the connection layer). Feeds the outcome-learning loop
-- (CLAUDE.md §7: like → conversation initiated → sustained). The matching pool
-- and these rows are read/written server-side with the service-role key; RLS
-- still restricts any direct client access to a user's own rows.
-- ---------------------------------------------------------------------------

-- A member likes a pool profile.
create table if not exists public.likes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  profile_id  text not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, profile_id)
);
alter table public.likes enable row level security;
drop policy if exists "own likes" on public.likes;
create policy "own likes" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages a member sends to a liked profile (one-sided in the prototype — no
-- simulated replies; sender is kept for the future two-way case).
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  profile_id  text not null references public.profiles(id) on delete cascade,
  sender      text not null default 'me',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_user_profile_idx
  on public.messages (user_id, profile_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
