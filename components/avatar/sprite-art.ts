import type { AvatarConfig } from "@/types";
import type { Facing } from "../world/wander";
import type { WardrobeAvatar } from "./wardrobe";

export const SPRITE_ATLAS = "/dig-in/adventurer-atlas.png";
const ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };
let imagePromise: Promise<HTMLImageElement> | null = null;
const variants = new Map<string, HTMLCanvasElement>();
// Footwear bounds in source cells: idle, extended stride, passing stride.
// Follow the raised foot as well as the planted foot; never repaint knee highlights.
const FEET = [
  [
    [
      [48, 107, 65, 124],
      [71, 107, 89, 124],
    ],
    [
      [48, 108, 65, 124],
      [71, 98, 89, 115],
    ],
    [
      [48, 102, 65, 121],
      [71, 106, 89, 124],
    ],
  ],
  [
    [[49, 108, 79, 124]],
    [
      [33, 107, 57, 124],
      [69, 108, 94, 124],
    ],
    [
      [62, 96, 82, 112],
      [57, 110, 79, 124],
    ],
  ],
  [
    [[50, 108, 80, 124]],
    [
      [37, 108, 62, 124],
      [79, 107, 104, 124],
    ],
    [
      [61, 110, 80, 124],
      [76, 96, 96, 112],
    ],
  ],
  [
    [
      [49, 108, 65, 124],
      [73, 108, 89, 124],
    ],
    [
      [53, 100, 69, 116],
      [71, 110, 87, 124],
    ],
    [
      [50, 110, 67, 124],
      [71, 98, 87, 115],
    ],
  ],
] as const;

function rgb(value: string | undefined, fallback: string) {
  const hex =
    value && /^#?[\da-f]{6}$/i.test(value) ? value.replace("#", "") : fallback;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
export function loadSpriteImage() {
  if (!imagePromise)
    imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        imagePromise = null;
        reject(new Error("Character artwork could not load."));
      };
      image.src = SPRITE_ATLAS;
    });
  return imagePromise;
}

