import test from "node:test";
import assert from "node:assert/strict";
import { toShopItems } from "../../lib/shop/shop.ts";
import { clearEquipmentSlot, toggleOwnedItem } from "./outfit.ts";
test("database shirts/pants/hats retain server prices and separate equipment slots", () => {
  const rows = [
    { id: "sage-sweater", category: "outfit" },
    { id: "meadow-trousers", category: "pants" },
    { id: "slate-cargos", category: "pants" },
    { id: "acorn-cap", category: "hat" },
  ].map((r) => ({ ...r, name: r.id, cost: 99, asset_ref: r.id }));
  const items = toShopItems(rows, []);
  assert.deepEqual(
    items.map((i) => i.category),
    ["Hats", "Pants", "Outfits", "Pants"],
  );
  assert.ok(items.every((i) => i.price === 99));
  const owned = items.map((i) => i.id),
    equipped = ["sage-sweater", "meadow-trousers", "acorn-cap"];
  assert.deepEqual(toggleOwnedItem(equipped, owned, items, "slate-cargos"), [
    "sage-sweater",
    "acorn-cap",
    "slate-cargos",
  ]);
  assert.deepEqual(clearEquipmentSlot(equipped, items, "pants"), [
    "sage-sweater",
    "acorn-cap",
  ]);
});
