-- Dashain Tihar Quiz
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Then set a host password:
--   update public.settings set host_password = 'a-long-secret' where id = 1;
--
-- Players never read the questions table. The anon key can only call the
-- functions below. Correct answers stay on the server until reveal.

create schema if not exists private;

create table if not exists public.settings (
  id int primary key check (id = 1),
  host_password text not null
);

insert into public.settings (id, host_password)
values (1, 'change-me')
on conflict (id) do nothing;

comment on table public.settings is
  'One row. Change host_password before the event.';

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  pin text not null unique,
  host_token text not null unique,
  title text not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'question', 'reveal', 'leaderboard', 'finished')),
  question_index int not null default 0 check (question_index >= 0),
  question_started_at timestamptz,
  question_duration_ms int,
  questions jsonb not null,
  revision int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  nickname text not null,
  nickname_key text not null,
  player_token text not null unique,
  score int not null default 0 check (score >= 0),
  joined_at timestamptz not null default now(),
  unique (game_id, nickname_key)
);

create index if not exists players_game_id_idx on public.players (game_id);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  question_index int not null check (question_index >= 0),
  choice int not null check (choice >= 0 and choice <= 3),
  response_ms int not null check (response_ms >= 0),
  correct boolean not null,
  points int not null check (points >= 0),
  created_at timestamptz not null default now(),
  unique (player_id, question_index)
);

create index if not exists answers_game_question_idx
  on public.answers (game_id, question_index);

alter table public.settings enable row level security;
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

revoke all on table public.settings from anon, authenticated;
revoke all on table public.games from anon, authenticated;
revoke all on table public.players from anon, authenticated;
revoke all on table public.answers from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal snapshots. Not exposed through the API.
-- ---------------------------------------------------------------------------

create or replace function private.build_host_snapshot(p_game_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g public.games%rowtype;
  v_q jsonb;
  v_question jsonb;
  v_choice_count int := 0;
  v_ends timestamptz;
  v_correct_index int;
  v_counts jsonb := '[]'::jsonb;
  v_answered int := 0;
  v_names jsonb := '[]'::jsonb;
  v_top jsonb := '[]'::jsonb;
  v_player_count int := 0;
  v_i int;
  v_n int;
begin
  select * into g from public.games where id = p_game_id;
  if not found then
    raise exception 'Host session not found';
  end if;

  if g.status in ('question', 'reveal', 'leaderboard')
     and g.question_index < jsonb_array_length(g.questions) then
    v_q := g.questions -> g.question_index;
    v_choice_count := jsonb_array_length(v_q -> 'choices');
    v_question := jsonb_build_object(
      'prompt', v_q ->> 'prompt',
      'choices', v_q -> 'choices',
      'seconds', coalesce((v_q ->> 'seconds')::int, 20)
    );
  end if;

  if g.status = 'question'
     and g.question_started_at is not null
     and g.question_duration_ms is not null then
    v_ends := g.question_started_at + (g.question_duration_ms * interval '1 millisecond');
  end if;

  if g.status in ('reveal', 'leaderboard') and v_q is not null then
    v_correct_index := (v_q ->> 'correct')::int;
  end if;

  if v_choice_count > 0 then
    select count(*)::int into v_answered
    from public.answers
    where game_id = g.id and question_index = g.question_index;

    if g.status in ('reveal', 'leaderboard') then
      for v_i in 0 .. v_choice_count - 1 loop
        select count(*)::int into v_n
        from public.answers
        where game_id = g.id
          and question_index = g.question_index
          and choice = v_i;
        v_counts := v_counts || jsonb_build_array(v_n);
      end loop;
    end if;
  end if;

  select count(*)::int into v_player_count
  from public.players
  where game_id = g.id;

  select coalesce(jsonb_agg(to_jsonb(name) order by joined), '[]'::jsonb)
    into v_names
  from (
    select nickname as name, joined_at as joined
    from public.players
    where game_id = g.id
  ) people;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'nickname', nickname,
        'score', score,
        'rank', place
      )
      order by place
    ),
    '[]'::jsonb
  )
    into v_top
  from (
    select
      nickname,
      score,
      (rank() over (order by score desc, joined_at asc))::int as place
    from public.players
    where game_id = g.id
    order by score desc, joined_at asc
    limit 10
  ) standings;

  return jsonb_build_object(
    'pin', g.pin,
    'title', g.title,
    'status', g.status,
    'questionIndex', g.question_index,
    'questionCount', jsonb_array_length(g.questions),
    'endsAt', v_ends,
    'serverNow', clock_timestamp(),
    'durationMs', case when g.status = 'question' then g.question_duration_ms else null end,
    'choiceCount', v_choice_count,
    'playerCount', v_player_count,
    'nicknames', v_names,
    'question', v_question,
    'correctIndex', v_correct_index,
    'answerCounts', v_counts,
    'answeredCount', v_answered,
    'top', v_top,
    'revision', g.revision
  );
