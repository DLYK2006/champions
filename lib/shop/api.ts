// Real shop data: loads items + the player's balance/inventory, and calls the buy/equip RPCs
// (supabase/migrations/0001_core.sql, Daren). Coins only change on the server; nothing here is optimistic.
import { createClient } from "../supabase/client";
import type { Avatar } from "../../types/index";
import type { ShopItem } from "../../components/ui/shop-screen";
import { notifyProfileUpdated } from "../settings/settings";
import { GENERIC_SHOP_ERROR, friendlyShopError, sanitizeAvatar, toShopItems, type ShopItemRow } from "./shop";

export interface ShopState {
  items: ShopItem[];
  avatar: Avatar | undefined;
  balance: number;
  owned: string[];
  equipped: string[];
}

/** Loads everything the Shop page shows. Throws an Error with a user-safe message. */
export async function loadShop(presentation: readonly ShopItem[]): Promise<ShopState> {
  const supabase = createClient();
  const [items, profile, inventory] = await Promise.all([
    supabase.from("shop_items").select("id, name, category, cost, asset_ref"),
    supabase.from("profiles").select("avatar, coin_balance, equipped").maybeSingle(),
    supabase.from("inventory").select("item_id"),
  ]);
  if (items.error || profile.error || inventory.error) throw new Error(GENERIC_SHOP_ERROR);
  if (!profile.data) throw new Error("Finish onboarding to use the shop.");

  const avatar = profile.data.avatar as Partial<Avatar> | null;
  return {
    items: toShopItems((items.data ?? []) as ShopItemRow[], presentation),
    avatar: avatar && Object.keys(avatar).length ? (avatar as Avatar) : undefined,
    balance: profile.data.coin_balance as number,
    owned: (inventory.data ?? []).map((r) => r.item_id as string),
    equipped: (profile.data.equipped as string[] | null) ?? [],
  };
}

/** Buys an item at the server's price. Returns the new coin balance. */
export async function buyItem(id: string): Promise<number> {
  const { data, error } = await createClient().rpc("buy_item", { p_item_id: id });
  if (error) throw new Error(friendlyShopError(error.message));
  notifyProfileUpdated();
  return (data as { coin_balance: number }).coin_balance;
}

/** Equips or unequips an owned item. Returns the full equipped list. */
export async function equipItem(id: string, equipped: boolean): Promise<string[]> {
  const { data, error } = await createClient().rpc("equip_item", { p_item_id: id, p_equipped: equipped });
  if (error) throw new Error(friendlyShopError(error.message));
  notifyProfileUpdated();
  return (data as { equipped: string[] }).equipped;
}

/** Saves the player's look to profiles.avatar (the column clients may update; no coins or items change).
 *  Returns what was saved so the screen can show the authoritative value. */
export async function saveAvatar(avatar: Avatar): Promise<Avatar> {
  const clean = sanitizeAvatar(avatar as unknown as Record<string, unknown>);
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) throw new Error("Sign in to save your look.");
  const { data, error } = await supabase.from("profiles").update({ avatar: clean }).eq("id", uid).select("avatar").maybeSingle();
  if (error || !data) throw new Error("Couldn't save that look. Try again.");
  notifyProfileUpdated();
  return sanitizeAvatar(data.avatar as Record<string, unknown>);
}
