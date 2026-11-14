// Shop controller logic: maps database rows onto Jay's ShopScreen and turns server errors into friendly text.
// Pure functions (no React, no Supabase) so they can be unit tested. Owner: @joshuatsou123 (proposed, see board).
import type { ShopItem } from "../../components/ui/shop-screen";

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
