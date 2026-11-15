-- Shop items (docs/BUILD_PLAN.md). Demo accounts + group: add once 0002_groups.sql lands.
insert into public.shop_items (id, name, category, cost, asset_ref) values
  ('sunglasses', 'Sunglasses', 'accessory', 20, 'avataaars:accessories=sunglasses'),
  ('hoodie', 'Hoodie', 'clothing', 40, 'avataaars:clothing=hoodie'),
  ('crown', 'Crown', 'headwear', 60, 'overlay:crown');
-- Catalog v2 (also in migration 0009) so a fresh local database matches production.
insert into public.shop_items (id, name, category, cost, asset_ref) values
  ('sage-sweater', 'Sage Sweater', 'outfit', 40, 'overlay:sage-sweater'),
  ('rust-flannel', 'Rust Flannel', 'outfit', 50, 'overlay:rust-flannel'),
  ('meadow-trousers', 'Meadow Trousers', 'pants', 30, 'overlay:meadow-trousers'),
  ('slate-cargos', 'Slate Cargos', 'pants', 45, 'overlay:slate-cargos'),
  ('acorn-cap', 'Acorn Cap', 'hat', 25, 'overlay:acorn-cap'),
  ('fisher-bucket', 'Fisher Bucket', 'hat', 35, 'overlay:fisher-bucket')
on conflict (id) do nothing;
