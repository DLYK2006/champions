"use client";

import type { AvatarConfig } from "@/types";
import type { Facing } from "../world/wander";
import { SpriteCharacter } from "./sprite-character";

// Backwards-compatible portrait API, backed by the same sprite as every game scene.
export function PixelAvatar({ config, equipped = [], size = 48, name = "", variant = 0, transparent = false, facing = "down" }: {
  config?: AvatarConfig; equipped?: string[]; size?: number; name?: string;
  variant?: number; transparent?: boolean; facing?: Facing;
}) {
  return <span className={`pixel-avatar sprite-portrait ${transparent ? "is-transparent" : ""}`} style={{ width: size, height: size }} aria-hidden={!name || undefined}>
    <SpriteCharacter config={config} equipped={equipped} name={name || "Pixel adventurer"} variant={variant} facing={facing} />
  </span>;
}

export { SpriteCharacter as RoomCharacter } from "./sprite-character";
