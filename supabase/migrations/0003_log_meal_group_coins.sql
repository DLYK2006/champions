-- log_meal now reports group bonus coins in coins_awarded (reason 'group_bonus'), so the member whose meal
-- completes the group sees +30 next to their personal coins. Owner: @DLYK2006. Body is 0001's log_meal plus
-- the v_before balance read around evaluate_group_bonus; nothing else changes.

create or replace function public.log_meal(p_event_id uuid, p_date date, p_meal_type text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prof public.profiles;
  v_dp public.daily_progress;
  v_cal numeric; v_pro numeric; v_carb numeric; v_fat numeric;
  v_qualifying boolean;
  v_awarded jsonb := '[]';
  v_group jsonb;
  v_balance int;
  v_reward record;
  v_inserted boolean;
  v_before int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  -- Client sends its local date; any real timezone is within a day of UTC.
  if p_date not between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1 then
    raise exception 'date out of range';
  end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'p_items must be an array'; end if;

  select * into v_prof from public.profiles where id = v_uid for update;
  if not found then raise exception 'no profile'; end if;

  select coalesce(sum((i->>'calories')::numeric), 0), coalesce(sum((i->>'protein_g')::numeric), 0),
         coalesce(sum((i->>'carbs_g')::numeric), 0), coalesce(sum((i->>'fat_g')::numeric), 0)
    into v_cal, v_pro, v_carb, v_fat
    from jsonb_array_elements(p_items) i;
  if least(v_cal, v_pro, v_carb, v_fat) < 0 then raise exception 'negative nutrition values'; end if;

  -- Idempotent on event_id: a repeat returns current state and awards nothing.
  insert into public.meals (user_id, event_id, date, meal_type, items, calories, protein_g, carbs_g, fat_g)
  values (v_uid, p_event_id, p_date, p_meal_type, p_items, v_cal, v_pro, v_carb, v_fat)
  on conflict (event_id) do nothing;
  v_inserted := found;

  insert into public.daily_progress (user_id, date) values (v_uid, p_date) on conflict do nothing;

  if v_inserted then
    v_qualifying := jsonb_array_length(p_items) >= 1 and v_cal >= 50;

    update public.daily_progress d set
      meals_logged = d.meals_logged + v_qualifying::int,
      total_calories = d.total_calories + v_cal,
      total_protein_g = d.total_protein_g + v_pro,
      total_carbs_g = d.total_carbs_g + v_carb,
      total_fat_g = d.total_fat_g + v_fat,
      calorie_goal_completed = (d.total_calories + v_cal) between 0.9 * v_prof.calorie_target and 1.1 * v_prof.calorie_target,
      protein_goal_completed = (d.total_protein_g + v_pro) >= 0.9 * v_prof.protein_target_g
    where d.user_id = v_uid and d.date = p_date
    returning * into v_dp;
    update public.daily_progress d set personal_goal_completed = d.calorie_goal_completed and d.protein_goal_completed
    where d.user_id = v_uid and d.date = p_date
    returning * into v_dp;

    -- Each reward paid once per day via unique reward_event_id. Max 30 + 20 + 10 + 10 = 70.
    for v_reward in
      select * from (values
        (v_qualifying and v_dp.meals_logged <= 3, 10, 'meal_' || v_dp.meals_logged),
        (v_dp.calorie_goal_completed, 20, 'calorie_goal'),
        (v_dp.protein_goal_completed, 10, 'protein_goal'),
        (v_dp.personal_goal_completed, 10, 'both_goals')
      ) r(ok, amount, reason) where ok
    loop
      insert into public.coin_transactions (user_id, amount, reason, reward_event_id)
      values (v_uid, v_reward.amount, v_reward.reason, v_uid || ':' || p_date || ':' || v_reward.reason)
      on conflict (reward_event_id) do nothing;
      if found then
        update public.profiles set coin_balance = coin_balance + v_reward.amount where id = v_uid;
        v_awarded := v_awarded || jsonb_build_object('amount', v_reward.amount, 'reason', v_reward.reason);
      end if;
    end loop;

    -- Streak: at least one qualifying meal per day.
    if v_qualifying and (v_prof.last_meal_date is null or p_date > v_prof.last_meal_date) then
      update public.profiles set
        streak = case when v_prof.last_meal_date = p_date - 1 then streak + 1 else 1 end,
        last_meal_date = p_date
      where id = v_uid;
    end if;
  else
    select * into v_dp from public.daily_progress where user_id = v_uid and date = p_date;
  end if;

  select coin_balance into v_before from public.profiles where id = v_uid;
  v_group := public.evaluate_group_bonus(v_uid, p_date);
  select coin_balance into v_balance from public.profiles where id = v_uid;
  if v_balance > v_before then
    v_awarded := v_awarded || jsonb_build_object('amount', v_balance - v_before, 'reason', 'group_bonus');
  end if;

  return jsonb_build_object(
    'progress', to_jsonb(v_dp) - 'user_id',
    'coins_awarded', v_awarded,
    'coin_balance', v_balance,
    'group', v_group
  );
end $$;
