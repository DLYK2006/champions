import type { AvatarConfig } from "@/types";

// Optional appearance JSON fields; existing profiles and paid equipment stay valid.
export type WardrobeAvatar = AvatarConfig & { hat?: string; pants?: string; shoes?: string };
export type WardrobeSlot = "hat" | "clothing" | "pants" | "shoes";
export const STARTER_WARDROBE: readonly {
  slot: WardrobeSlot; label: string; options: readonly { id: string; name: string; color: string }[];
}[] = [
  { slot: "hat", label: "Hat", options: [
    { id: "moss-beanie", name: "Moss beanie", color: "#76916b" },
    { id: "straw-sunhat", name: "Straw sunhat", color: "#d7b46c" },
  ] },
  { slot: "clothing", label: "Clothes", options: [
    { id: "linen-shirt", name: "Linen shirt", color: "#e5cf9f" },
    { id: "forest-jacket", name: "Forest jacket", color: "#527548" },
  ] },
  { slot: "pants", label: "Pants", options: [
    { id: "indigo-trousers", name: "Indigo trousers", color: "#637c96" },
    { id: "cocoa-trousers", name: "Cocoa trousers", color: "#79563e" },
  ] },
  { slot: "shoes", label: "Shoes", options: [
    { id: "canvas-sneakers", name: "Canvas sneakers", color: "#e7debf" },
    { id: "hiking-boots", name: "Hiking boots", color: "#bd8c53" },
  ] },
];

export function wardrobeSelection(avatar: WardrobeAvatar, slot: WardrobeSlot) {
  const value = avatar[slot];
  if (STARTER_WARDROBE.find(s => s.slot === slot)!.options.some(o => o.id === value)) return value;
  if (slot === "hat") return "none";
  if (slot === "clothing") return avatar.clothing === "hoodie" ? "forest-jacket" : "linen-shirt";
  return slot === "pants" ? "cocoa-trousers" : "hiking-boots";
}
