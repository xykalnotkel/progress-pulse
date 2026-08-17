-- Security hardening for existing projects.
--
-- Public pages are rendered on the server through the service-role client.
-- Browser roles therefore do not need direct access to updates, comments,
-- reactions, likes, profiles, or team membership. Keeping those tables behind
-- RLS prevents contributor/admin emails and moderation metadata from leaking
-- through the Supabase REST API.

begin;

alter table public.team_members enable row level security;

-- Remove policies that previously exposed full rows to browser clients. RLS
-- remains enabled as a second barrier if table grants are changed later.
drop policy if exists "Public can view published updates" on public.progress_updates;
drop policy if exists "Public can view approved comments" on public.comments;
drop policy if exists "Public can view likes" on public.likes;
drop policy if exists "Anyone can like" on public.likes;
drop policy if exists "Public can view comment reactions" on public.comment_reactions;
drop policy if exists "Anyone can react" on public.comment_reactions;
drop policy if exists "Public can view profiles" on public.profiles;

-- No browser role needs direct access to these tables. Every public read/write
-- is mediated by a validated Next.js server route using the service role.
revoke all privileges on table public.progress_updates from anon, authenticated;
revoke all privileges on table public.comments from anon, authenticated;
revoke all privileges on table public.likes from anon, authenticated;
revoke all privileges on table public.comment_reactions from anon, authenticated;
revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.team_members from anon, authenticated;

-- Apps contain no private fields and remain readable so the authenticated
-- control room can populate its app picker directly. RLS still limits browser
-- clients to published apps.
grant select on table public.apps to anon, authenticated;

commit;
