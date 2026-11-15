-- DIG IN friends (PRD 11.2-11.3). Owner: @joshuatsou123. Contract: docs/BUILD_PLAN.md "Friends".
-- Friendship is mutual: one side asks, the other accepts. A friend sees only your username, your current
-- streak and a calendar of days marked goal / logged. Never calories, macros, meals, weight, targets,
-- avatar or group (PRD 11.3). Friends cannot read each other's rows: everything goes through the RPCs.
-- Declining just deletes the request (no "declined" state, nothing is shown to the requester).

-- ---------- table ----------

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles on delete cascade,
  addressee_id uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- One friendship per pair, whichever way it was asked.
create unique index friendships_pair on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index on public.friendships (addressee_id);

-- ---------- RLS: you can read the rows you are part of; every write goes through the RPCs ----------

alter table public.friendships enable row level security;
create policy "read own friendships" on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- ---------- helpers (internal) ----------

-- profiles.streak only changes when a qualifying meal is logged, so it is stale after a missed day.
-- It is still alive if the last qualifying meal was on p_today or the day before (same rule as Home, PRD 7.3).
create function public.live_streak(p_streak int, p_last date, p_today date)
returns int language sql immutable
as $$ select case when p_last is not null and p_last >= p_today - 1 then p_streak else 0 end $$;

create function public.friendship_between(p_a uuid, p_b uuid)
returns public.friendships language sql stable security definer set search_path = public
as $$ select * from public.friendships
      where (requester_id = p_a and addressee_id = p_b) or (requester_id = p_b and addressee_id = p_a) $$;

-- ---------- RPCs ----------

-- Find people to add by username. Prefix match, at least 3 characters, 10 results, never yourself.
-- Returns only the id and username plus how you are already related.
create function public.search_users(p_query text)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_q text := lower(btrim(coalesce(p_query, '')));
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then raise exception 'no profile'; end if;
  if char_length(v_q) < 3 then raise exception 'type at least 3 letters'; end if;
  -- escape LIKE wildcards so "_" and "%" in a search are literal
  v_q := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'user_id', p.id, 'username', p.username,
             'relation', case
               when f.id is null then 'none'
               when f.status = 'accepted' then 'friend'
               when f.requester_id = v_uid then 'outgoing'
               else 'incoming' end) order by p.username)
    from (select id, username from public.profiles
          where id <> v_uid and lower(username) like v_q || '%' escape '\'
          order by username limit 10) p
    left join lateral public.friendship_between(v_uid, p.id) f on true
  ), '[]'::jsonb);
end $$;

-- Ask someone to be friends. If they already asked you, this accepts (that is what both of you want).
create function public.send_friend_request(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_f public.friendships;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then raise exception 'no profile'; end if;
  if p_user is null or p_user = v_uid then raise exception 'you can''t add yourself'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'no one found with that username'; end if;

  v_f := public.friendship_between(v_uid, p_user);
  if v_f.id is not null then
    if v_f.status = 'accepted' then raise exception 'you are already friends'; end if;
    if v_f.requester_id = v_uid then raise exception 'request already sent'; end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = v_f.id returning * into v_f;
  else
    if (select count(*) from public.friendships where requester_id = v_uid and status = 'pending') >= 20 then
      raise exception 'too many pending requests';
    end if;
    insert into public.friendships (requester_id, addressee_id) values (v_uid, p_user) returning * into v_f;
  end if;
  return jsonb_build_object('user_id', p_user, 'status', v_f.status);
end $$;

-- Answer a request someone sent you. Declining deletes it quietly.
create function public.respond_friend_request(p_requester uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_f public.friendships;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into v_f from public.friendships
    where requester_id = p_requester and addressee_id = v_uid and status = 'pending' for update;
  if v_f.id is null then raise exception 'no such request'; end if;
  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = v_f.id;
    return jsonb_build_object('user_id', p_requester, 'status', 'accepted');
  end if;
  delete from public.friendships where id = v_f.id;
  return jsonb_build_object('user_id', p_requester, 'status', 'none');
end $$;

-- Remove a friend, or cancel a request you sent, or (for a request sent to you) decline it.
create function public.remove_friend(p_user uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  delete from public.friendships
    where (requester_id = v_uid and addressee_id = p_user) or (requester_id = p_user and addressee_id = v_uid);
  if not found then raise exception 'not friends'; end if;
end $$;

-- Friends plus pending requests in both directions. Streak is shown for accepted friends only.
create function public.list_friends(p_today date default null)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := coalesce(p_today, current_date);
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  return jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username,
               'streak', public.live_streak(p.streak, p.last_meal_date, v_today)) order by p.username)
      from public.friendships f
      join public.profiles p on p.id = case when f.requester_id = v_uid then f.addressee_id else f.requester_id end
      where f.status = 'accepted' and (f.requester_id = v_uid or f.addressee_id = v_uid)), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username) order by f.created_at)
      from public.friendships f join public.profiles p on p.id = f.requester_id
      where f.status = 'pending' and f.addressee_id = v_uid), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username) order by f.created_at)
      from public.friendships f join public.profiles p on p.id = f.addressee_id
      where f.status = 'pending' and f.requester_id = v_uid), '[]'::jsonb)
  );
end $$;

-- A friend's progress: username, current streak and one row per day marked goal / logged (quiet days are
-- left out, shown neutrally by the client). Accepted friends only, at most 62 days at a time.
create function public.get_friend_calendar(p_friend uuid, p_from date, p_to date, p_today date default null)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := coalesce(p_today, current_date);
  v_p public.profiles;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_from is null or p_to is null or p_to < p_from then raise exception 'bad date range'; end if;
  if p_to - p_from > 62 then raise exception 'date range too long'; end if;
  if not exists (select 1 from public.friendships f
                 where f.status = 'accepted'
                   and ((f.requester_id = v_uid and f.addressee_id = p_friend)
                     or (f.requester_id = p_friend and f.addressee_id = v_uid))) then
    raise exception 'not friends';
  end if;
  select * into v_p from public.profiles where id = p_friend;
  return jsonb_build_object(
    'user_id', v_p.id,
    'username', v_p.username,
    'streak', public.live_streak(v_p.streak, v_p.last_meal_date, v_today),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.date,
               'status', case when d.personal_goal_completed then 'goal' else 'logged' end) order by d.date)
      from public.daily_progress d
      where d.user_id = p_friend and d.date between p_from and p_to
        and (d.personal_goal_completed or d.total_calories > 0)), '[]'::jsonb));
end $$;

-- ---------- grants: signed-in users only; helpers stay internal ----------

revoke execute on function public.live_streak(int, date, date) from public, anon, authenticated;
revoke execute on function public.friendship_between(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.search_users(text) from public, anon;
revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke execute on function public.remove_friend(uuid) from public, anon;
revoke execute on function public.list_friends(date) from public, anon;
revoke execute on function public.get_friend_calendar(uuid, date, date, date) from public, anon;
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.list_friends(date) to authenticated;
grant execute on function public.get_friend_calendar(uuid, date, date, date) to authenticated;
