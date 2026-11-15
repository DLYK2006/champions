-- Group leaderboard (cooperative, groups only). Owner: @joshuatsou123. Design: docs/superpowers/specs/2026-11-15-group-leaderboard-design.md
-- Groups are ranked on a 7-day average of group completion with the full-bloom streak as tiebreak. Nothing about
-- individuals leaves these functions: rows hold only the group name, score, streak, rank and an is_mine flag.
-- This is the Supabase fallback; Databricks computes the same score (lib/analytics/groups.ts) for the live path.

alter table public.groups add column leaderboard_visible boolean not null default true;

-- ---------- internal score (not callable by clients) ----------

-- consistency_7d: average completion_percentage over the 7 days ending p_today. The window starts at the group's first
-- day with 2+ eligible members, so a day with no row counts 0 only after that. Groups with fewer than 2 members now,
-- no 2+ member day yet, or that opted out are excluded.
-- full_bloom_streak: consecutive bonus_tier = 30 days ending today, or yesterday if today is not (yet) a full bloom.
create function public.group_scores(p_today date)
returns table (group_id uuid, consistency_7d numeric, full_bloom_streak int)
language sql stable security definer set search_path = public
as $$
  with scored as (
    select g.id,
           greatest(f.first_day, p_today - 6) as start_day
    from public.groups g
    cross join lateral (
      select min(d.date) as first_day from public.group_daily_progress d
      where d.group_id = g.id and d.eligible_member_count >= 2) f
    where g.leaderboard_visible
      and f.first_day is not null and f.first_day <= p_today
      and (select count(*) from public.group_members m where m.group_id = g.id) >= 2
  )
  select s.id,
         round(coalesce((select sum(d.completion_percentage) from public.group_daily_progress d
                         where d.group_id = s.id and d.date between s.start_day and p_today), 0)
               / (p_today - s.start_day + 1), 1),
         coalesce((
           select count(*)::int from (
             select d.date, row_number() over (order by d.date desc) as rn
             from public.group_daily_progress d
             where d.group_id = s.id and d.bonus_tier = 30 and d.date <= a.anchor) x
           where x.date = a.anchor - (x.rn - 1)::int), 0)
  from scored s
  cross join lateral (
    select case
      when exists (select 1 from public.group_daily_progress d where d.group_id = s.id and d.date = p_today and d.bonus_tier = 30) then p_today
      when exists (select 1 from public.group_daily_progress d where d.group_id = s.id and d.date = p_today - 1 and d.bonus_tier = 30) then p_today - 1
    end as anchor) a
$$;

-- ---------- what the app calls ----------

-- Top 10 groups plus the caller's own group (with its true rank) if it is outside the top 10. Ties break on group id
-- so the order never reshuffles. The client sends its local date; clamp_today (0006) bounds it like log_meal.
create function public.get_group_leaderboard(p_today date default null)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_today date := public.clamp_today(p_today);
  v_me uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  v_me := public.my_group_id();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'rank', r.rank, 'group_name', r.name, 'consistency_7d', r.consistency_7d,
             'full_bloom_streak', r.full_bloom_streak, 'is_mine', coalesce(r.group_id = v_me, false))
           order by r.rank)
    from (select s.group_id, s.consistency_7d, s.full_bloom_streak, g.name,
                 row_number() over (order by s.consistency_7d desc, s.full_bloom_streak desc, s.group_id) as rank
          from public.group_scores(v_today) s join public.groups g on g.id = s.group_id) r
    where r.rank <= 10 or r.group_id = v_me), '[]'::jsonb);
end $$;

-- Names for the Databricks path, which ranks by group id only. Hidden groups and groups under 2 members are never
-- named, so the route drops them (Databricks cannot see who left or who opted out).
create function public.get_group_names(p_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_object_agg(g.id::text, g.name) from public.groups g
                   where g.id = any(p_ids) and g.leaderboard_visible
                     and (select count(*) from public.group_members m where m.group_id = g.id) >= 2), '{}'::jsonb);
end $$;

-- Any member can show or hide their group (default: shown).
create function public.set_group_leaderboard_visible(p_visible boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare v_group uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  v_group := public.my_group_id();
  if v_group is null then raise exception 'not in a group'; end if;
  update public.groups set leaderboard_visible = p_visible where id = v_group;
end $$;

revoke execute on function public.group_scores(date) from public, anon, authenticated;
revoke execute on function public.get_group_leaderboard(date) from public, anon;
revoke execute on function public.get_group_names(uuid[]) from public, anon;
revoke execute on function public.set_group_leaderboard_visible(boolean) from public, anon;
grant execute on function public.get_group_leaderboard(date) to authenticated;
grant execute on function public.get_group_names(uuid[]) to authenticated;
grant execute on function public.set_group_leaderboard_visible(boolean) to authenticated;
