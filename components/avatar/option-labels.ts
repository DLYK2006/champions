import type { AvatarConfig } from "@/types";

const labels: Record<keyof AvatarConfig, Record<string, string>> = {
  skinColor: {
    ffdbb4: "Light peach",
    edb98a: "Golden beige",
    d08b5b: "Warm tan",
    ae5d29: "Rich caramel",
    "614335": "Deep brown",
  },
  hairColor: {
    "2c1b18": "Espresso",
    "724133": "Chestnut",
    b58143: "Copper",
    e8e1e1: "Silver",
    d6b370: "Honey",
  },
  top: {
    shortFlat: "Short & tidy",
    longHairStraight: "Long & straight",
    curly: "Curly",
    bun: "Little bun",
    hat: "Sage cap",
  },
  eyes: {
    default: "Bright eyes",
    happy: "Happy",
    wink: "A little wink",
    side: "Side glance",
  },
  mouth: {
    smile: "Smile",
    default: "Soft smile",
    twinkle: "Big grin",
    serious: "Calm",
  },
  clothing: {
    hoodie: "Woodland hoodie",
    graphicShirt: "Sunshine tee",
    shirtCrewNeck: "Cream tee",
    overall: "Overalls",
  },
};
export function avatarOptionLabel(key: keyof AvatarConfig, value: string) {
  return labels[key][value] ?? "Custom style";
}
