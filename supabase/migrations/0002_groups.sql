-- DIG IN groups. Owner: @joshuatsou123. Rules: docs/BUILD_PLAN.md "Group bonus (PRD 9.2)".
-- Replaces the evaluate_group_bonus stub from 0001_core.sql (same signature).
-- Privacy: members never read each other's daily_progress (it holds exact intake). They read the
-- group only through get_group_status(), which returns completion flags, username, avatar and equipped items.

-- ---------- tables ----------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  badge text not null check (char_length(badge) between 1 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  creator_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);

-- user_id is unique: one group per user for the MVP.
create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null unique references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_daily_progress (
  group_id uuid not null references public.groups on delete cascade,
  date date not null,
  eligible_member_count int not null,
  completed_member_count int not null,
  completion_percentage numeric not null,
  bonus_tier int not null check (bonus_tier in (0, 10, 20, 30)),
  updated_at timestamptz not null default now(),
  primary key (group_id, date)
);

-- ---------- RLS: members read their own group; every write goes through the RPCs below ----------

-- Looks up the caller's group without re-entering group_members' own RLS policy.
create function public.my_group_id()
returns uuid language sql stable security definer set search_path = public
as $$ select group_id from public.group_members where user_id = auth.uid() $$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_daily_progress enable row level security;

create policy "members read group" on public.groups for select using (id = public.my_group_id());
create policy "members read roster" on public.group_members for select using (group_id = public.my_group_id());
create policy "members read group progress" on public.group_daily_progress for select using (group_id = public.my_group_id());

revoke all on public.groups, public.group_members, public.group_daily_progress from anon, authenticated;
grant select on public.groups, public.group_members, public.group_daily_progress to authenticated;

-- ---------- internal helpers (not callable by clients) ----------

create function public.group_json(g public.groups)
returns jsonb language sql immutable
as $$ select jsonb_build_object('id', g.id, 'name', g.name, 'badge', g.badge,
                                'invite_code', g.invite_code, 'creator_id', g.creator_id) $$;

-- 60% of members done pays tier 10, 80% pays 20, everyone pays 30.
create function public.group_tier(p_done int, p_total int)
returns int language sql immutable
as $$ select case when p_total <= 0 then 0
                  when p_done >= p_total then 30
                  when p_done * 100 >= 80 * p_total then 20
                  when p_done * 100 >= 60 * p_total then 10
                  else 0 end $$;

create function public.group_counts(p_group uuid, p_date date, out total int, out done int)
language sql stable
as $$
  select count(*)::int, (count(*) filter (where coalesce(d.personal_goal_completed, false)))::int
  from public.group_members m
  left join public.daily_progress d on d.user_id = m.user_id and d.date = p_date
  where m.group_id = p_group
$$;

create function public.group_progress_json(p_group uuid, p_date date)
returns jsonb language sql stable
as $$
  select jsonb_build_object(
    'group_id', p_group,
    'date', p_date,
    'eligible_member_count', c.total,
    'completed_member_count', c.done,
    'completion_percentage', case when c.total = 0 then 0 else round(100.0 * c.done / c.total, 1) end,
    'bonus_tier', public.group_tier(c.done, c.total))
  from public.group_counts(p_group, p_date) c
$$;

-- Pays every completed member the difference up to the group's current tier, once per tier (never claws back).
-- Locks the group row so two meals logged at the same moment cannot double pay.
create function public.evaluate_group(p_group uuid, p_date date)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_progress jsonb;
  v_tier int;
  v_member record;
  v_prefix text;
  v_paid int;
  v_due int;
begin
  perform 1 from public.groups where id = p_group for update;
  if not found then return null; end if;

  v_progress := public.group_progress_json(p_group, p_date);
  v_tier := (v_progress ->> 'bonus_tier')::int;

  if v_tier > 0 then
    for v_member in
      select m.user_id
      from public.group_members m
      join public.daily_progress d on d.user_id = m.user_id and d.date = p_date
      where m.group_id = p_group and d.personal_goal_completed
    loop
      v_prefix := v_member.user_id::text || ':' || p_date::text || ':group_tier_';
      select coalesce(sum(amount), 0) into v_paid
      from public.coin_transactions
      where user_id = v_member.user_id and starts_with(reward_event_id, v_prefix);

      v_due := v_tier - v_paid; -- caps at 30 per member per day because tiers top out at 30
      if v_due > 0 then
        insert into public.coin_transactions (user_id, amount, reason, reward_event_id)
        values (v_member.user_id, v_due, 'group_tier_' || v_tier, v_prefix || v_tier)
        on conflict (reward_event_id) do nothing;
        if found then
          update public.profiles set coin_balance = coin_balance + v_due where id = v_member.user_id;
        end if;
      end if;
    end loop;
  end if;

  -- Always touched (updated_at), so realtime subscribers get an event on every evaluation.
  insert into public.group_daily_progress
    (group_id, date, eligible_member_count, completed_member_count, completion_percentage, bonus_tier)
  values (p_group, p_date,
          (v_progress ->> 'eligible_member_count')::int, (v_progress ->> 'completed_member_count')::int,
          (v_progress ->> 'completion_percentage')::numeric, v_tier)
  on conflict (group_id, date) do update set
    eligible_member_count = excluded.eligible_member_count,
    completed_member_count = excluded.completed_member_count,
    completion_percentage = excluded.completion_percentage,
    bonus_tier = excluded.bonus_tier,
    updated_at = now();

  return v_progress;
