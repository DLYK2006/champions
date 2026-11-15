// Draws the share card on a canvas (browser only). Owner: @DLYK2006
import type { ShareData } from "./data";

export const CARD_W = 1080;
export const CARD_H = 1350; // 4:5, fits Instagram feed and stories

// Same thresholds and art as components/world/garden.tsx (PRD 10.3), so the card matches the app.
export const gardenStage = (p: number) => (p >= 100 ? 4 : p >= 80 ? 3 : p >= 60 ? 2 : p >= 25 ? 1 : 0);
const GROWTH_OPACITY = [0, 0.2, 0.65, 0.9, 1];

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });

export const svgToImage = (svg: SVGSVGElement) =>
  loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`);

// Lines of text under the picture. Counts and statuses only, never intake numbers.
export function cardLines(d: ShareData): string[] {
  return [
    d.streak ? `${d.streak}-day streak` : "Starting a new streak",
    `${d.mealsToday} ${d.mealsToday === 1 ? "meal" : "meals"} logged today${d.goalMet ? " · goal met" : ""}`,
    d.group ? `${d.group.name}: ${Math.round(d.group.completion)}% of the group made it today` : "Growing at my own pace",
  ];
}

// scene: [starter, grown] garden images when in a group, or [room] when solo; avatar is the user's PixelAvatar.
export function drawCard(ctx: CanvasRenderingContext2D, d: ShareData, scene: HTMLImageElement[], avatar: HTMLImageElement, font: string) {
  ctx.fillStyle = "#FBF4E4";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = "#2F3B26";
  ctx.font = `700 64px ${font}`;
  ctx.fillText("DIG IN", 72, 120);
  ctx.font = `500 40px ${font}`;
  ctx.fillStyle = "#6B6146";
  ctx.fillText(`@${d.username}`, 72, 178);

  // Picture: 936 x 624 (3:2, the art's ratio) with the avatar in front.
  const x = 72, y = 230, w = 936, h = 624;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.clip();
  ctx.drawImage(scene[0], x, y, w, h);
  if (d.group && scene[1]) {
    ctx.globalAlpha = GROWTH_OPACITY[gardenStage(d.group.completion)];
    ctx.drawImage(scene[1], x, y, w, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.imageSmoothingEnabled = false; // keep the pixel avatar crisp
  ctx.drawImage(avatar, x + w / 2 - 120, y + h - 300, 240, 240);
  ctx.imageSmoothingEnabled = true;

  cardLines(d).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#2F3B26" : "#4A4433";
    ctx.font = `${i === 0 ? 700 : 500} ${i === 0 ? 60 : 42}px ${font}`;
    ctx.fillText(line, 72, 960 + i * 84, CARD_W - 144);
  });

  ctx.fillStyle = "#8E805E";
  ctx.font = `500 32px ${font}`;
  ctx.fillText("Small steps. A world of progress.", 72, CARD_H - 72);
}
