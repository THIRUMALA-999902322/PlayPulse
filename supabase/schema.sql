-- =============================================================================
-- PlayPulse — full database schema
-- Paste into the Supabase SQL editor to recreate the backend from scratch.
-- =============================================================================

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique,
  email             text,
  full_name         text,
  bio               text,
  matches_played    int  not null default 0,
  reliability_score int  not null default 100,
  public_portfolio  boolean not null default true,
  public_posts      boolean not null default false,
  show_location     boolean not null default true,
  created_at        timestamptz not null default now()
);

-- A profile row must exist even when signup returns no session (email
-- confirmation flows), so it is created by a trigger rather than by the client.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Leagues ──────────────────────────────────────────────────────────────────
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  emoji      text not null default '🏆',
  sport      text not null,
  season     text,
  members    int  not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.league_teams (
  id        uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_name text not null,
  played    int not null default 0,
  won       int not null default 0,
  lost      int not null default 0,
  points    int not null default 0
);

create table if not exists public.league_fixtures (
  id           uuid primary key default gen_random_uuid(),
  league_id    uuid not null references public.leagues(id) on delete cascade,
  home_team    text not null,
  away_team    text not null,
  fixture_time timestamptz,
  venue        text
);

-- ── Matches ──────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'pickup',   -- pickup | league | practice
  sport          text not null,
  title          text not null,
  location       text not null,
  lat            double precision,
  lng            double precision,
  match_time     timestamptz not null,
  players_max    int  not null default 10,
  players_joined int  not null default 0,
  status         text not null default 'open',     -- open | soon | live | full | cancelled | practice
  skill          text not null default 'All levels',
  match_type     text default 'Friendly',
  rules          text,
  gear_needed    text[] default '{}',
  approval_mode  boolean not null default false,
  privacy        text not null default 'Public',
  recurrence     text not null default 'Once',
  stream_url     text,
  league_id      uuid references public.leagues(id) on delete set null,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  -- Seeded demo rows carry how far ahead of "now" they should sit, so a nightly
  -- job can re-anchor them. Player-created matches leave both at the default.
  is_demo        boolean not null default false,
  demo_offset    interval
);

create index if not exists matches_time_idx on public.matches (match_time);

-- user_id points at profiles (not auth.users) so PostgREST can resolve
-- `profiles(...)` embeds; profiles already cascades from auth.users.
create table if not exists public.match_players (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'joined',     -- joined | approved | pending
  checkin_step int  not null default 1,
  joined_at    timestamptz not null default now(),
  unique (match_id, user_id)
);

-- Scores are text rather than numeric so one shape covers every sport:
-- "112/3" for cricket, "2" for football. `detail` carries the qualifier
-- ("7.4 overs", "half time") and stays null when a sport has none.
create table if not exists public.match_teams (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  position   int  not null default 1,          -- 1 = first side, 2 = second side
  name       text not null,
  score      text not null default '',
  detail     text,
  updated_at timestamptz not null default now(),
  unique (match_id, position)
);

-- ── Chat & commentary ────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  channel    text not null default 'match',        -- match | team
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_match_idx on public.messages (match_id, channel, created_at);

