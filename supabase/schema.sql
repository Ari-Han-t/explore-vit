create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('student', 'mentor', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_provider as enum ('google', 'email');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.allowed_student_email_domains (
  domain text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.allowed_mentor_emails (
  email text primary key,
  full_name text,
  bio text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'student',
  account_provider public.account_provider not null default 'google',
  domain_interest text,
  bio text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists email text;
alter table public.profiles
  add column if not exists full_name text;
alter table public.profiles
  add column if not exists role public.app_role not null default 'student';
alter table public.profiles
  add column if not exists account_provider public.account_provider not null default 'google';
alter table public.profiles
  add column if not exists domain_interest text;
alter table public.profiles
  add column if not exists bio text;
alter table public.profiles
  add column if not exists tags text[] not null default '{}';
alter table public.profiles
  add column if not exists is_active boolean not null default true;
alter table public.profiles
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles
set
  email = coalesce(email, lower(id::text || '@placeholder.local')),
  full_name = coalesce(full_name, split_part(coalesce(email, id::text), '@', 1)),
  role = coalesce(role, 'student'::public.app_role),
  account_provider = coalesce(account_provider, 'google'::public.account_provider),
  tags = coalesce(tags, '{}'::text[]),
  is_active = coalesce(is_active, true)
where
  email is null
  or full_name is null
  or role is null
  or account_provider is null
  or tags is null
  or is_active is null;

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  domain text not null,
  activity_type text not null,
  rating integer not null check (rating between 1 and 5),
  notes text default '',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.reflections
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.reflections
  add column if not exists domain text;
alter table public.reflections
  add column if not exists activity_type text default 'Workshop';
alter table public.reflections
  add column if not exists rating integer;
alter table public.reflections
  add column if not exists notes text default '';
alter table public.reflections
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create table if not exists public.mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  unique (student_id, mentor_id)
);

alter table public.mentor_sessions
  add column if not exists student_id uuid references public.profiles(id) on delete cascade;
alter table public.mentor_sessions
  add column if not exists mentor_id uuid references public.profiles(id) on delete cascade;
alter table public.mentor_sessions
  add column if not exists status text not null default 'active';
alter table public.mentor_sessions
  add column if not exists created_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'mentor_sessions'
      and column_name = 'user_id'
  ) then
    update public.mentor_sessions
    set student_id = coalesce(student_id, user_id)
    where student_id is null;
  end if;
end $$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mentor_bookings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  slot_label text not null,
  status text not null default 'booked',
  created_at timestamptz not null default timezone('utc', now()),
  unique (mentor_id, slot_label)
);

alter table public.messages
  add column if not exists session_id uuid references public.mentor_sessions(id) on delete cascade;
alter table public.messages
  add column if not exists sender_id uuid references public.profiles(id) on delete cascade;
alter table public.messages
  add column if not exists body text;
alter table public.messages
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.mentor_bookings
  add column if not exists mentor_id uuid references public.profiles(id) on delete cascade;
alter table public.mentor_bookings
  add column if not exists student_id uuid references public.profiles(id) on delete cascade;
alter table public.mentor_bookings
  add column if not exists slot_label text;
alter table public.mentor_bookings
  add column if not exists status text not null default 'booked';
alter table public.mentor_bookings
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  mentor_seed record;
  seeded_role public.app_role := 'student';
