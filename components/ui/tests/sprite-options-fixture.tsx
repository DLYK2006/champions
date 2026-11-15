"use client";

import { useState } from "react";
import { prepareSprite } from "@/components/avatar/sprite-art";
import {
  AVATAR_OPTIONS,
  DEFAULT_AVATAR,
} from "@/components/onboarding/avatarOptions";
import type { AvatarConfig } from "@/types";

export function SpriteOptionsFixture() {
  const [report, setReport] = useState("");
  async function check() {
    async function fingerprint(config: AvatarConfig, items: string[] = []) {
      const atlas = await prepareSprite(config, items);
      const pixels = atlas
        .getContext("2d")!
        .getImageData(0, 0, atlas.width, atlas.height).data;
      let hash = 2166136261;
      for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
      return hash >>> 0;
    }
    const result: Record<string, number> = {};
    for (const [key, options] of Object.entries(AVATAR_OPTIONS)) {
      const hashes = new Set<number>();
      for (const option of options)
        hashes.add(await fingerprint({ ...DEFAULT_AVATAR, [key]: option }));
      result[key] = hashes.size;
    }
    const items = new Set<number>();
    for (const equipment of [[], ["hoodie"], ["crown"], ["sunglasses"]])
      items.add(
        await fingerprint(
          { ...DEFAULT_AVATAR, clothing: "shirtCrewNeck" },
          equipment,
        ),
      );
    result.equipment = items.size;
    setReport(JSON.stringify(result));
  }
  return (
    <>
      <button className="button" onClick={() => void check()}>
        Check sprite options
      </button>
      <output aria-label="Sprite option results">{report}</output>
    </>
  );
}
