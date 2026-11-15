"use client";
import type { Avatar } from "@/types";
import type { ShopItem } from "@/components/ui/shop-screen";
import {
  STARTER_WARDROBE,
  wardrobeSelection,
  type WardrobeSlot,
} from "@/components/avatar/wardrobe";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { clearEquipmentSlot, toggleOwnedItem } from "./outfit";

export function OwnedWardrobe({
  avatar,
  equipped,
  owned,
  items,
  pending,
  dirty,
  onChange,
  onSave,
  onReset,
}: {
  avatar: Avatar;
  equipped: string[];
  owned: string[];
  items: ShopItem[];
  pending: boolean;
  dirty: boolean;
  onChange: (avatar: Avatar, equipped: string[]) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const category: Record<WardrobeSlot, string> = {
    hat: "Hats",
    clothing: "Outfits",
    pants: "Pants",
    shoes: "Shoes",
  };
  function starter(slot: WardrobeSlot, id: string) {
    onChange(
      { ...avatar, [slot]: id },
      clearEquipmentSlot(equipped, items, slot),
    );
  }
  const paid = (item: ShopItem) => (
    <button
      type="button"
      key={item.id}
      aria-label={item.name}
      aria-pressed={equipped.includes(item.id)}
      onClick={() =>
        onChange(avatar, toggleOwnedItem(equipped, owned, items, item.id))
      }
    >
      <PixelAvatar config={avatar} equipped={[item.id]} size={54} transparent />
      <span>
        {item.name}
        <small>OWNED</small>
      </span>
      <span aria-hidden="true">
        {equipped.includes(item.id) ? "\u2713" : "+"}
      </span>
    </button>
  );
  return (
    <div className="starter-wardrobe profile-wardrobe">
      {STARTER_WARDROBE.map(({ slot, label, options }) => {
        const hasPaid = items.some(
          (i) => i.category === category[slot] && equipped.includes(i.id),
        );
        return (
          <fieldset key={slot} className="wardrobe-slot" disabled={pending}>
            <legend>{label}</legend>
            <div className="wardrobe-options">
              {options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  aria-label={option.name}
                  aria-pressed={
                    !hasPaid && wardrobeSelection(avatar, slot) === option.id
                  }
                  onClick={() => starter(slot, option.id)}
                >
                  <PixelAvatar
                    config={{ ...avatar, [slot]: option.id }}
                    size={54}
                    transparent
                  />
                  <span>
                    {option.name}
                    <small>OWNED</small>
                  </span>
                  <span aria-hidden="true">
                    {!hasPaid && wardrobeSelection(avatar, slot) === option.id
                      ? "\u2713"
                      : "+"}
                  </span>
                </button>
              ))}
              {items
                .filter(
                  (i) => i.category === category[slot] && owned.includes(i.id),
                )
                .map(paid)}
            </div>
            {slot === "hat" && (
              <button
                className="wardrobe-no-hat"
                type="button"
                aria-pressed={
                  !hasPaid && wardrobeSelection(avatar, slot) === "none"
                }
                onClick={() => starter(slot, "none")}
              >
                No hat
              </button>
            )}
          </fieldset>
        );
      })}
      <fieldset className="wardrobe-slot" disabled={pending}>
        <legend>Accessories</legend>
        <div className="wardrobe-options">
          {items
            .filter((i) => i.category === "Accessories" && owned.includes(i.id))
            .map(paid)}
        </div>
        {!items.some(
          (i) => i.category === "Accessories" && owned.includes(i.id),
        ) && <p className="profile-hint">No accessories owned yet.</p>}
      </fieldset>
      <div className="profile-actions">
        <button
          className="button button-soft"
          type="button"
          disabled={pending || !dirty}
          onClick={onReset}
        >
          Reset Changes
        </button>
        <button
          className="button button-primary"
          type="button"
          disabled={pending || !dirty}
          onClick={onSave}
        >
          {pending ? "Saving..." : "Save Outfit"}
        </button>
      </div>
    </div>
  );
}
