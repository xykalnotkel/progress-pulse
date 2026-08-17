-- Durable abuse controls for public write APIs.
-- Replaces per-process Maps, which reset whenever a serverless instance changes.

begin;

alter table public.likes
  add column if not exists visitor_hash text;

alter table public.comment_reactions
  add column if not exists visitor_hash text;

-- Existing rows remain valid with NULL hashes. New API writes always include a
-- keyed hash, making each browser identity additive only once per target.
create unique index if not exists likes_update_visitor_unique_idx
  on public.likes(update_id, visitor_hash)
  where visitor_hash is not null;

create unique index if not exists reactions_comment_kind_visitor_unique_idx
  on public.comment_reactions(comment_id, reaction, visitor_hash)
  where visitor_hash is not null;

create table if not exists public.api_rate_limits (
  key_hash text not null,
  action text not null,
  window_start timestamptz not null,
  hits integer not null default 1 check (hits > 0),
  expires_at timestamptz not null,
  primary key (key_hash, action, window_start)
);

create index if not exists api_rate_limits_expires_idx
  on public.api_rate_limits(expires_at);

alter table public.api_rate_limits enable row level security;
revoke all privileges on table public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid rate-limit key';
  end if;
  if p_action !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid rate-limit action';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate-limit maximum';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit window';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits as limits (
    key_hash,
    action,
    window_start,
    hits,
    expires_at
  )
  values (
    p_key_hash,
    p_action,
    v_window_start,
    1,
    v_window_start + make_interval(secs => p_window_seconds * 2)
  )
  on conflict (key_hash, action, window_start)
  do update set
    hits = limits.hits + 1,
    expires_at = greatest(limits.expires_at, excluded.expires_at)
  returning hits into v_hits;

  -- Keep the table bounded without requiring an external cron job. Cleanup is
  -- indexed and only touches expired windows.
  delete from public.api_rate_limits where expires_at < v_now;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

commit;
