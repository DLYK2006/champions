-- Shop catalog v2 for Jay's six-item Shop (#79/#80, approved by Daren Nov 15). Owner: @DLYK2006.
-- Adds 2 shirts, 2 pants, 2 hats. The original sunglasses / hoodie / crown rows stay, so existing
-- inventory and equipped items keep working; the storefront UI shows only these six.
-- (Josh's hide_status_from_group moves to 0010.)
insert into public.shop_items (id, name, category, cost, asset_ref) values
  ('sage-sweater',    'Sage Sweater',    'outfit', 40, 'overlay:sage-sweater'),
  ('rust-flannel',    'Rust Flannel',    'outfit', 50, 'overlay:rust-flannel'),
  ('meadow-trousers', 'Meadow Trousers', 'pants',  30, 'overlay:meadow-trousers'),
  ('slate-cargos',    'Slate Cargos',    'pants',  45, 'overlay:slate-cargos'),
  ('acorn-cap',       'Acorn Cap',       'hat',    25, 'overlay:acorn-cap'),
  ('fisher-bucket',   'Fisher Bucket',   'hat',    35, 'overlay:fisher-bucket')
on conflict (id) do nothing;