end;
$$;

create or replace function private.build_public_state(p_player_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  p public.players%rowtype;
  g public.games%rowtype;
  v_q jsonb;
  v_choice_count int := 0;
  v_ends timestamptz;
  v_has_answer boolean := false;
  v_choice int;
  v_correct boolean;
  v_points int;
  v_score int;
  v_rank int;
  v_player_count int := 0;
  v_correct_index int;
begin
  select * into p from public.players where id = p_player_id;
  if not found then
    raise exception 'Player not found';
  end if;

  select * into g from public.games where id = p.game_id;
  if not found then
    raise exception 'Player not found';
  end if;

  if g.status in ('question', 'reveal', 'leaderboard')
     and g.question_index < jsonb_array_length(g.questions) then
    v_q := g.questions -> g.question_index;
    v_choice_count := jsonb_array_length(v_q -> 'choices');
  end if;

  if g.status = 'question'
     and g.question_started_at is not null
     and g.question_duration_ms is not null then
    v_ends := g.question_started_at + (g.question_duration_ms * interval '1 millisecond');
  end if;

  select choice, correct, points
    into v_choice, v_correct, v_points
  from public.answers
  where player_id = p.id and question_index = g.question_index;
  v_has_answer := found;

  -- Hide points earned on the current question until reveal, so a score
  -- change cannot tell the player whether they were right.
  v_score := p.score;
  if g.status = 'question' and v_has_answer then
    v_score := p.score - v_points;
  end if;

  select count(*)::int into v_player_count
  from public.players
  where game_id = g.id;

  if g.status in ('leaderboard', 'finished') then
    select place into v_rank
    from (
      select
        id,
        (rank() over (order by score desc, joined_at asc))::int as place
      from public.players
      where game_id = g.id
    ) ranked
    where id = p.id;
  end if;

  if g.status in ('reveal', 'leaderboard') and v_q is not null then
    v_correct_index := (v_q ->> 'correct')::int;
  end if;

  return jsonb_build_object(
    'phase', g.status,
    'title', g.title,
    'pin', g.pin,
    'nickname', p.nickname,
    'questionIndex', g.question_index,
    'questionCount', jsonb_array_length(g.questions),
    'endsAt', v_ends,
    'serverNow', clock_timestamp(),
    'durationMs', case when g.status = 'question' then g.question_duration_ms else null end,
    'choiceCount', v_choice_count,
    'answered', v_has_answer and g.status in ('question', 'reveal', 'leaderboard'),
    'yourChoice', case
      when v_has_answer and g.status in ('question', 'reveal', 'leaderboard') then v_choice
      else null
    end,
    'correct', case
      when g.status in ('reveal', 'leaderboard') then coalesce(v_correct, false)
      else null
    end,
    'pointsEarned', case
      when g.status in ('reveal', 'leaderboard') then coalesce(v_points, 0)
      else null
    end,
    'correctIndex', v_correct_index,
    'score', v_score,
    'rank', v_rank,
    'playerCount', v_player_count,
    'revision', g.revision
  );
end;
$$;

revoke all on function private.build_host_snapshot(uuid) from public;
revoke all on function private.build_public_state(uuid) from public;

-- ---------------------------------------------------------------------------
-- API
-- ---------------------------------------------------------------------------

create or replace function public.create_game(p_password text, p_questions jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_expected text;
  v_title text;
  v_questions jsonb;
  v_item jsonb;
  v_clean jsonb;
  v_choices jsonb;
  v_choice text;
  v_i int;
  v_c int;
  v_len int;
  v_choice_count int;
  v_correct int;
  v_seconds int;
  v_pin text;
  v_token text;
  v_id uuid;
  v_try int;
begin
  select host_password into v_expected from public.settings where id = 1;
  if v_expected is null or p_password is distinct from v_expected then
    raise exception 'Wrong host password';
  end if;

  if octet_length(p_questions::text) > 100000 then
    raise exception 'That quiz file is too large';
  end if;

  if jsonb_typeof(p_questions) = 'object' and p_questions ? 'questions' then
    v_title := coalesce(nullif(trim(p_questions ->> 'title'), ''), 'Dashain Tihar Quiz');
    v_questions := p_questions -> 'questions';
  elsif jsonb_typeof(p_questions) = 'array' then
    v_title := 'Dashain Tihar Quiz';
    v_questions := p_questions;
  else
    raise exception 'Questions must be a JSON object with a questions array';
  end if;

  v_title := left(v_title, 80);

  if jsonb_typeof(v_questions) <> 'array' or jsonb_array_length(v_questions) < 1 then
    raise exception 'Add at least one question';
  end if;

  if jsonb_array_length(v_questions) > 100 then
    raise exception 'A quiz can have at most 100 questions';
  end if;

  v_len := jsonb_array_length(v_questions);
  for v_i in 0 .. v_len - 1 loop
    v_item := v_questions -> v_i;
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Question % is not an object', v_i + 1;
    end if;
    if jsonb_typeof(v_item -> 'prompt') <> 'string'
       or nullif(trim(v_item ->> 'prompt'), '') is null then
      raise exception 'Question % is missing a prompt', v_i + 1;
    end if;
    if char_length(trim(v_item ->> 'prompt')) > 280 then
      raise exception 'Question % prompt is too long', v_i + 1;
    end if;
    if jsonb_typeof(v_item -> 'choices') <> 'array' then
      raise exception 'Question % is missing choices', v_i + 1;
    end if;

    v_choice_count := jsonb_array_length(v_item -> 'choices');
    if v_choice_count < 2 or v_choice_count > 4 then
      raise exception 'Question % needs 2 to 4 choices', v_i + 1;
    end if;

    v_choices := '[]'::jsonb;
    for v_c in 0 .. v_choice_count - 1 loop
      if jsonb_typeof(v_item -> 'choices' -> v_c) <> 'string' then
        raise exception 'Question % choice % must be text', v_i + 1, v_c + 1;
      end if;
      v_choice := trim(v_item -> 'choices' ->> v_c);
      if v_choice = '' then
        raise exception 'Question % choice % is empty', v_i + 1, v_c + 1;
      end if;
      if char_length(v_choice) > 80 then
        raise exception 'Question % choice % is too long', v_i + 1, v_c + 1;
      end if;
      v_choices := v_choices || jsonb_build_array(v_choice);
    end loop;

    if coalesce(v_item ->> 'correct', '') !~ '^[0-9]+$' then
      raise exception 'Question % has an invalid correct index', v_i + 1;
    end if;
    v_correct := (v_item ->> 'correct')::int;
    if v_correct < 0 or v_correct >= v_choice_count then
      raise exception 'Question % has an invalid correct index', v_i + 1;
    end if;

    if v_item ? 'seconds' and (v_item ->> 'seconds') !~ '^[0-9]+$' then
      raise exception 'Question % time must be a whole number from 5 to 120', v_i + 1;
    end if;
    v_seconds := coalesce((v_item ->> 'seconds')::int, 20);
    if v_seconds < 5 or v_seconds > 120 then
      raise exception 'Question % time must be a whole number from 5 to 120', v_i + 1;
    end if;

    v_clean := jsonb_build_object(
      'prompt', trim(v_item ->> 'prompt'),
      'choices', v_choices,
      'correct', v_correct,
      'seconds', v_seconds
    );
    v_questions := jsonb_set(v_questions, array[v_i::text], v_clean, true);
  end loop;

  v_pin := null;
  for v_try in 1 .. 30 loop
    v_pin := (100000 + floor(random() * 900000))::int::text;
    exit when not exists (select 1 from public.games where pin = v_pin);
  end loop;

  if v_pin is null or exists (select 1 from public.games where pin = v_pin) then
    raise exception 'Could not assign a PIN. Try again.';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  begin
    insert into public.games (pin, host_token, title, questions)
    values (v_pin, v_token, v_title, v_questions)
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'Could not assign a PIN. Try again.';
  end;

  return jsonb_build_object(
    'pin', v_pin,
    'hostToken', v_token,
    'title', v_title,
    'questionCount', jsonb_array_length(v_questions)
  );
end;
$$;

create or replace function public.join_game(p_pin text, p_nickname text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_pin text;
  v_nick text;
  v_key text;
  g public.games%rowtype;
  v_token text;
  v_id uuid;
  v_count int;
begin
  v_pin := regexp_replace(coalesce(p_pin, ''), '\D', '', 'g');
  if v_pin !~ '^[0-9]{6}$' then
    raise exception 'Enter the 6-digit PIN';
  end if;

  v_nick := regexp_replace(trim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  if char_length(v_nick) < 1 or char_length(v_nick) > 16 then
    raise exception 'Nickname must be 1 to 16 characters';
  end if;
  if v_nick ~ '[[:cntrl:]]' then
    raise exception 'Nickname has invalid characters';
  end if;

  select * into g from public.games where pin = v_pin for update;
  if not found then
    raise exception 'No game with that PIN';
  end if;
  if g.status <> 'lobby' then
    raise exception 'This game has already started';
  end if;

  select count(*)::int into v_count from public.players where game_id = g.id;
  if v_count >= 400 then
    raise exception 'This game is full';
  end if;

  v_key := lower(v_nick);
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  begin
    insert into public.players (game_id, nickname, nickname_key, player_token)
    values (g.id, v_nick, v_key, v_token)
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'That nickname is taken';
  end;

  return jsonb_build_object(
    'playerToken', v_token,
    'state', private.build_public_state(v_id)
  );
end;
$$;

create or replace function public.host_snapshot(p_host_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.games where host_token = p_host_token;
  if not found then
    raise exception 'Host session not found';
  end if;
  return private.build_host_snapshot(v_id);
end;
$$;

create or replace function public.public_state(p_player_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.players where player_token = p_player_token;
  if not found then
    raise exception 'Player not found';
  end if;
  return private.build_public_state(v_id);
end;
$$;

create or replace function public.host_action(p_host_token text, p_action text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g public.games%rowtype;
  v_count int;
  v_seconds int;
begin
  select * into g from public.games where host_token = p_host_token for update;
  if not found then
    raise exception 'Host session not found';
  end if;

  if p_action = 'start' then
    if g.status <> 'lobby' then
      raise exception 'The game has already started';
    end if;
    v_seconds := coalesce((g.questions -> 0 ->> 'seconds')::int, 20);
    update public.games
      set status = 'question',
          question_index = 0,
          question_started_at = clock_timestamp(),
          question_duration_ms = v_seconds * 1000,
          revision = revision + 1
      where id = g.id;

  elsif p_action = 'reveal' then
    if g.status <> 'question' then
      raise exception 'There is no question to reveal';
    end if;
    update public.games
      set status = 'reveal',
          revision = revision + 1
      where id = g.id;

  elsif p_action = 'leaderboard' then
    if g.status <> 'reveal' then
      raise exception 'Show the answer before the leaderboard';
    end if;
    update public.games
      set status = 'leaderboard',
          revision = revision + 1
      where id = g.id;

  elsif p_action = 'next' then
    if g.status <> 'leaderboard' then
      raise exception 'Show the leaderboard before the next question';
    end if;
    v_count := jsonb_array_length(g.questions);
    if g.question_index + 1 >= v_count then
      update public.games
        set status = 'finished',
            question_started_at = null,
            question_duration_ms = null,
            revision = revision + 1
        where id = g.id;
    else
      v_seconds := coalesce((g.questions -> (g.question_index + 1) ->> 'seconds')::int, 20);
      update public.games
        set status = 'question',
            question_index = g.question_index + 1,
            question_started_at = clock_timestamp(),
            question_duration_ms = v_seconds * 1000,
            revision = revision + 1
        where id = g.id;
    end if;

  else
    raise exception 'Unknown action';
  end if;

  return private.build_host_snapshot(g.id);
end;
$$;

create or replace function public.submit_answer(p_player_token text, p_choice int)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  g public.games%rowtype;
  v_choice_count int;
  v_correct_index int;
  v_is_correct boolean;
  v_elapsed int;
  v_used int;
  v_points int;
  v_answer_id uuid;
begin
  select * into v_player from public.players where player_token = p_player_token;
  if not found then
    raise exception 'Player not found';
  end if;

  select * into g from public.games where id = v_player.game_id for update;
  if not found or g.status <> 'question'
     or g.question_started_at is null
     or g.question_duration_ms is null
     or g.question_duration_ms <= 0 then
    raise exception 'The question is not open';
  end if;

  v_choice_count := jsonb_array_length(g.questions -> g.question_index -> 'choices');
  if p_choice is null or p_choice < 0 or p_choice >= v_choice_count then
    raise exception 'Pick one of the colors';
  end if;

  v_elapsed := greatest(
    0,
    floor(extract(epoch from (clock_timestamp() - g.question_started_at)) * 1000)::int
  );
  -- One second of network grace. Points are clamped to the time limit,
  -- so a late packet cannot score higher than a last-moment answer.
  if v_elapsed > g.question_duration_ms + 1000 then
    raise exception 'Too late';
  end if;

  v_correct_index := (g.questions -> g.question_index ->> 'correct')::int;
  v_is_correct := p_choice = v_correct_index;
  v_used := least(v_elapsed, g.question_duration_ms);
  if v_is_correct then
    -- Kahoot speed curve: 1000 immediate, about 500 as the timer ends.
    v_points := round(1000 * (1 - (v_used::numeric / g.question_duration_ms) / 2))::int;
  else
    v_points := 0;
  end if;

  v_answer_id := null;
  insert into public.answers (
    game_id, player_id, question_index, choice, response_ms, correct, points
  )
  values (
    g.id, v_player.id, g.question_index, p_choice, v_used, v_is_correct, v_points
  )
  on conflict (player_id, question_index) do nothing
  returning id into v_answer_id;

  if v_answer_id is null then
    return jsonb_build_object('accepted', true);
  end if;

  update public.players
    set score = score + v_points
    where id = v_player.id;

  return jsonb_build_object('accepted', true);
end;
$$;

grant execute on function public.create_game(text, jsonb) to anon, authenticated;
grant execute on function public.join_game(text, text) to anon, authenticated;
grant execute on function public.host_snapshot(text) to anon, authenticated;
grant execute on function public.public_state(text) to anon, authenticated;
grant execute on function public.host_action(text, text) to anon, authenticated;
grant execute on function public.submit_answer(text, integer) to anon, authenticated;

notify pgrst, 'reload schema';
