-- Migration for existing projects: admin/team profiles + comment avatars.

create table if not exists public.profiles (
  email text primary key,
  display_name text check (char_length(display_name) between 1 and 48),
  title text check (char_length(title) <= 80),
  avatar_url text,
  badge text check (badge in ('XyDev', 'XyTeam')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Public can view profiles" on public.profiles;
create policy "Public can view profiles" on public.profiles
for select using (true);

alter table public.comments add column if not exists author_avatar text;
