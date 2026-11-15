-- save_outfit: the Profile wardrobe saves the free look and the equipped paid items in one transaction.
-- Contract (board, Nov 15): save_outfit(p_avatar jsonb, p_equipped text[]) returns { avatar, equipped }.
-- Same rules as equip_item (0001): only owned items can be worn, inventory.equipped and profiles.equipped
-- stay in sync, coins are never touched. The avatar JSON is sanitized by the client (lib/shop sanitizeAvatar),
-- exactly like a direct profiles.avatar update; here it only has to be an object.
-- Owner: @joshuatsou123

create function public.save_outfit(p_avatar jsonb, p_equipped text[])
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wanted text[] := coalesce((select array_agg(distinct x) from unnest(coalesce(p_equipped, '{}')) x where x is not null), '{}');
  v_avatar jsonb;
  v_equipped text[];
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_avatar is null or jsonb_typeof(p_avatar) <> 'object' then raise exception 'invalid avatar'; end if;

  -- Every id to wear must be in the caller's inventory (unknown ids are not owned either).
  if exists (
    select 1 from unnest(v_wanted) w
    where not exists (select 1 from public.inventory i where i.user_id = v_uid and i.item_id = w)
  ) then
    raise exception 'not owned';
  end if;

  update public.inventory set equipped = (item_id = any(v_wanted)) where user_id = v_uid;

  update public.profiles set
    avatar = p_avatar,
    equipped = coalesce(
      (select array_agg(item_id order by item_id) from public.inventory where user_id = v_uid and equipped), '{}')
  where id = v_uid
  returning avatar, equipped into v_avatar, v_equipped;
  if not found then raise exception 'not signed in'; end if; -- no profile yet

  return jsonb_build_object('avatar', v_avatar, 'equipped', to_jsonb(v_equipped));
end $$;

revoke execute on function public.save_outfit(jsonb, text[]) from public, anon;
grant execute on function public.save_outfit(jsonb, text[]) to authenticated;
