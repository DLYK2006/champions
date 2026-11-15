import type { Avatar } from "@/types";

// Optional appearance JSON fields; existing profiles and paid equipment stay valid.
export type WardrobeAvatar = Avatar;
export type WardrobeSlot = "hat" | "clothing" | "pants" | "shoes";
export const STARTER_WARDROBE: readonly {
  slot: WardrobeSlot;
  label: string;
  options: readonly { id: string; name: string }[];
}[] = [
  {
    slot: "hat",
    label: "Hat",
    options: [
      { id: "moss-beanie", name: "Moss beanie" },
      { id: "straw-sunhat", name: "Straw sunhat" },
    ],
  },
  {
    slot: "clothing",
    label: "Clothes",
    options: [
      { id: "linen-shirt", name: "Linen shirt" },
      { id: "forest-jacket", name: "Forest jacket" },
    ],
  },
  {
    slot: "pants",
    label: "Pants",
    options: [
      { id: "indigo-trousers", name: "Indigo trousers" },
      { id: "cocoa-trousers", name: "Cocoa trousers" },
    ],
  },
  {
    slot: "shoes",
    label: "Shoes",
    options: [
      { id: "canvas-sneakers", name: "Canvas sneakers" },
      { id: "hiking-boots", name: "Hiking boots" },
    ],
  },
];

export function wardrobeSelection(avatar: WardrobeAvatar, slot: WardrobeSlot) {
  const value = avatar[slot];
  if (
    STARTER_WARDROBE.find((s) => s.slot === slot)!.options.some(
      (o) => o.id === value,
    )
  )
    return value;
  if (slot === "hat")
    return value === undefined && avatar.top === "hat" ? "legacy-cap" : "none";
  if (slot === "clothing")
    return avatar.clothing === "hoodie"
      ? "forest-jacket"
      : avatar.clothing === "shirtCrewNeck"
        ? "linen-shirt"
        : avatar.clothing;
  return slot === "pants" ? "cocoa-trousers" : "hiking-boots";
}