create table if not exists public.commentary (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  over_label text not null,
  kind       text not null default 'normal',       -- normal | four | six | wicket
  headline   text,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ── Fundraising ──────────────────────────────────────────────────────────────
create table if not exists public.fundraisers (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches(id) on delete cascade,
  title      text not null,
  cause      text,
  goal       numeric(10,2) not null default 100,
  raised     numeric(10,2) not null default 0,
  donors     int not null default 0,
  ends_at    timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id            uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,
  amount        numeric(10,2) not null,
  created_at    timestamptz not null default now()
);

-- ── Portfolio ────────────────────────────────────────────────────────────────
create table if not exists public.player_stats (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport   text not null,
  mode    text not null default 'official',        -- official | practice
  summary text,
  stats   jsonb not null default '[]'::jsonb,
  unique (user_id, sport, mode)
);

create table if not exists public.achievements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  icon       text not null default '🏅',
  title      text not null,
  subtitle   text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_history (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji   text not null default '🏅',
  team    text not null,
  role    text,
  span    text
);

-- =============================================================================
-- Row level security — everything is publicly readable (that is the product);
-- writes are limited to the signed-in owner, or the organiser where relevant.
-- =============================================================================
alter table public.profiles        enable row level security;
alter table public.leagues         enable row level security;
alter table public.league_teams    enable row level security;
alter table public.league_fixtures enable row level security;
alter table public.matches         enable row level security;
alter table public.match_players   enable row level security;
alter table public.match_teams     enable row level security;
alter table public.messages        enable row level security;
alter table public.commentary      enable row level security;
alter table public.fundraisers     enable row level security;
alter table public.donations       enable row level security;
alter table public.player_stats    enable row level security;
alter table public.achievements    enable row level security;
alter table public.team_history    enable row level security;

create policy "read_all" on public.profiles        for select using (true);
create policy "read_all" on public.leagues         for select using (true);
create policy "read_all" on public.league_teams    for select using (true);
create policy "read_all" on public.league_fixtures for select using (true);
create policy "read_all" on public.matches         for select using (true);
create policy "read_all" on public.match_players   for select using (true);
create policy "read_all" on public.match_teams     for select using (true);
create policy "read_all" on public.messages        for select using (true);
create policy "read_all" on public.commentary      for select using (true);
create policy "read_all" on public.fundraisers     for select using (true);
create policy "read_all" on public.donations       for select using (true);
create policy "read_all" on public.player_stats    for select using (true);
create policy "read_all" on public.achievements    for select using (true);
create policy "read_all" on public.team_history    for select using (true);

create policy "own_update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "auth_insert" on public.matches
  for insert to authenticated with check (auth.uid() = created_by);
create policy "creator_update" on public.matches
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "creator_delete" on public.matches
  for delete to authenticated using (auth.uid() = created_by);

create policy "own_insert" on public.match_players
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own_or_organiser_update" on public.match_players
  for update to authenticated using (
    auth.uid() = user_id
    or exists (select 1 from public.matches m where m.id = match_id and m.created_by = auth.uid())
  );
create policy "own_delete" on public.match_players
  for delete to authenticated using (auth.uid() = user_id);

create policy "own_insert" on public.messages
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own_delete" on public.messages
  for delete to authenticated using (auth.uid() = user_id);

create policy "organiser_write" on public.match_teams
  for all to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and m.created_by = auth.uid()))
  with check (exists (select 1 from public.matches m where m.id = match_id and m.created_by = auth.uid()));

create policy "organiser_insert" on public.commentary
  for insert to authenticated with check (
    exists (select 1 from public.matches m where m.id = match_id and m.created_by = auth.uid())
  );

create policy "auth_insert" on public.leagues
  for insert to authenticated with check (auth.uid() = created_by);
create policy "creator_update" on public.leagues
  for update to authenticated using (auth.uid() = created_by);
create policy "auth_write" on public.league_teams
  for all to authenticated using (
    exists (select 1 from public.leagues l where l.id = league_id and l.created_by = auth.uid())
  );
create policy "auth_write" on public.league_fixtures
  for all to authenticated using (
    exists (select 1 from public.leagues l where l.id = league_id and l.created_by = auth.uid())
  );

create policy "auth_insert" on public.fundraisers
  for insert to authenticated with check (auth.uid() = created_by);
create policy "creator_update" on public.fundraisers
  for update to authenticated using (auth.uid() = created_by);
create policy "own_insert" on public.donations
  for insert to authenticated with check (auth.uid() = user_id);

