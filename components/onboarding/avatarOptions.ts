// Starter option lists for screen 4. Values map onto AvatarConfig (types/index.ts).
// Jay's pixel renderer owns the real art; swap these lists when its option ids are final.
import type { AvatarConfig } from "../../types/index";

export const AVATAR_OPTIONS: Record<keyof AvatarConfig, readonly string[]> = {
  skinColor: ["ffdbb4", "edb98a", "d08b5b", "ae5d29", "614335"],
  top: ["shortFlat", "longHairStraight", "curly", "bun", "hat"],
  hairColor: ["2c1b18", "724133", "b58143", "e8e1e1", "d6b370"],
  eyes: ["default", "happy", "wink", "side"],
  mouth: ["smile", "default", "twinkle", "serious"],
  clothing: ["hoodie", "graphicShirt", "shirtCrewNeck", "overall"],
};

export const AVATAR_LABELS: Record<keyof AvatarConfig, string> = {
  skinColor: "Skin tone",
  top: "Hair",
  hairColor: "Hair color",
  eyes: "Eyes",
  mouth: "Mouth",
  clothing: "Outfit",
};

// Defaults are pre-picked so screen 4 is always valid.
export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: AVATAR_OPTIONS.skinColor[1],
  top: AVATAR_OPTIONS.top[0],
  hairColor: AVATAR_OPTIONS.hairColor[0],
  eyes: AVATAR_OPTIONS.eyes[0],
  mouth: AVATAR_OPTIONS.mouth[0],
  clothing: AVATAR_OPTIONS.clothing[0],
};
