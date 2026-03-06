-- =============================================
-- PlayPulse Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  location text,
  reliability_score integer default 100,
  matches_played integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);


-- 2. Matches
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  sport text not null,
  title text not null,
  location text not null,
  match_time timestamptz not null,
  players_max integer default 10,
  players_joined integer default 0,
  match_type text default 'Friendly',
  rules text,
  gear_needed text[],
  approval_mode boolean default false,
  privacy text default 'Public',
  status text default 'open',  -- open | soon | live | full | completed
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table matches enable row level security;

create policy "Matches are viewable by everyone"
  on matches for select using (true);

create policy "Authenticated users can create matches"
  on matches for insert with check (auth.role() = 'authenticated');

create policy "Match creators can update their matches"
  on matches for update using (auth.uid() = created_by);


-- 3. Match Players (who joined what match)
create table if not exists match_players (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'joined',   -- joined | approved | checked_in | no_show
  joined_at timestamptz default now(),
  unique(match_id, user_id)
);

alter table match_players enable row level security;

create policy "Match players visible to all"
  on match_players for select using (true);

create policy "Authenticated users can join matches"
  on match_players for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own match status"
  on match_players for update using (auth.uid() = user_id);


-- 4. Leagues
create table if not exists leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sport text not null,
  emoji text default '🏆',
  description text,
  members integer default 0,
  total_matches integer default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table leagues enable row level security;

create policy "Leagues viewable by everyone"
  on leagues for select using (true);

create policy "Authenticated users can create leagues"
  on leagues for insert with check (auth.role() = 'authenticated');


-- 5. Messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  chat_type text default 'match',   -- match | team
  content text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Messages viewable by authenticated users"
  on messages for select using (auth.role() = 'authenticated');

create policy "Authenticated users can send messages"
  on messages for insert with check (auth.role() = 'authenticated');


-- 6. Fundraisers
create table if not exists fundraisers (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  title text not null,
  cause text,
  goal_amount numeric(10,2) not null,
  raised_amount numeric(10,2) default 0,
  created_by uuid references profiles(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table fundraisers enable row level security;

create policy "Fundraisers viewable by everyone"
  on fundraisers for select using (true);

create policy "Authenticated users can create fundraisers"
  on fundraisers for insert with check (auth.role() = 'authenticated');


-- =============================================
-- Seed Data (optional - for testing)
-- =============================================

insert into matches (sport, title, location, match_time, players_max, players_joined, status, match_type)
values
  ('Cricket', 'Evening T10 at Westside Ground', 'Westside Community Ground', now() + interval '2 hours', 14, 12, 'open', 'Friendly'),
  ('Football', 'Sunday 5-a-side — Need 2 players', 'Central Park Pitch 3', now() + interval '3 hours', 10, 8, 'open', 'Friendly'),
  ('Basketball', '3v3 Pickup — Main Court', 'Campus Sports Complex', now() + interval '4 hours', 6, 4, 'soon', 'Practice'),
  ('Badminton', 'Mixed Doubles — Hall B', 'Union Sports Hall', now() + interval '24 hours', 4, 4, 'full', 'Friendly')
on conflict do nothing;

insert into leagues (name, sport, emoji, members, total_matches)
values
  ('Campus T20 League', 'Cricket', '🏏', 48, 12),
  ('Sunday Football Cup', 'Football', '⚽', 30, 8),
  ('Hoop Kings 3v3', 'Basketball', '🏀', 18, 6)
on conflict do nothing;