create policy "own_write" on public.player_stats
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_write" on public.achievements
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_write" on public.team_history
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- Actions that touch two tables live here, so a dropped round-trip can never
-- leave a roster row without its matching counter.
-- =============================================================================
create or replace function public.join_match(p_match_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_inserted boolean := false;
  v_match public.matches%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in to join a match' using errcode = '28000';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;
  if v_match.status = 'cancelled' then
    raise exception 'This match was cancelled' using errcode = 'P0001';
  end if;

  insert into public.match_players (match_id, user_id, status)
  values (p_match_id, v_user, case when v_match.approval_mode then 'pending' else 'approved' end)
  on conflict (match_id, user_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted then
    if v_match.players_joined >= v_match.players_max then
      raise exception 'This match is already full' using errcode = 'P0001';
    end if;

    update public.matches
       set players_joined = players_joined + 1,
           status = case when players_joined + 1 >= players_max then 'full' else status end
     where id = p_match_id
     returning * into v_match;

    update public.profiles set matches_played = matches_played + 1 where id = v_user;
  end if;

  return json_build_object(
    'joined', true, 'players', v_match.players_joined,
    'max', v_match.players_max, 'status', v_match.status, 'pending', v_match.approval_mode
  );
end;
$$;

create or replace function public.leave_match(p_match_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_removed int := 0;
  v_match public.matches%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;

  delete from public.match_players where match_id = p_match_id and user_id = v_user;
  get diagnostics v_removed = row_count;

  if v_removed > 0 then
    update public.matches
       set players_joined = greatest(players_joined - 1, 0),
           status = case when status = 'full' then 'open' else status end
     where id = p_match_id
     returning * into v_match;

    update public.profiles set matches_played = greatest(matches_played - 1, 0) where id = v_user;
  else
    select * into v_match from public.matches where id = p_match_id;
  end if;

  return json_build_object(
    'joined', false, 'players', v_match.players_joined,
    'max', v_match.players_max, 'status', v_match.status
  );
end;
$$;

create or replace function public.set_checkin_step(p_match_id uuid, p_step int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_step int;
begin
  if v_user is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;

  insert into public.match_players (match_id, user_id, checkin_step)
  values (p_match_id, v_user, greatest(p_step, 0))
  on conflict (match_id, user_id)
    do update set checkin_step = greatest(excluded.checkin_step, 0)
  returning checkin_step into v_step;

  return json_build_object('step', v_step);
end;
$$;

create or replace function public.approve_player(p_match_id uuid, p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  if not exists (select 1 from public.matches where id = p_match_id and created_by = v_user) then
    raise exception 'Only the organiser can approve players' using errcode = '42501';
  end if;

  update public.match_players set status = 'approved'
   where match_id = p_match_id and user_id = p_user_id;

  return json_build_object('approved', true);
end;
$$;

create or replace function public.donate_to_fundraiser(p_fundraiser_id uuid, p_amount numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_fund public.fundraisers%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in to donate' using errcode = '28000';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter an amount greater than zero' using errcode = 'P0001';
  end if;

  insert into public.donations (fundraiser_id, user_id, amount)
  values (p_fundraiser_id, v_user, p_amount);

  update public.fundraisers
     set raised = raised + p_amount, donors = donors + 1
   where id = p_fundraiser_id
   returning * into v_fund;

  if not found then
    raise exception 'Fundraiser not found' using errcode = 'P0002';
  end if;

  return json_build_object('raised', v_fund.raised, 'goal', v_fund.goal, 'donors', v_fund.donors);
end;
$$;

grant execute on function public.join_match(uuid)                    to authenticated;
grant execute on function public.leave_match(uuid)                   to authenticated;
grant execute on function public.set_checkin_step(uuid, int)         to authenticated;
grant execute on function public.approve_player(uuid, uuid)          to authenticated;
grant execute on function public.donate_to_fundraiser(uuid, numeric) to authenticated;

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.match_players;
alter publication supabase_realtime add table public.fundraisers;
alter publication supabase_realtime add table public.match_teams;

-- =============================================================================
-- Demo board upkeep. Fixed seed timestamps go stale within hours and leave a
-- first-time visitor looking at a board of finished games, so the demo rows are
-- re-anchored nightly. Only rows with is_demo = true are touched.
-- =============================================================================
create or replace function public.refresh_demo_board()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches
     set match_time = now() + coalesce(demo_offset, interval '2 hours')
   where is_demo;

  update public.league_fixtures
     set fixture_time = now() + interval '2 days'
   where fixture_time is null or fixture_time < now();

  update public.commentary
     set created_at = now() - (interval '1 minute' * (row_number_seq - 1))
    from (
      select id, row_number() over (order by over_label desc) as row_number_seq
        from public.commentary
    ) ranked
   where public.commentary.id = ranked.id;
end;
$$;

revoke all on function public.refresh_demo_board() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.unschedule('refresh-playpulse-demo')
 where exists (select 1 from cron.job where jobname = 'refresh-playpulse-demo');

select cron.schedule(
  'refresh-playpulse-demo',
  '0 3 * * *',
  $$select public.refresh_demo_board()$$
);
