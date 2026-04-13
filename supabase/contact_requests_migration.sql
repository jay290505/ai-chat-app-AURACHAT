-- One-time migration for contact request flow.
-- Safe to run multiple times.

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint contact_requests_no_self check (requester_id <> target_id),
  constraint contact_requests_unique_pair unique (requester_id, target_id)
);

alter table public.contact_requests enable row level security;

create index if not exists contact_requests_requester_idx on public.contact_requests (requester_id);
create index if not exists contact_requests_target_idx on public.contact_requests (target_id);
create index if not exists contact_requests_status_idx on public.contact_requests (status);

drop policy if exists "Users can view own contact requests" on public.contact_requests;
create policy "Users can view own contact requests"
  on public.contact_requests
  for select
  using (requester_id = auth.uid() or target_id = auth.uid());

drop policy if exists "Users can create outgoing requests" on public.contact_requests;
create policy "Users can create outgoing requests"
  on public.contact_requests
  for insert
  with check (
    requester_id = auth.uid()
    and target_id <> auth.uid()
    and status = 'pending'
  );

drop policy if exists "Requester can cancel pending request" on public.contact_requests;
create policy "Requester can cancel pending request"
  on public.contact_requests
  for update
  using (requester_id = auth.uid() and status = 'pending')
  with check (
    requester_id = auth.uid()
    and target_id <> auth.uid()
    and status in ('cancelled', 'pending')
  );

drop policy if exists "Target can accept or reject request" on public.contact_requests;
create policy "Target can accept or reject request"
  on public.contact_requests
  for update
  using (target_id = auth.uid() and status = 'pending')
  with check (
    target_id = auth.uid()
    and status in ('accepted', 'rejected', 'pending')
  );

do $$
begin
  alter publication supabase_realtime add table public.contact_requests;
exception
  when duplicate_object then null;
end$$;