begin
  select *
  into mentor_seed
  from public.allowed_mentor_emails
  where lower(email) = lower(new.email);

  if mentor_seed.email is not null then
    seeded_role := 'mentor';
  elsif provider_name = 'google' then
    seeded_role := 'student';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    account_provider,
    bio,
    tags,
    is_active
  )
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', mentor_seed.full_name, split_part(new.email, '@', 1)),
    seeded_role,
    case when provider_name = 'google' then 'google'::public.account_provider else 'email'::public.account_provider end,
    coalesce(new.raw_user_meta_data ->> 'bio', mentor_seed.bio),
    coalesce(mentor_seed.tags, '{}'::text[]),
    coalesce(mentor_seed.is_active, true)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    account_provider = excluded.account_provider,
    bio = excluded.bio,
    tags = excluded.tags,
    is_active = excluded.is_active;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create or replace function public.enable_mentor_by_user_id(
  target_user_id uuid,
  mentor_full_name text default null,
  mentor_bio text default null,
  mentor_tags text[] default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user auth.users%rowtype;
  resolved_name text;
  resolved_bio text;
  resolved_tags text[];
  resolved_provider public.account_provider;
  updated_profile public.profiles%rowtype;
begin
  select *
  into auth_user
  from auth.users
  where id = target_user_id;

  if auth_user.id is null then
    raise exception 'No auth user found for id %', target_user_id;
  end if;

  resolved_name := coalesce(
    mentor_full_name,
    auth_user.raw_user_meta_data ->> 'full_name',
    split_part(auth_user.email, '@', 1)
  );
  resolved_bio := coalesce(mentor_bio, auth_user.raw_user_meta_data ->> 'bio');
  resolved_tags := coalesce(mentor_tags, '{}'::text[]);
  resolved_provider := case
    when coalesce(auth_user.raw_app_meta_data ->> 'provider', 'email') = 'google'
      then 'google'::public.account_provider
    else 'email'::public.account_provider
  end;

  insert into public.allowed_mentor_emails (email, full_name, bio, tags, is_active)
  values (lower(auth_user.email), resolved_name, resolved_bio, resolved_tags, true)
  on conflict (email) do update
  set
    full_name = coalesce(excluded.full_name, allowed_mentor_emails.full_name),
    bio = coalesce(excluded.bio, allowed_mentor_emails.bio),
    tags = case
      when coalesce(array_length(excluded.tags, 1), 0) > 0 then excluded.tags
      else allowed_mentor_emails.tags
    end,
    is_active = true;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    account_provider,
    bio,
    tags,
    is_active
  )
  values (
    auth_user.id,
    lower(auth_user.email),
    resolved_name,
    'mentor'::public.app_role,
    resolved_provider,
    resolved_bio,
    resolved_tags,
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = 'mentor'::public.app_role,
    account_provider = excluded.account_provider,
    bio = coalesce(excluded.bio, profiles.bio),
    tags = case
      when coalesce(array_length(excluded.tags, 1), 0) > 0 then excluded.tags
      else profiles.tags
    end,
    is_active = true
  returning * into updated_profile;

  return updated_profile;
end;
$$;

create or replace function public.hook_control_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email_address text := lower(event->'user'->>'email');
  provider_name text := lower(coalesce(event->'user'->'app_metadata'->>'provider', 'email'));
  email_domain text := split_part(email_address, '@', 2);
  is_student_domain_allowed boolean;
  is_mentor_allowed boolean;
begin
  if email_address is null or email_address = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Email is required.',
        'http_code', 400
      )
    );
  end if;

  if provider_name = 'google' then
    select exists (
      select 1
      from public.allowed_student_email_domains
      where lower(domain) = email_domain
    ) into is_student_domain_allowed;

    if is_student_domain_allowed then
      return '{}'::jsonb;
    end if;

    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Only approved VIT student Google accounts can sign in.',
        'http_code', 403
      )
    );
  end if;

  if provider_name = 'email' then
    select exists (
      select 1
      from public.allowed_mentor_emails
      where lower(email) = email_address
        and is_active = true
    ) into is_mentor_allowed;

    if is_mentor_allowed then
      return '{}'::jsonb;
    end if;

    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'This mentor email is not approved for access.',
        'http_code', 403
      )
    );
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Unsupported sign-in provider.',
      'http_code', 403
    )
  );
end;
$$;

grant execute on function public.hook_control_signup(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_control_signup(jsonb) from authenticated, anon, public;

alter table public.profiles enable row level security;
alter table public.reflections enable row level security;
alter table public.mentor_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.mentor_bookings enable row level security;

drop policy if exists "users can view own profile and active mentors" on public.profiles;
create policy "users can view own profile and active mentors"
on public.profiles
for select
using (
  auth.uid() = id
  or (role = 'mentor' and is_active = true)
  or exists (
    select 1
    from public.mentor_sessions
    where (
      mentor_sessions.student_id = auth.uid()
      and mentor_sessions.mentor_id = profiles.id
    ) or (
      mentor_sessions.mentor_id = auth.uid()
      and mentor_sessions.student_id = profiles.id
    )
  )
);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "students insert own reflections" on public.reflections;
create policy "students insert own reflections"
on public.reflections
for insert
with check (auth.uid() = user_id);

drop policy if exists "users manage own reflections" on public.reflections;
create policy "users manage own reflections"
on public.reflections
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.mentor_sessions
    where mentor_sessions.student_id = reflections.user_id
      and mentor_sessions.mentor_id = auth.uid()
  )
);

drop policy if exists "students create sessions for themselves" on public.mentor_sessions;
create policy "students create sessions for themselves"
on public.mentor_sessions
for insert
with check (
  auth.uid() = student_id
  and exists (
    select 1 from public.profiles
    where profiles.id = mentor_id
      and profiles.role = 'mentor'
      and profiles.is_active = true
  )
);

drop policy if exists "participants view their sessions" on public.mentor_sessions;
create policy "participants view their sessions"
on public.mentor_sessions
for select
using (auth.uid() = student_id or auth.uid() = mentor_id);

drop policy if exists "participants update their sessions" on public.mentor_sessions;
create policy "participants update their sessions"
on public.mentor_sessions
for update
using (auth.uid() = student_id or auth.uid() = mentor_id)
with check (auth.uid() = student_id or auth.uid() = mentor_id);

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages"
on public.messages
for select
using (
  exists (
    select 1
    from public.mentor_sessions
    where mentor_sessions.id = session_id
      and (mentor_sessions.student_id = auth.uid() or mentor_sessions.mentor_id = auth.uid())
  )
);

drop policy if exists "participants send messages as themselves" on public.messages;
create policy "participants send messages as themselves"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.mentor_sessions
    where mentor_sessions.id = session_id
      and (mentor_sessions.student_id = auth.uid() or mentor_sessions.mentor_id = auth.uid())
  )
);

drop policy if exists "participants view bookings" on public.mentor_bookings;
create policy "participants view bookings"
on public.mentor_bookings
for select
using (auth.uid() = student_id or auth.uid() = mentor_id);

drop policy if exists "students book mentor slots" on public.mentor_bookings;
create policy "students book mentor slots"
on public.mentor_bookings
for insert
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = mentor_id
      and profiles.role = 'mentor'
      and profiles.is_active = true
  )
);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.mentor_sessions;
exception
  when duplicate_object then null;
end $$;
