-- Shop items (docs/BUILD_PLAN.md). Demo accounts + group: add once 0002_groups.sql lands.
insert into public.shop_items (id, name, category, cost, asset_ref) values
  ('sunglasses', 'Sunglasses', 'accessory', 20, 'avataaars:accessories=sunglasses'),
  ('hoodie', 'Hoodie', 'clothing', 40, 'avataaars:clothing=hoodie'),
  ('crown', 'Crown', 'headwear', 60, 'overlay:crown');
