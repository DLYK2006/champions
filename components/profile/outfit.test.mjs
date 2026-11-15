import test from "node:test";
import assert from "node:assert/strict";
import { clearEquipmentSlot, toggleOwnedItem } from "./outfit.ts";
const items = [
  { id: "crown", category: "Hats" },
  { id: "cap", category: "Hats" },
  { id: "hoodie", category: "Outfits" },
  { id: "sunglasses", category: "Accessories" },
];
test("starter choices remove only the paid layer in their slot", () => {
  assert.deepEqual(
    clearEquipmentSlot(["crown", "hoodie", "sunglasses"], items, "hat"),
    ["hoodie", "sunglasses"],
  );
  assert.deepEqual(
    clearEquipmentSlot(["crown", "hoodie", "sunglasses"], items, "clothing"),
    ["crown", "sunglasses"],
  );
  assert.deepEqual(clearEquipmentSlot(["crown", "hoodie"], items, "shoes"), [
    "crown",
    "hoodie",
  ]);
});
test("paid outfit preview rejects unowned ids, replaces slot and preserves accessories", () => {
  assert.throws(() => toggleOwnedItem([], [], items, "crown"), /owned/);
  assert.deepEqual(
    toggleOwnedItem(
      ["cap", "hoodie", "sunglasses"],
      ["cap", "hoodie", "sunglasses", "crown"],
      items,
      "crown",
    ),
    ["hoodie", "sunglasses", "crown"],
  );
  assert.deepEqual(
    toggleOwnedItem(
      ["crown", "sunglasses"],
      ["crown", "sunglasses"],
      items,
      "crown",
    ),
    ["sunglasses"],
  );
});