export async function prepareSprite(
  config?: AvatarConfig,
  equipped: string[] = [],
  variant = 0,
) {
  const key = JSON.stringify([config, equipped.slice().sort(), variant]);
  const cached = variants.get(key);
  if (cached) return cached;
  const image = await loadSpriteImage();
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, 768, 512);
  // The painted walk cells vary their hair silhouette. Register a complete head,
  // rather than cutting holes in moving hair or letting it pop between frames.
  for (let row = 0; row < 4; row++)
    for (let col = 1; col < 6; col++) {
      if (col === 1 && row !== 3) continue; // Preserve the original blink drawing.
      ctx.clearRect(col * 128, row * 128, 128, 64);
      ctx.drawImage(
        canvas,
        0,
        row * 128,
        128,
        64,
        col * 128,
        row * 128,
        128,
        64,
      );
    }
  const appearance = config as WardrobeAvatar | undefined;
  const pixels = ctx.getImageData(0, 0, 768, 512),
    data = pixels.data;
  const skin = rgb(
    config?.skinColor,
    ["dca16e", "f0c29d", "ab7252", "eac399"][variant % 4],
  );
  const hair = rgb(
    config?.hairColor,
    ["643d29", "352f2b", "92512d", "573c32"][variant % 4],
  );
  const clothing =
    equipped.includes("hoodie") ||
    config?.clothing === "hoodie" ||
    config?.clothing === "forest-jacket"
      ? "527548"
      : config?.clothing === "overall"
        ? "688a94"
        : config?.clothing === "graphicShirt"
          ? "d4ab55"
          : "e5cf9f";
  const shirt = rgb(clothing, "e5cf9f");
  const pants = rgb(
    appearance?.pants === "indigo-trousers" ? "637c96" : "79563e",
    "79563e",
  );
  const shoes = rgb(
    appearance?.shoes === "canvas-sneakers" ? "e7debf" : "bd8c53",
    "bd8c53",
  );
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 768; x++) {
      const i = (y * 768 + x) * 4,
        r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        localY = y % 128,
        localX = x % 128,
        row = Math.floor(y / 128),
        col = Math.floor(x / 128),
        foot = FEET[row][col < 2 ? 0 : col % 2 === 0 ? 1 : 2].find(
          ([left, top, right, bottom]) =>
            localX >= left &&
            localX <= right &&
            localY >= top &&
            localY <= bottom,
        );
      // The generated alpha has very faint matte noise; do not carry it into the scene.
      if (data[i + 3] < 64) {
        data[i + 3] = 0;
        continue;
      }
      data[i + 3] = 255;
      let target: number[] | null = null,
        base = 1;
      const warm = r > g * 1.12 && g > b * 1.12;
      if (
        config?.top === "shortFlat" &&
        localY < 60 &&
        warm &&
        // Trim only the outside edge of a continuous crop, never a band through its middle.
        (localX < 43 + Math.max(0, localY - 30) * 0.5 ||
          localX > 95 - Math.max(0, localY - 30) * 0.45)
      ) {
        data[i + 3] = 0;
        continue;
      }
      const face =
        row !== 3 && localY > 25 && localY < 54 && r > 175 && g > 105 && warm;
      const hand =
        localY > 70 &&
        localY < 99 &&
        r > 175 &&
        g > 105 &&
        r > g * 1.2 &&
        g > b * 1.15;
      if (face || hand) {
        target = skin;
        base = 166;
      } else if (localY < 57 && warm && r > 43 && g > 24) {
        target = hair;
        base = 77;
      } else if (
        localY > 54 &&
        localY < 91 &&
        r > 125 &&
        g > 110 &&
        r / g < 1.24 &&
        b / g > 0.58
      ) {
        target = shirt;
        base = 191;
      } else if (foot && warm && r > 70 && g > 40) {
        target =
          appearance?.shoes === "canvas-sneakers" && localY < foot[3] - 8
            ? pants
            : shoes;
        base = 134;
      } else if (localY > 85 && warm && r > 43 && r < 165) {
        target = pants;
        base = 75;
      }
      if (target) {
        const light = (r * 0.2126 + g * 0.7152 + b * 0.0722) / base;
        for (let c = 0; c < 3; c++)
          data[i + c] = Math.min(255, Math.round(target[c] * light));
      }
    }
  ctx.putImageData(pixels, 0, 0);
  // Small cosmetic overlays augment the painted body; all locomotion comes from real sprite frames.
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      ctx.save();
      ctx.translate(col * 128, row * 128);
      const hairHex = `rgb(${hair.join(",")})`,
        skinHex = `rgb(${skin.join(",")})`;
      const hat = equipped.includes("crown") ? "none" : appearance?.hat;
      if (config?.top === "longHairStraight") {
        ctx.fillStyle = hairHex;
        const strands =
          row === 0 || row === 3
            ? [46, 48, 88, 90]
            : row === 1
              ? [82, 84]
              : [46, 48];
        for (const x of strands) ctx.fillRect(x, 31, 2, 29);
      }
      if (config?.top === "bun") {
        ctx.fillStyle = "#38291d";
        ctx.beginPath();
        ctx.ellipse(84, 8, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hairHex;
        ctx.fillRect(78, 4, 12, 8);
      }
      if (config?.top === "hat" && hat === undefined) {
        ctx.fillStyle = "#39432b";
        ctx.fillRect(49, 10, 39, 13);
        ctx.fillRect(43, 21, 51, 4);
        ctx.fillStyle = "#91a569";
        ctx.fillRect(51, 11, 35, 10);
        ctx.fillStyle = "#e0bf6c";
        ctx.fillRect(65, 13, 6, 5);
      }
      if (hat === "moss-beanie" || hat === "straw-sunhat") {
        const cx = [68, 64, 68, 67][row];
        ctx.clearRect(0, 0, 128, 23);
        if (hat === "moss-beanie") {
          ctx.fillStyle = "#344735";
          ctx.beginPath();
          ctx.moveTo(cx - 23, 25);
          ctx.lineTo(cx - 23, 14);
          ctx.lineTo(cx - 19, 7);
          ctx.lineTo(cx - 11, 2);
          ctx.lineTo(cx + 10, 2);
          ctx.lineTo(cx + 19, 7);
          ctx.lineTo(cx + 23, 15);
          ctx.lineTo(cx + 23, 25);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#78936b";
          ctx.fillRect(cx - 19, 12, 38, 12);
          ctx.fillRect(cx - 14, 7, 28, 9);
          ctx.fillStyle = "#91a47d";
          ctx.fillRect(cx - 12, 7, 5, 10);
          ctx.fillStyle = "#526e4d";
          ctx.fillRect(cx - 21, 20, 42, 7);
          ctx.fillStyle = "#adba8f";
          for (let x = cx - 18; x < cx + 20; x += 5) ctx.fillRect(x, 21, 1, 4);
          ctx.fillStyle = "#e7cf94";
          ctx.fillRect(cx + 10, 21, 6, 5);
        } else {
          ctx.fillStyle = "#674a2d";
          ctx.beginPath();
          ctx.moveTo(cx - 31, 24);
          ctx.lineTo(cx - 31, 19);
          ctx.lineTo(cx - 22, 15);
          ctx.lineTo(cx - 19, 5);
          ctx.lineTo(cx - 10, 1);
          ctx.lineTo(cx + 11, 1);
          ctx.lineTo(cx + 20, 5);
          ctx.lineTo(cx + 22, 15);
          ctx.lineTo(cx + 31, 19);
          ctx.lineTo(cx + 31, 24);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d5af64";
          ctx.fillRect(cx - 20, 7, 40, 13);
          ctx.fillRect(cx - 27, 19, 54, 4);
          ctx.fillStyle = "#f0d18b";
          ctx.fillRect(cx - 14, 4, 28, 9);
          ctx.fillRect(cx - 25, 19, 50, 2);
          ctx.fillStyle = "#6b7950";
          ctx.fillRect(cx - 20, 13, 40, 4);
          ctx.fillStyle = "#fff0b6";
          ctx.fillRect(cx + 10, 13, 3, 3);
        }
      }
      if (equipped.includes("crown")) {
        ctx.fillStyle = "#634625";
        ctx.beginPath();
        ctx.moveTo(48, 8);
        ctx.lineTo(56, 14);
        ctx.lineTo(61, 3);
        ctx.lineTo(69, 13);
        ctx.lineTo(79, 3);
        ctx.lineTo(84, 14);
        ctx.lineTo(91, 8);
        ctx.lineTo(88, 24);
        ctx.lineTo(51, 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e6b74e";
        ctx.fillRect(53, 16, 33, 6);
        ctx.fillStyle = "#ffe39a";
        ctx.fillRect(54, 17, 30, 2);
        ctx.fillStyle = "#67834c";
        ctx.fillRect(67, 17, 5, 5);
      }
      if (row === 0 && config?.eyes === "wink" && col !== 1) {
        ctx.fillStyle = skinHex;
        ctx.fillRect(74, 35, 9, 7);
        ctx.fillStyle = "#32251c";
        ctx.fillRect(74, 38, 8, 2);
      }
      if (row === 0 && config?.eyes === "happy" && col !== 1) {
        ctx.fillStyle = skinHex;
        ctx.fillRect(57, 35, 9, 7);
        ctx.fillRect(74, 35, 9, 7);
        ctx.strokeStyle = "#32251c";
        ctx.lineWidth = 2;
        for (const left of [58, 75]) {
          ctx.beginPath();
          ctx.moveTo(left, 39);
          ctx.lineTo(left + 3, 36);
          ctx.lineTo(left + 6, 39);
          ctx.stroke();
        }
      }
      if (row === 0 && config?.eyes === "side" && col !== 1) {
        for (const x of [57, 74]) {
          ctx.fillStyle = "#fff0ce";
          ctx.fillRect(x, 35, 9, 7);
          ctx.fillStyle = "#33251d";
          ctx.fillRect(x + 5, 36, 3, 6);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + 5, 36, 1, 2);
        }
      }
      if (row === 0 && config?.mouth === "default") {
        ctx.fillStyle = skinHex;
        ctx.fillRect(66, 46, 9, 6);
        ctx.fillStyle = "#85533c";
        ctx.fillRect(69, 48, 3, 3);
        ctx.fillStyle = skinHex;
        ctx.fillRect(70, 49, 1, 1);
      }
      if (row === 0 && config?.mouth === "serious") {
        ctx.fillStyle = skinHex;
        ctx.fillRect(66, 46, 9, 5);
        ctx.fillStyle = "#85533c";
        ctx.fillRect(67, 48, 7, 1);
      }
      if (row === 0 && config?.mouth === "twinkle") {
        ctx.fillStyle = "#744433";
        ctx.fillRect(67, 47, 7, 4);
        ctx.fillStyle = "#e19d7a";
        ctx.fillRect(69, 49, 4, 2);
      }
      if (equipped.includes("sunglasses") && row !== 3) {
        const lenses = row === 0 ? [56, 73] : row === 1 ? [46] : [78];
        for (const left of lenses) {
          ctx.fillStyle = "#ad8d4b";
          ctx.fillRect(left - 1, 34, 13, 9);
          ctx.fillStyle = "#293d37";
          ctx.fillRect(left, 35, 11, 7);
          ctx.fillStyle = "#86ac99";
          ctx.fillRect(left + 2, 36, 5, 1);
        }
        ctx.fillStyle = "#61472e";
        ctx.fillRect(
          row === 0 ? 68 : row === 1 ? 57 : 68,
          36,
          row === 0 ? 5 : 10,
          2,
        );
      }
      ctx.restore();
    }
  variants.set(key, canvas);
  if (variants.size > 8) variants.delete(variants.keys().next().value!);
  return canvas;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  x: number,
  y: number,
  facing: Facing,
  frame: number,
  height = 128,
  shadow = true,
) {
  const row = ROW[facing],
    scale = height / 124,
    anchorX = [68, 64, 68, 67][row];
  if (shadow) {
    ctx.save();
    ctx.fillStyle = "#263d2e30";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 23 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#26352b20";
    ctx.beginPath();
    ctx.ellipse(x, y, 13 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    atlas,
    frame * 128,
    row * 128,
    128,
    128,
    Math.round(x - anchorX * scale),
    Math.round(y - 124 * scale),
    128 * scale,
    128 * scale,
  );
}
