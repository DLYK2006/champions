"use client";

import { useState } from "react";
import { prepareSprite } from "@/components/avatar/sprite-art";
import { PixelAvatar } from "@/components/avatar";
import { DEFAULT_AVATAR } from "@/components/onboarding/avatarOptions";
import { drawSprite } from "@/components/avatar/sprite-art";
import {
  STARTER_WARDROBE,
  type WardrobeAvatar,
} from "@/components/avatar/wardrobe";
import { ShopScreen, demoShopItems } from "../shop-screen";

export default function WardrobeFixture() {
  const [report, setReport] = useState("");
  const [avatar, setAvatar] = useState<WardrobeAvatar>({ ...DEFAULT_AVATAR });
  const [reject, setReject] = useState(false);
  const [saved, setSaved] = useState("");
  async function inspect() {
    const result: Record<string, number[]> = {};
    for (const top of ["shortFlat", "curly"]) {
      const atlas = await prepareSprite({ ...DEFAULT_AVATAR, top });
      const ctx = atlas.getContext("2d")!;
      result[top] = Array.from({ length: 6 }, (_, col) => {
        const data = ctx.getImageData(col * 128, 384, 128, 64).data;
        let hash = 2166136261;
        for (const value of data) hash = Math.imul(hash ^ value, 16777619);
        return hash >>> 0;
      });
    }
    const legacy = [];
    for (const [hat, top, equipped] of [
      [undefined, "hat", []],
      ["none", "hat", []],
      [undefined, "hat", ["crown"]],
      [undefined, "curly", ["crown"]],
    ] as const) {
      const a = await prepareSprite(
        { ...DEFAULT_AVATAR, top, ...(hat ? { hat } : {}) },
        [...equipped],
      );
      let hash = 2166136261;
      for (const value of a
        .getContext("2d")!
        .getImageData(0, 0, a.width, a.height).data)
        hash = Math.imul(hash ^ value, 16777619);
      legacy.push(hash >>> 0);
    }
    result._legacy = legacy;
    setReport(JSON.stringify(result));
  }
  async function sheet() {
    const canvas = document.querySelector<HTMLCanvasElement>("#contact-sheet")!;
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ede9cf";
    ctx.fillRect(0, 0, 1024, 1024);
    const hashes: Record<string, number[]> = {};
    let row = 0;
    for (const slot of STARTER_WARDROBE) {
      for (const item of slot.options) {
        const a = await prepareSprite({
          ...DEFAULT_AVATAR,
          [slot.slot]: item.id,
        });
        let col = 0;
        for (const facing of ["down", "left", "right", "up"] as const)
          for (const frame of [0, 3]) {
            drawSprite(
              ctx,
              a,
              col * 128 + 64,
              row * 128 + 124,
              facing,
              frame,
              115,
            );
            col++;
          }
        for (let direction = 0; direction < 4; direction++) {
          const key = slot.slot + direction;
          hashes[key] ??= [];
          const pixels = a
            .getContext("2d")!
            .getImageData(0, direction * 128, 768, 128).data;
          let hash = 2166136261;
          for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
          hashes[key].push(hash >>> 0);
        }
        row++;
      }
    }
    hashes._combinations = [];
    hashes._bodyMasks = [];
    for (let bits = 0; bits < 16; bits++) {
      const outfit: WardrobeAvatar = { ...DEFAULT_AVATAR };
      STARTER_WARDROBE.forEach((slot, index) => {
        outfit[slot.slot] = slot.options[(bits >> index) & 1].id;
      });
      const a = await prepareSprite(outfit);
      const pixels = a.getContext("2d")!.getImageData(0, 0, 768, 512).data;
      let hash = 2166136261,
        alpha = 2166136261;
      for (let i = 0; i < pixels.length; i++) {
        hash = Math.imul(hash ^ pixels[i], 16777619);
        if (i % 4 === 3 && Math.floor(i / 4 / 768) % 128 >= 64)
          alpha = Math.imul(alpha ^ pixels[i], 16777619);
      }
      hashes._combinations.push(hash >>> 0);
      hashes._bodyMasks.push(alpha >>> 0);
    }
    document.querySelector("#sheet-report")!.textContent =
      JSON.stringify(hashes);
  }
  return (
    <main>
      <PixelAvatar
        config={DEFAULT_AVATAR}
        size={155}
        name="Unified avatar preview"
      />
      <button onClick={() => void inspect()}>Inspect rear hair</button>
      <output aria-label="Hair frame report">{report}</output>
      <button onClick={() => void sheet()}>Render wardrobe sheet</button>
      <output id="sheet-report" aria-label="Wardrobe pixel report" />
      <canvas id="contact-sheet" aria-label="Wardrobe contact sheet" />
      <button onClick={() => setReject((value) => !value)}>
        Toggle save rejection
      </button>
      <output aria-label="Saved wardrobe">{saved}</output>
      <div className="dig-app compact-app route-shop">
        <div className="app-main">
          <ShopScreen
            avatar={avatar}
            balance={0}
            owned={[]}
            equipped={[]}
            items={demoShopItems}
            onBuy={async () => {
              throw Error("Not part of wardrobe check");
            }}
            onEquip={async () => {}}
            onSaveAvatar={async (next) => {
              await new Promise((resolve) => setTimeout(resolve, 400));
              if (reject) throw Error("Wardrobe save failed");
              setAvatar(next);
              setSaved(JSON.stringify(next));
            }}
          />
        </div>
      </div>
    </main>
  );
}
