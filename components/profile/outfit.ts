import type { WardrobeSlot } from "@/components/avatar/wardrobe";

type Item = { id: string; category: string };
const SLOT_CATEGORY: Record<WardrobeSlot, string> = {
  hat: "Hats",
  clothing: "Outfits",
  pants: "Pants",
  shoes: "Shoes",
};
export function clearEquipmentSlot(
  equipped: readonly string[],
  items: readonly Item[],
  slot: WardrobeSlot,
) {
  return equipped.filter(
    (id) =>
      items.find((item) => item.id === id)?.category !== SLOT_CATEGORY[slot],
  );
}
export function toggleOwnedItem(
  equipped: readonly string[],
  owned: readonly string[],
  items: readonly Item[],
  id: string,
) {
  const item = items.find((item) => item.id === id);
  if (!item || !owned.includes(id))
    throw Error("Only owned items can be equipped.");
  if (equipped.includes(id)) return equipped.filter((value) => value !== id);
  return [
    ...equipped.filter(
      (value) =>
        item.category === "Accessories" ||
        items.find((other) => other.id === value)?.category !== item.category,
    ),
    id,
  ];
}
