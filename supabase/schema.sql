-- ============================================================
-- Reels RA - Base Schema
-- Run this FIRST in Supabase SQL Editor (Project > SQL Editor > New query)
-- Then run feed-migration.sql
-- ============================================================

-- 1. PROFILES ----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  followers_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Admin role. Existing users remain normal users.
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user','admin'));

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up (Register page sends
-- username/display_name in auth.signUp options.data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. REELS ---------------------------------------------------------
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  video_url text,
  thumbnail_url text,
  status text not null default 'published' check (status in ('draft','published','removed')),
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.reels enable row level security;

drop policy if exists "published reels are viewable by everyone" on public.reels;
create policy "published reels are viewable by everyone"
  on public.reels for select
  using (status = 'published' or creator_id = auth.uid());

drop policy if exists "users can insert their own reels" on public.reels;
create policy "users can insert their own reels"
  on public.reels for insert
  with check (auth.uid() = creator_id);

drop policy if exists "users can update their own reels" on public.reels;
create policy "users can update their own reels"
  on public.reels for update
  using (auth.uid() = creator_id);

drop policy if exists "users can delete their own reels" on public.reels;
create policy "users can delete their own reels"
  on public.reels for delete
  using (auth.uid() = creator_id);

-- 3. LIKES ---------------------------------------------------------
create table if not exists public.reel_likes (
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

alter table public.reel_likes enable row level security;

drop policy if exists "likes are viewable by everyone" on public.reel_likes;
create policy "likes are viewable by everyone"
  on public.reel_likes for select using (true);

drop policy if exists "users can like as themselves" on public.reel_likes;
create policy "users can like as themselves"
  on public.reel_likes for insert with check (auth.uid() = user_id);

drop policy if exists "users can unlike their own like" on public.reel_likes;
create policy "users can unlike their own like"
  on public.reel_likes for delete using (auth.uid() = user_id);

-- 4. COMMENTS --------------------------------------------------------
create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.reel_comments enable row level security;

drop policy if exists "comments are viewable by everyone" on public.reel_comments;
create policy "comments are viewable by everyone"
  on public.reel_comments for select using (true);

drop policy if exists "users can comment as themselves" on public.reel_comments;
create policy "users can comment as themselves"
  on public.reel_comments for insert with check (auth.uid() = user_id);

-- (the "own comments delete" policy is added by feed-migration.sql)

-- 5. FOLLOWS -----------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "follows are viewable by everyone" on public.follows;
create policy "follows are viewable by everyone"
  on public.follows for select using (true);

drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "users can unfollow as themselves" on public.follows;
create policy "users can unfollow as themselves"
  on public.follows for delete using (auth.uid() = follower_id);

-- 6. STORAGE BUCKET FOR REEL VIDEOS -------------------------------
insert into storage.buckets (id, name, public)
values ('reel-media', 'reel-media', true)
on conflict (id) do nothing;

drop policy if exists "public read access to reel media" on storage.objects;
create policy "public read access to reel media"
  on storage.objects for select
  using (bucket_id = 'reel-media');

drop policy if exists "authenticated users can upload their own reel media" on storage.objects;
create policy "authenticated users can upload their own reel media"
  on storage.objects for insert
  with check (
    bucket_id = 'reel-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- AFTER creating your admin user in Supabase Authentication, run ONE of these:
-- 1) Recommended: replace the email below and run:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL'));
--
-- 2) Or set the Render/Vercel environment variable VITE_ADMIN_EMAIL to the
-- admin email. The database role is still recommended for long-term security.
