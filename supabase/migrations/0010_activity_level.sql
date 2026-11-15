-- Exercise frequency for personal targets (Daren, Nov 15). Owner: @DLYK2006.
-- Feeds lib/targets/recommend.ts (Mifflin-St Jeor x activity factor). Nullable: existing profiles keep their targets.
-- (Josh's hide_status_from_group moves to 0011.)
alter table public.profiles
  add column activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'very'));

grant insert (activity_level) on public.profiles to authenticated;
grant update (activity_level) on public.profiles to authenticated;
