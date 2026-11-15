// Run: node --test lib/shop/   (Node 22.18+ strips TypeScript types natively)
import test from "node:test";
import assert from "node:assert/strict";
import * as s from "./shop.ts";

const presentation = [
  { id: "hoodie", name: "Woodland Hoodie", price: 40, category: "Outfits", icon: "shirt", description: "Cozy." },
  { id: "crown", name: "Crown", price: 60, category: "Hats", icon: "crown", description: "Regal." },
];
const rows = [
  { id: "crown", name: "Crown", category: "headwear", cost: 60, asset_ref: "overlay:crown" },
  { id: "sunglasses", name: "Sunglasses", category: "accessory", cost: 20, asset_ref: "x" },
  { id: "hoodie", name: "Hoodie", category: "clothing", cost: 40, asset_ref: "y" },
];

test("items are sorted by price and take their price from the database", () => {
  const items = s.toShopItems(rows, presentation);
  assert.deepEqual(items.map((i) => [i.id, i.price]), [["sunglasses", 20], ["hoodie", 40], ["crown", 60]]);
});

test("presentation supplies name/icon/description; database supplies price and category", () => {
  const hoodie = s.toShopItems(rows, presentation).find((i) => i.id === "hoodie");
  assert.equal(hoodie.name, "Woodland Hoodie");
  assert.equal(hoodie.icon, "shirt");
  assert.equal(hoodie.category, "Outfits");
  const priced = s.toShopItems([{ ...rows[2], cost: 99 }], presentation)[0];
  assert.equal(priced.price, 99); // a stale UI price never wins
});

test("unknown item ids and categories still render with a neutral look", () => {
  const [x] = s.toShopItems([{ id: "cape", name: "Cape", category: "mystery", cost: 10, asset_ref: "z" }], presentation);
  assert.deepEqual([x.name, x.icon, x.category], ["Cape", "spark", "Accessories"]);
  assert.ok(x.description.length > 0);
});

test("friendly errors never leak raw database text", () => {
  assert.match(s.friendlyShopError("not enough coins"), /Not enough coins/);
  assert.match(s.friendlyShopError("already owned"), /already own/);
  assert.match(s.friendlyShopError("unknown item"), /isn't in the shop/);
  assert.match(s.friendlyShopError("not owned"), /Buy it first/);
  assert.match(s.friendlyShopError("not signed in"), /Sign in/);
  for (const raw of ["duplicate key value violates unique constraint", "", null, undefined]) {
    assert.equal(s.friendlyShopError(raw), s.GENERIC_SHOP_ERROR);
  }
});

test("equip is a toggle derived from the current equipped list", () => {
  assert.equal(s.nextEquipState(["hoodie"], "hoodie"), false);
  assert.equal(s.nextEquipState(["hoodie"], "crown"), true);
  assert.equal(s.nextEquipState([], "crown"), true);
});

test("sanitizeAvatar keeps the six core keys plus valid wardrobe and drops everything else", () => {
  const core = { skinColor: "edb98a", top: "shortFlat", hairColor: "2c1b18", eyes: "default", mouth: "smile", clothing: "linen-shirt" };
  const out = s.sanitizeAvatar({ ...core, hat: "moss-beanie", pants: "cocoa-trousers", shoes: "canvas-sneakers", coins: 999, extra: "x" });
  assert.deepEqual(out, { ...core, hat: "moss-beanie", pants: "cocoa-trousers", shoes: "canvas-sneakers" });
  assert.deepEqual(s.sanitizeAvatar(core), core);
  assert.deepEqual(s.sanitizeAvatar({ ...core, hat: "<script>", shoes: 3 }), core); // invalid wardrobe is dropped
});

test("sanitizeAvatar refuses an avatar missing or corrupting a core key", () => {
  const core = { skinColor: "edb98a", top: "shortFlat", hairColor: "2c1b18", eyes: "default", mouth: "smile", clothing: "hoodie" };
  assert.throws(() => s.sanitizeAvatar({ ...core, eyes: undefined }), /save that look/);
  assert.throws(() => s.sanitizeAvatar({ ...core, top: "a".repeat(41) }), /save that look/);
  assert.throws(() => s.sanitizeAvatar({}), /save that look/);
});
