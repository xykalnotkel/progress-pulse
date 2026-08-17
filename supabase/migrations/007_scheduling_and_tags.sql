-- Scheduled publication and public tags for progress updates.

begin;

alter table public.progress_updates
  add column if not exists scheduled_for timestamptz;

alter table public.progress_updates
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.progress_updates
  drop constraint if exists progress_updates_tags_limit;
alter table public.progress_updates
  add constraint progress_updates_tags_limit check (cardinality(tags) <= 10);

create index if not exists progress_updates_schedule_idx
  on public.progress_updates(scheduled_for)
  where scheduled_for is not null;

create index if not exists progress_updates_tags_idx
  on public.progress_updates using gin(tags);

commit;
