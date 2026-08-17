-- Migration for existing projects: adds the likes table (idempotent).
-- Run this in the Supabase SQL Editor on top of the original schema.sql.
-- (The base schema.sql above now includes this section as well.)

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.progress_updates(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists likes_update_created_idx on public.likes(update_id, created_at asc);

alter table public.likes enable row level security;

drop policy if exists "Public can view likes" on public.likes;
create policy "Public can view likes" on public.likes
for select using (true);

drop policy if exists "Anyone can like" on public.likes;
create policy "Anyone can like" on public.likes
for insert with check (true);