end $$;

-- ---------- evaluate_group_bonus: called by log_meal after personal coins are paid ----------

create or replace function public.evaluate_group_bonus(p_user uuid, p_date date)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_group uuid;
begin
  -- Clients can call this directly, so it only ever acts for the caller.
  if auth.uid() is not null and p_user is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;
  select group_id into v_group from public.group_members where user_id = p_user;
  if v_group is null then return null; end if;
  return public.evaluate_group(v_group, p_date);
end $$;

-- ---------- RPCs ----------

create function public.create_group(p_name text, p_badge text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(p_name);
  v_badge text := btrim(p_badge);
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I
  v_code text;
  v_group public.groups;
  i int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then raise exception 'no profile'; end if;
  if exists (select 1 from public.group_members where user_id = v_uid) then raise exception 'already in a group'; end if;
  if char_length(coalesce(v_name, '')) not between 1 and 30 then raise exception 'group name must be 1 to 30 characters'; end if;
  if char_length(coalesce(v_badge, '')) not between 1 and 40 then raise exception 'pick a badge'; end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.groups (name, badge, invite_code, creator_id)
      values (v_name, v_badge, v_code, v_uid) returning * into v_group;
      exit;
    exception when unique_violation then
      null; -- invite code collision: roll another
    end;
  end loop;

  insert into public.group_members (group_id, user_id) values (v_group.id, v_uid);
  perform public.evaluate_group(v_group.id, (now() at time zone 'utc')::date);
  return public.group_json(v_group);
end $$;

create function public.join_group(p_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.groups;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then raise exception 'no profile'; end if;
  if exists (select 1 from public.group_members where user_id = v_uid) then raise exception 'already in a group'; end if;

  select * into v_group from public.groups where invite_code = upper(btrim(p_code)) for update;
  if not found then raise exception 'no group with that code'; end if;
  if (select count(*) from public.group_members where group_id = v_group.id) >= 4 then
    raise exception 'that group is full';
  end if;

  insert into public.group_members (group_id, user_id) values (v_group.id, v_uid);
  perform public.evaluate_group(v_group.id, (now() at time zone 'utc')::date);
  return public.group_json(v_group);
end $$;

create function public.leave_group()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group uuid;
  v_left int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select group_id into v_group from public.group_members where user_id = v_uid;
  if v_group is null then raise exception 'not in a group'; end if;

  perform 1 from public.groups where id = v_group for update;
  delete from public.group_members where user_id = v_uid;
  select count(*) into v_left from public.group_members where group_id = v_group;

  if v_left = 0 then
    delete from public.groups where id = v_group;
  else
    update public.groups set creator_id = (
      select user_id from public.group_members where group_id = v_group order by joined_at, user_id limit 1)
    where id = v_group and creator_id = v_uid;
    perform public.evaluate_group(v_group, (now() at time zone 'utc')::date);
  end if;
  return jsonb_build_object('left', true);
end $$;

-- Everything the Groups page shows, in one call: { group, progress, members[] } or null when not in a group.
-- Members are GroupMemberStatus: no weights, no intake, only whether the personal goal is done.
create function public.get_group_status(p_date date)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.groups;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select g.* into v_group
  from public.groups g join public.group_members m on m.group_id = g.id
  where m.user_id = v_uid;
  if not found then return null; end if;

  return jsonb_build_object(
    'group', public.group_json(v_group),
    'progress', public.group_progress_json(v_group.id, p_date),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'user_id', p.id, 'username', p.username, 'avatar', p.avatar, 'equipped', to_jsonb(p.equipped),
               'personal_goal_completed', coalesce(d.personal_goal_completed, false))
             order by m.joined_at, p.id), '[]'::jsonb)
      from public.group_members m
      join public.profiles p on p.id = m.user_id
      left join public.daily_progress d on d.user_id = m.user_id and d.date = p_date
      where m.group_id = v_group.id)
  );
end $$;

-- ---------- grants: signed-in users only; helpers stay internal ----------

revoke execute on function public.my_group_id() from public, anon;
revoke execute on function public.group_json(public.groups) from public, anon, authenticated;
revoke execute on function public.group_tier(int, int) from public, anon, authenticated;
revoke execute on function public.group_counts(uuid, date) from public, anon, authenticated;
revoke execute on function public.group_progress_json(uuid, date) from public, anon, authenticated;
revoke execute on function public.evaluate_group(uuid, date) from public, anon, authenticated;
revoke execute on function public.evaluate_group_bonus(uuid, date) from public, anon;
revoke execute on function public.create_group(text, text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
revoke execute on function public.leave_group() from public, anon;
revoke execute on function public.get_group_status(date) from public, anon;
grant execute on function public.my_group_id() to authenticated;
grant execute on function public.evaluate_group_bonus(uuid, date) to authenticated;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.leave_group() to authenticated;
grant execute on function public.get_group_status(date) to authenticated;

-- ---------- realtime: the Groups page refetches when these change ----------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.group_daily_progress, public.group_members;
  end if;
end $$;
