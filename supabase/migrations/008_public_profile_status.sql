-- Public owner/team status fields managed manually from the control room.
begin;
alter table public.profiles add column if not exists status_text text check (char_length(status_text) <= 80);
alter table public.profiles add column if not exists status_kind text not null default 'offline' check (status_kind in ('online','building','focus','away','offline'));
alter table public.profiles add column if not exists activity_text text check (char_length(activity_text) <= 120);
alter table public.profiles add column if not exists status_updated_at timestamptz;
commit;
