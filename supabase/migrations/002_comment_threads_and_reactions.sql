-- Migration for existing projects: comment replies, author badges and reactions.
-- Run this in the Supabase SQL Editor on top of schema.sql / migration 001.

alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists author_badge text check (author_badge in ('XyDev', 'XyTeam'));
create index if not exists comments_parent_idx on public.comments(parent_id);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reaction text not null check (reaction in ('membantu', 'setuju', 'terima kasih')),
  created_at timestamptz not null default now()
);

create index if not exists comment_reactions_comment_idx on public.comment_reactions(comment_id, created_at asc);

alter table public.comment_reactions enable row level security;

drop policy if exists "Public can view comment reactions" on public.comment_reactions;
create policy "Public can view comment reactions" on public.comment_reactions
for select using (true);

drop policy if exists "Anyone can react" on public.comment_reactions;
create policy "Anyone can react" on public.comment_reactions
for insert with check (true);
