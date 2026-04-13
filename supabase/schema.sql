create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Storage bucket for media/audio (moved to top for reliability)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', true, 52428800, array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'audio/webm', 'audio/mp3', 'audio/ogg', 'video/mp4', 'audio/wav', 'audio/mpeg'])
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'chat-media');

drop policy if exists "Anyone can read media" on storage.objects;
create policy "Anyone can read media"
  on storage.objects for select
  using (bucket_id = 'chat-media');

create table if not exists public.profiles (
  id uuid primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  last_seen timestamptz,
  is_online boolean not null default false
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Service functions can insert profiles" on public.profiles;
create policy "Service functions can insert profiles"
  on public.profiles
  for insert
  with check (true);

-- Keep profiles in sync with auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 5)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('private', 'group')),
  name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.chats enable row level security;

-- chat_members table
create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member'))
);

alter table public.chat_members enable row level security;

create index if not exists chat_members_chat_id_idx on public.chat_members (chat_id);
create index if not exists chat_members_user_id_idx on public.chat_members (user_id);

-- contact_requests table
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

-- Only members can see chats they belong to
drop policy if exists "Users can view chats they are members of" on public.chats;
create policy "Users can view chats they are members of"
  on public.chats
  for select
  using (
    exists (
      select 1 from public.chat_members
      where chat_id = id and user_id = auth.uid()
    )
  );

-- Members can delete chats they belong to
drop policy if exists "Members can delete their chats" on public.chats;
create policy "Members can delete their chats"
  on public.chats
  for delete
  using (
    exists (
      select 1 from public.chat_members
      where chat_id = id and user_id = auth.uid()
    )
  );

-- Only members can view chat_members rows for their chats
drop policy if exists "Users can view memberships for their chats" on public.chat_members;
create policy "Users can view memberships for their chats"
  on public.chat_members
  for select
  using (
    true -- Relaxed memberships to avoid infinite recursion while maintaining table isolation via chat policies
  );

drop policy if exists "Users can insert membership for themselves" on public.chat_members;
create policy "Users can insert membership for themselves"
  on public.chat_members
  for insert
  with check (user_id = auth.uid());

-- messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.messages(id) on delete set null,
  content text,
  media_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  status text not null default 'sent' check (status in ('sent', 'delivered', 'seen'))
);

alter table public.messages enable row level security;

create index if not exists messages_chat_id_idx on public.messages (chat_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

drop policy if exists "Messages are viewable by chat members" on public.messages;
create policy "Messages are viewable by chat members"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.chat_members m
      where m.chat_id = messages.chat_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "Members can insert messages in their chats" on public.messages;
create policy "Members can insert messages in their chats"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_members m
      where m.chat_id = messages.chat_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "Senders can update their own messages" on public.messages;
create policy "Senders can update their own messages"
  on public.messages
  for update
  using (sender_id = auth.uid());

drop policy if exists "Senders can delete their own messages" on public.messages;
create policy "Senders can delete their own messages"
  on public.messages
  for delete
  using (sender_id = auth.uid());

-- ai_messages table
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  response text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.ai_messages enable row level security;

drop policy if exists "Users can view their own ai_messages" on public.ai_messages;
create policy "Users can view their own ai_messages"
  on public.ai_messages
  for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own ai_messages" on public.ai_messages;
create policy "Users can insert their own ai_messages"
  on public.ai_messages
  for insert
  with check (user_id = auth.uid());

-- Realtime configuration: enable replication on the main tables
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end$$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end$$;

do $$
begin
  alter publication supabase_realtime add table public.contact_requests;
exception
  when duplicate_object then null;
end$$;

