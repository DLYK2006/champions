"use client";

import { useRef, useState } from "react";
import type { AvatarConfig } from "@/types";
import { RoomCharacter } from "@/components/avatar/pixel-avatar";
import { Icon, type IconName } from "./icons";
import { CosmeticArt } from "@/components/avatar/cosmetic-art";
import { demoProfile, useDemo } from "./demo-context";
import {
  FacingControl,
  WardrobePicker,
} from "@/components/avatar/wardrobe-picker";
import type { WardrobeAvatar } from "@/components/avatar/wardrobe";
import type { Facing } from "@/components/world/wander";
import { DEFAULT_AVATAR } from "@/components/onboarding/avatarOptions";

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: "Outfits" | "Hats" | "Accessories";
  icon: IconName;
  description: string;
}
export const demoShopItems: ShopItem[] = [
  {
    id: "hoodie",
    name: "Woodland Hoodie",
    price: 40,
    category: "Outfits",
    icon: "shirt",
    description: "A cozy layer for everyday adventures.",
  },
  {
    id: "sunglasses",
    name: "Sunglasses",
    price: 20,
    category: "Accessories",
    icon: "glasses",
    description: "A little sunshine, a little cool.",
  },
  {
    id: "crown",
    name: "Crown",
    price: 60,
    category: "Hats",
    icon: "crown",
    description: "For the ruler of little victories.",
  },
];
export interface ShopScreenProps {
  avatar?: AvatarConfig;
  balance: number;
  owned: string[];
  equipped: string[];
  items: ShopItem[];
  onBuy: (id: string, price: number) => Promise<void>;
  onEquip: (id: string) => Promise<void>;
  onSaveAvatar?: (avatar: WardrobeAvatar) => Promise<void>;
}
export function ShopScreen({
  avatar,
  balance,
  owned,
  equipped,
  items,
  onBuy,
  onEquip,
  onSaveAvatar,
}: ShopScreenProps) {
  const [category, setCategory] = useState("All treasures");
  const [mode, setMode] = useState<"coin" | "starter">("coin");
  const [draft, setDraft] = useState<WardrobeAvatar | null>(null);
  const [facing, setFacing] = useState<Facing>("down");
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const appearance = draft ?? avatar ?? DEFAULT_AVATAR;
  const dirty =
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(avatar ?? DEFAULT_AVATAR);
  const previewEquipment =
    preview && !equipped.includes(preview) ? [...equipped, preview] : equipped;
  const visible = items.filter(
    (item) => category === "All treasures" || item.category === category,
  );
  async function act(item: ShopItem) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(item.id);
    setMessage("");
    setError("");
    try {
      if (owned.includes(item.id)) {
        await onEquip(item.id);
        setMessage(
          `${item.name} ${equipped.includes(item.id) ? "unequipped" : "equipped"}.`,
        );
      } else {
        await onBuy(item.id, item.price);
        setMessage(`${item.name} is now in your collection.`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That didn’t work. Your coins are safe; try again.",
      );
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }
  async function saveOutfit() {
    if (inFlight.current || !onSaveAvatar || !dirty) return;
    inFlight.current = true;
    setPending("avatar");
    setMessage("");
    setError("");
    try {
      await onSaveAvatar(appearance);
      setDraft(null);
      setMessage("Outfit saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save your outfit. Try again.",
      );
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }
  return (
    <main className="shop-page">
      <div className="screen-title-row">
        <h1 className="screen-title">Shop</h1>
        <span className="coin-wallet" aria-label="Shop coin balance">
          <Icon name="coin" size={21} />
          {balance}
        </span>
      </div>
      <div className="shop-grid">
        <aside className="panel wardrobe-panel" aria-label="Character preview">
          <div className="wardrobe-stage">
            <RoomCharacter
              config={appearance}
              equipped={previewEquipment}
              facing={facing}
            />
          </div>
          <FacingControl value={facing} onChange={setFacing} />
          {preview && (
            <div className="shop-preview-selection">
              <span>{items.find((item) => item.id === preview)?.name}</span>
              <button className="text-button" onClick={() => setPreview(null)}>
                Reset preview
              </button>
            </div>
          )}
        </aside>
        <section className="shop-catalog">
          <div
            className="wardrobe-mode"
            role="group"
            aria-label="Shop collection"
          >
            <button
              type="button"
              disabled={pending !== null}
              aria-pressed={mode === "coin"}
              onClick={() => {
                setMode("coin");
                setPreview(null);
              }}
            >
              Coin shop
            </button>
            <button
              type="button"
              disabled={pending !== null}
              aria-pressed={mode === "starter"}
              onClick={() => {
                setMode("starter");
                setPreview(null);
              }}
            >
              Starter wardrobe
            </button>
          </div>
          {mode === "starter" ? (
            <div className="panel starter-panel">
              <WardrobePicker
                avatar={appearance}
                disabled={pending !== null}
                onChange={(next) => {
                  setDraft(next);
                  setMessage("");
                  setError("");
                }}
              />
              {equipped.some((id) => id === "hoodie" || id === "crown") && (
                <p className="fine-print">
                  Your equipped shop items layer over this outfit.
                </p>
              )}
              <div className="wardrobe-actions">
                <button
                  type="button"
                  className="button button-soft"
                  disabled={pending !== null || !dirty}
                  onClick={() => {
                    setDraft(null);
                    setError("");
                    setMessage("");
                  }}
                >
                  Reset outfit
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={pending !== null || !dirty || !onSaveAvatar}
                  onClick={() => void saveOutfit()}
                >
                  {pending === "avatar" ? "Saving outfit…" : "Save outfit"}
                </button>
              </div>
              {!onSaveAvatar && <p className="fine-print">Preview only</p>}
            </div>
          ) : (
            <>
              <div
                className="shop-tabs"
                role="group"
                aria-label="Filter treasures"
              >
                {["All treasures", "Outfits", "Hats", "Accessories"].map(
                  (tab) => (
                    <button
                      key={tab}
                      aria-pressed={category === tab}
                      onClick={() => setCategory(tab)}
                    >
                      {tab === "All treasures" ? "All" : tab}
                    </button>
                  ),
                )}
              </div>
              <div className="shop-item-grid">
                {visible.map((item) => (
                  <article
                    className={`panel shop-card ${preview === item.id ? "is-selected" : ""}`}
                    key={item.id}
                  >
                    <button
                      className={`shop-item-preview item-${item.id}`}
                      aria-label={`Preview ${item.name}`}
                      aria-pressed={preview === item.id}
                      onClick={() => setPreview(item.id)}
                    >
                      <CosmeticArt id={item.id} />
                      <span className="item-tag">
                        {equipped.includes(item.id)
                          ? "EQUIPPED"
                          : owned.includes(item.id)
                            ? "OWNED"
                            : `${item.price} COINS`}
                      </span>
                    </button>
                    <h2 className="shop-item-name">{item.name}</h2>
                    <button
                      className={`button ${owned.includes(item.id) ? "button-soft" : "button-primary"}`}
                      disabled={
                        pending !== null ||
                        (!owned.includes(item.id) && balance < item.price)
                      }
                      aria-label={
                        owned.includes(item.id)
                          ? `${equipped.includes(item.id) ? "Unequip" : "Equip"} ${item.name}`
                          : `Buy ${item.name} for ${item.price} coins`
                      }
                      onClick={() => act(item)}
                    >
                      {pending === item.id ? (
                        "Saving…"
                      ) : owned.includes(item.id) ? (
                        <>
                          <Icon
                            name={
                              equipped.includes(item.id) ? "check" : "shirt"
                            }
                            size={15}
                          />
                          {equipped.includes(item.id) ? "Unequip" : "Equip"}
                        </>
                      ) : (
                        <>
                          <Icon name="coin" size={17} />
                          {item.price} · Buy
                        </>
                      )}
                    </button>
                    {!owned.includes(item.id) && balance < item.price && (
                      <p className="fine-print">Not enough coins</p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="shop-status" role="status" aria-live="polite">
            {message}
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export function DemoShop() {
  const { balance, owned, equipped, buy, equip } = useDemo();
  return (
    <ShopScreen
      avatar={demoProfile.avatar}
      balance={balance}
      owned={owned}
      equipped={equipped}
      items={demoShopItems}
      onBuy={buy}
      onEquip={equip}
    />
  );
}
