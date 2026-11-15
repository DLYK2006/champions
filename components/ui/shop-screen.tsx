"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { AvatarConfig } from "@/types";
import { RoomCharacter } from "@/components/avatar/pixel-avatar";
import { Icon, type IconName } from "./icons";
import { CosmeticArt } from "@/components/avatar/cosmetic-art";
import { demoProfile, useDemo } from "./demo-context";
import { FacingControl } from "@/components/avatar/wardrobe-picker";
import type { Facing } from "@/components/world/wander";

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
}
export function ShopScreen({
  avatar,
  balance,
  owned,
  equipped,
  items,
  onBuy,
}: ShopScreenProps) {
  const [category, setCategory] = useState("All treasures");
  const [facing, setFacing] = useState<Facing>("down");
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const previewItem = items.find((item) => item.id === preview);
  const previewEquipment = previewItem
    ? [
        ...equipped.filter(
          (id) =>
            items.find((item) => item.id === id)?.category !==
              previewItem.category || previewItem.category === "Accessories",
        ),
        previewItem.id,
      ]
    : equipped;
  const visible = items.filter(
    (item) => category === "All treasures" || item.category === category,
  );
  async function buy(item: ShopItem) {
    if (inFlight.current || owned.includes(item.id) || balance < item.price)
      return;
    inFlight.current = true;
    setPending(item.id);
    setMessage("");
    setError("");
    try {
      await onBuy(item.id, item.price);
      setMessage(`${item.name} is now in your Wardrobe.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't complete the purchase. Try again.",
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
              config={avatar}
              equipped={previewEquipment}
              facing={facing}
            />
          </div>
          <FacingControl value={facing} onChange={setFacing} />
          {previewItem && (
            <div className="shop-preview-selection">
              <span>
                {previewItem.name} <small>Preview</small>
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => setPreview(null)}
              >
                Reset preview
              </button>
            </div>
          )}
        </aside>
        <section className="shop-catalog">
          <div className="shop-tabs" role="group" aria-label="Filter treasures">
            {["All treasures", "Outfits", "Hats", "Accessories"].map((tab) => (
              <button
                type="button"
                key={tab}
                aria-pressed={category === tab}
                onClick={() => setCategory(tab)}
              >
                {tab === "All treasures" ? "All" : tab}
              </button>
            ))}
          </div>
          <div className="shop-item-grid">
            {visible.map((item) => (
              <article
                className={`panel shop-card ${preview === item.id ? "is-selected" : ""}`}
                key={item.id}
              >
                <button
                  type="button"
                  className={`shop-item-preview item-${item.id}`}
                  aria-label={`Preview ${item.name}`}
                  aria-pressed={preview === item.id}
                  onClick={() => setPreview(item.id)}
                >
                  <CosmeticArt id={item.id} />
                  <span className="item-tag">
                    {owned.includes(item.id) ? "OWNED" : `${item.price} COINS`}
                  </span>
                </button>
                <h2 className="shop-item-name">{item.name}</h2>
                {owned.includes(item.id) ? (
                  <>
                    <Link
                      href="/profile?section=wardrobe"
                      className="button button-soft"
                    >
                      View in Wardrobe
                    </Link>
                    {equipped.includes(item.id) && (
                      <p className="shop-equipped">
                        <Icon name="check" size={13} /> Equipped
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={pending !== null || balance < item.price}
                    aria-label={`Buy ${item.name} for ${item.price} coins`}
                    onClick={() => void buy(item)}
                  >
                    {pending === item.id ? (
                      "Buying..."
                    ) : (
                      <>
                        <Icon name="coin" size={17} />
                        {item.price} coins
                      </>
                    )}
                  </button>
                )}
                {!owned.includes(item.id) && balance < item.price && (
                  <p className="fine-print">Not enough coins</p>
                )}
              </article>
            ))}
          </div>
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
  const { balance, owned, equipped, buy } = useDemo();
  return (
    <ShopScreen
      avatar={demoProfile.avatar}
      balance={balance}
      owned={owned}
      equipped={equipped}
      items={demoShopItems}
      onBuy={buy}
    />
  );
}
