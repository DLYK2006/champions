-- DIG IN core schema. Owner: @DLYK2006. Rules: docs/BUILD_PLAN.md "Rules the PRD leaves open".
-- Coins, streak and equipped items change only inside the security definer RPCs below.
-- Groups tables + the real evaluate_group_bonus live in 0002_groups.sql (groups owner).

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique,
  goal_type text not null check (goal_type in ('bulk', 'cut', 'maintain')),
  height_cm numeric not null check (height_cm between 120 and 230),
  weight_kg numeric not null check (weight_kg between 30 and 300),
  age int not null check (age between 18 and 100),
  target_weight_kg numeric check (target_weight_kg between 30 and 300),
  calorie_target int not null check (calorie_target between 1200 and 5000),
  protein_target_g int not null check (protein_target_g between 30 and 300),
  carbs_target_g int check (carbs_target_g >= 0),
  fat_target_g int check (fat_target_g >= 0),
  avatar jsonb not null default '{}',
  equipped text[] not null default '{}',
  coin_balance int not null default 0 check (coin_balance >= 0),
  streak int not null default 0,
  last_meal_date date,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  event_id uuid not null unique,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  image_path text,
  created_at timestamptz not null default now()
);
create index on public.meals (user_id, date);

create table public.daily_progress (
  user_id uuid not null references public.profiles on delete cascade,
  date date not null,
  meals_logged int not null default 0, -- qualifying meals only
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  calorie_goal_completed boolean not null default false,
  protein_goal_completed boolean not null default false,
  personal_goal_completed boolean not null default false,
  primary key (user_id, date)
);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  amount int not null,
  reason text not null,
  reward_event_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.shop_items (
  id text primary key,
  name text not null,
  category text not null,
  cost int not null check (cost > 0),
  asset_ref text not null
);

create table public.inventory (
  user_id uuid not null references public.profiles on delete cascade,
  item_id text not null references public.shop_items,
  equipped boolean not null default false,
  primary key (user_id, item_id)
);

-- ---------- RLS: users read their own rows; writes go through RPCs ----------

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.daily_progress enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own meals read" on public.meals for select using (user_id = auth.uid());
create policy "own progress read" on public.daily_progress for select using (user_id = auth.uid());
create policy "own coins read" on public.coin_transactions for select using (user_id = auth.uid());
create policy "shop read" on public.shop_items for select to authenticated using (true);
create policy "own inventory read" on public.inventory for select using (user_id = auth.uid());

-- Clients may only write the onboarding/profile-edit columns, never coins/streak/equipped.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, username, goal_type, height_cm, weight_kg, age, target_weight_kg,
              calorie_target, protein_target_g, carbs_target_g, fat_target_g, avatar)
  on public.profiles to authenticated;
grant update (username, goal_type, height_cm, weight_kg, age, target_weight_kg,
              calorie_target, protein_target_g, carbs_target_g, fat_target_g, avatar)
  on public.profiles to authenticated;

-- ---------- evaluate_group_bonus: STUB until groups is claimed ----------
-- Groups owner: `create or replace` this in 0002_groups.sql with the same signature.
-- It pays group bonus coins itself; log_meal reads coin_balance after calling it.

create function public.evaluate_group_bonus(p_user uuid, p_date date)
returns jsonb language sql security definer set search_path = public
as $$ select null::jsonb $$;

-- ---------- log_meal ----------

create function public.log_meal(p_event_id uuid, p_date date, p_meal_type text, p_items jsonb)
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

  v_group := public.evaluate_group_bonus(v_uid, p_date);
  select coin_balance into v_balance from public.profiles where id = v_uid;

  return jsonb_build_object(
    'progress', to_jsonb(v_dp) - 'user_id',
    'coins_awarded', v_awarded,
    'coin_balance', v_balance,
    'group', v_group
  );
end $$;

-- ---------- shop ----------

create function public.buy_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cost int;
  v_balance int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select cost into v_cost from public.shop_items where id = p_item_id;
  if not found then raise exception 'unknown item'; end if;
  if exists (select 1 from public.inventory where user_id = v_uid and item_id = p_item_id) then
    raise exception 'already owned';
  end if;

  update public.profiles set coin_balance = coin_balance - v_cost
  where id = v_uid and coin_balance >= v_cost
  returning coin_balance into v_balance;
  if not found then raise exception 'not enough coins'; end if;

  insert into public.inventory (user_id, item_id) values (v_uid, p_item_id);
  insert into public.coin_transactions (user_id, amount, reason, reward_event_id)
  values (v_uid, -v_cost, 'buy_' || p_item_id, v_uid || ':buy:' || p_item_id);

  return jsonb_build_object('coin_balance', v_balance);
end $$;

create function public.equip_item(p_item_id text, p_equipped boolean)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_equipped text[];
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  update public.inventory set equipped = p_equipped where user_id = v_uid and item_id = p_item_id;
  if not found then raise exception 'not owned'; end if;

  update public.profiles set equipped = coalesce(
    (select array_agg(item_id order by item_id) from public.inventory where user_id = v_uid and equipped), '{}')
  where id = v_uid
  returning equipped into v_equipped;

  return jsonb_build_object('equipped', to_jsonb(v_equipped));
end $$;

-- ---------- function grants: signed-in users only (anonymous auth users are 'authenticated') ----------

revoke execute on function public.evaluate_group_bonus(uuid, date) from public, anon;
revoke execute on function public.log_meal(uuid, date, text, jsonb) from public, anon;
revoke execute on function public.buy_item(text) from public, anon;
revoke execute on function public.equip_item(text, boolean) from public, anon;
grant execute on function public.evaluate_group_bonus(uuid, date) to authenticated;
grant execute on function public.log_meal(uuid, date, text, jsonb) to authenticated;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, boolean) to authenticated;
