import type { ShareData } from "@/lib/share/data";

export function shareCardText(data: ShareData) {
  return [
    data.streak ? `${data.streak}-day streak` : "Starting a new streak",
    `${data.mealsToday} ${data.mealsToday === 1 ? "meal" : "meals"} logged today${data.goalMet ? " | Goal met" : ""}`,
  ];
}

// Same original pixel palette and sprite assets as the app; export contains no intake data.
export function drawProgressCard(
  ctx: CanvasRenderingContext2D,
  data: ShareData,
  scenes: HTMLImageElement[],
  avatar: CanvasImageSource,
  font: string,
) {
  ctx.save();
  ctx.fillStyle = "#fbf4e4";
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = "#d8c9a8";
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 1024, 1294);

  const letters: Record<string, string[]> = {
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    G: ["01111", "10000", "10000", "10111", "10001", "10001", "01110"],
    N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  };
  let cursor = 64;
  ctx.fillStyle = "#2f5038";
  for (const letter of "DIG IN") {
    if (letter === " ") { cursor += 28; continue; }
    letters[letter].forEach((line, y) => [...line].forEach((pixel, x) => {
      if (pixel === "1") ctx.fillRect(cursor + x * 11, 78 + y * 11, 11, 11);
    }));
    cursor += 66;
  }
  // A small pixel sprout balances the wordmark.
  ctx.fillStyle = "#547547";
  ctx.fillRect(954, 108, 9, 46);
  ctx.fillRect(928, 87, 26, 22);
  ctx.fillRect(938, 99, 26, 17);
  ctx.fillStyle = "#95aa62";
  ctx.fillRect(963, 76, 28, 24);
  ctx.fillRect(956, 94, 20, 18);

  const x = 64, y = 218, width = 952, height = width * 2 / 3;
  ctx.fillStyle = "#8b9b63";
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, width + 10, height + 10, 19);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 14);
  ctx.clip();
  ctx.drawImage(scenes[0], x, y, width, height);
  if (data.group && scenes[1]) {
    const progress = data.group.completion;
    ctx.globalAlpha = progress >= 100 ? 1 : progress >= 80 ? 0.9 : progress >= 60 ? 0.65 : progress >= 25 ? 0.2 : 0;
    ctx.drawImage(scenes[1], x, y, width, height);
    ctx.globalAlpha = 1;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(avatar, x + width / 2 - 120, y + height - 300, 240, 240);
  ctx.imageSmoothingEnabled = true;
  const username = `@${data.username}`;
  ctx.font = `700 30px ${font}`;
  const tagWidth = Math.min(430, ctx.measureText(username).width + 40);
  const tagX = x + width - tagWidth - 22, tagY = y + height - 72;
  ctx.fillStyle = "#fff8e9f2";
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagWidth, 50, 7);
  ctx.fill();
  ctx.fillStyle = "#35533a";
  ctx.textAlign = "right";
  ctx.fillText(username, x + width - 42, tagY + 35, tagWidth - 36);
  ctx.restore();

  ctx.fillStyle = "#edf0dc";
  ctx.strokeStyle = "#9aa878";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(64, 920, 952, 310, 16);
  ctx.fill();
  ctx.stroke();
  // Stepped flame medal rather than a platform-dependent emoji.
  ctx.fillStyle = "#f7e3ae";
  ctx.beginPath();
  ctx.arc(183, 1037, 76, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#bb7538";
  ctx.fillRect(169, 978, 23, 34);
  ctx.fillRect(154, 1002, 53, 27);
  ctx.fillRect(143, 1023, 78, 43);
  ctx.fillRect(154, 1066, 56, 18);
  ctx.fillStyle = "#f3b844";
  ctx.fillRect(168, 1012, 25, 25);
  ctx.fillRect(155, 1036, 54, 30);
  ctx.fillStyle = "#fff0bc";
  ctx.fillRect(174, 1040, 17, 31);
  ctx.fillStyle = "#2f5038";
  ctx.font = `800 112px ${font}`;
  ctx.fillText(String(data.streak), 290, 1040, 500);
  ctx.font = `700 34px ${font}`;
  ctx.fillText(data.streak ? "DAY STREAK" : "A FRESH START", 294, 1091);
  ctx.fillStyle = "#cbd5af";
  ctx.fillRect(104, 1124, 872, 2);
  ctx.fillStyle = "#526046";
  ctx.font = `500 32px ${font}`;
  ctx.fillText(shareCardText(data)[1], 106, 1186, 864);
  ctx.restore();
}
