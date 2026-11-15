// Shop controller logic: maps database rows onto Jay's ShopScreen and turns server errors into friendly text.
// Pure functions (no React, no Supabase) so they can be unit tested. Owner: @joshuatsou123 (proposed, see board).
import type { ShopItem } from "../../components/ui/shop-screen";
import type { Avatar } from "../../types/index";

/** A row of public.shop_items (supabase/migrations/0001_core.sql). The server's price is the only price. */
export interface ShopItemRow { id: string; name: string; category: string; cost: number; asset_ref: string }

const UI_CATEGORY: Record<string, ShopItem["category"]> = {
  clothing: "Outfits",
  headwear: "Hats",
  accessory: "Accessories",
};

/**
 * Database rows -> ShopScreen items. `presentation` is the UI's item list (name, icon, description by id);
 * price and which items exist always come from the database. Unknown ids still render, with a neutral look.
 */
export function toShopItems(rows: readonly ShopItemRow[], presentation: readonly ShopItem[]): ShopItem[] {
  const byId = new Map(presentation.map((p) => [p.id, p]));
  return [...rows]
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
    .map((row) => {
      const look = byId.get(row.id);
      return {
        id: row.id,
        name: look?.name ?? row.name,
        price: row.cost,
        category: UI_CATEGORY[row.category] ?? look?.category ?? "Accessories",
        icon: look?.icon ?? "spark",
        description: look?.description ?? "A little something new.",
      };
    });
}

const FRIENDLY: Array<[RegExp, string]> = [
  [/not enough coins/i, "Not enough coins yet. Keep logging meals to earn more."],
  [/already owned/i, "You already own this one."],
  [/unknown item/i, "That treasure isn't in the shop right now."],
  [/not owned/i, "Buy it first, then you can wear it."],
  [/not signed in/i, "Sign in to use the shop."],
];
export const GENERIC_SHOP_ERROR = "That didn't work. Your coins are safe; try again.";

/** Server exception text -> a message safe to show. Never echoes raw database errors. */
export function friendlyShopError(message: string | undefined | null): string {
  if (!message) return GENERIC_SHOP_ERROR;
  return FRIENDLY.find(([re]) => re.test(message))?.[1] ?? GENERIC_SHOP_ERROR;
}

/** equip_item takes an explicit on/off; the screen's onEquip(id) is a toggle. */
export const nextEquipState = (equipped: readonly string[], id: string) => !equipped.includes(id);

const CORE_AVATAR_KEYS = ["skinColor", "top", "hairColor", "eyes", "mouth", "clothing"] as const;
const WARDROBE_KEYS = ["hat", "pants", "shoes"] as const;
const AVATAR_VALUE = /^[A-Za-z0-9#_-]{1,40}$/;

/** The avatar JSON that is safe to save: the six core keys are required; hat/pants/shoes are kept when valid;
 *  anything else is dropped. Throws a user-safe Error when the avatar is unusable. */
export function sanitizeAvatar(input: Record<string, unknown>): Avatar {
  const out: Record<string, string> = {};
  for (const key of CORE_AVATAR_KEYS) {
    const v = input[key];
    if (typeof v !== "string" || !AVATAR_VALUE.test(v)) throw new Error("Couldn't save that look. Try again.");
    out[key] = v;
  }
  for (const key of WARDROBE_KEYS) {
    const v = input[key];
    if (typeof v === "string" && AVATAR_VALUE.test(v)) out[key] = v;
  }
  return out as unknown as Avatar;
}
