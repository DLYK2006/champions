-- Profile settings (PRD 14.1) for Josh's settings controller. Owner: @DLYK2006.
-- Users edit these on their own row (the 0001 profile RLS policies already limit updates to id = auth.uid()).
-- hide_status_from_group is only stored here; get_group_status (0002, groups owner) must honour it.
-- Notification toggles are stored preferences only; push delivery is P2.

alter table public.profiles
  add column unit_preference text not null default 'metric' check (unit_preference in ('metric', 'imperial')),
  add column hide_status_from_group boolean not null default false,
  add column notify_meal_reminders boolean not null default false,
  add column notify_group_alerts boolean not null default false;

grant insert (unit_preference) on public.profiles to authenticated;
grant update (unit_preference, hide_status_from_group, notify_meal_reminders, notify_group_alerts)
  on public.profiles to authenticated;
