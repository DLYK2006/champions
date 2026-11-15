"use client";

import { useEffect, useRef } from "react";
import { prepareSprite } from "@/components/avatar/sprite-art";
import { DEFAULT_AVATAR } from "@/components/onboarding/avatarOptions";

export default function SideViewsFixture() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    void (async () => {
      const ctx = ref.current!.getContext("2d")!;
      ctx.fillStyle = "#eeead4";
      ctx.fillRect(0, 0, 1024, 1792);
      const cases = [
        { top: "curly" }, { top: "shortFlat" },
        { top: "longHairStraight" }, { top: "bun" }, { top: "hat" },
        { top: "shortFlat", hat: "moss-beanie" },
        { top: "shortFlat", hat: "straw-sunhat" },
        { top: "shortFlat", items: ["crown", "sunglasses"] },
        ...["sage-sweater", "rust-flannel", "meadow-trousers", "slate-cargos", "acorn-cap", "fisher-bucket"]
          .map((id) => ({ top: "shortFlat", items: [id] })),
      ];
      const atlases = [];
      for (const [index, entry] of cases.entries()) {
        const atlas = await prepareSprite({ ...DEFAULT_AVATAR, ...entry }, entry.items);
        atlases.push(atlas);
        if (index < 8) {
          for (let row = 1; row <= 2; row++)
            for (let frame = 0; frame < 4; frame++)
              ctx.drawImage(atlas, frame * 128, row * 128, 128, 128,
                ((row - 1) * 4 + frame) * 128, index * 128, 128, 128);
        } else {
          for (let row = 0; row < 4; row++)
            for (let pose = 0; pose < 2; pose++)
              ctx.drawImage(atlas, pose * 3 * 128, row * 128, 128, 128,
                (row * 2 + pose) * 128, index * 128, 128, 128);
        }
      }
      let lostFace = 0;
      const original = atlases[0].getContext("2d")!.getImageData(0, 0, 768, 512).data;
      const trimmed = atlases[1].getContext("2d")!.getImageData(0, 0, 768, 512).data;
      for (let row = 1; row <= 2; row++)
        for (let frame = 0; frame < 6; frame++)
          for (let y = 30; y < 54; y++)
            for (let x = row === 1 ? 40 : 73; x < (row === 1 ? 61 : 94); x++) {
              const i = ((row * 128 + y) * 768 + frame * 128 + x) * 4;
              if (original[i + 3] && original[i] > 175 && original[i + 1] > 105 && !trimmed[i + 3]) lostFace++;
            }
      ref.current!.dataset.lostFace = String(lostFace);
      const paidReport = [];
      const basePixels = atlases[1].getContext("2d")!.getImageData(0, 0, 768, 512).data;
      for (let item = 8; item < atlases.length; item++) {
        const itemPixels = atlases[item].getContext("2d")!.getImageData(0, 0, 768, 512).data;
        let changedCells = 0, bodyMaskChanges = 0, faceChanges = 0;
        for (let row = 0; row < 4; row++)
          for (let frame = 0; frame < 6; frame++) {
            let changed = false;
            for (let y = 0; y < 128; y++)
              for (let x = 0; x < 128; x++) {
                const i = ((row * 128 + y) * 768 + frame * 128 + x) * 4;
                if (y >= 54 && itemPixels[i + 3] !== basePixels[i + 3]) bodyMaskChanges++;
                for (let c = 0; c < 4; c++) {
                  if (y >= 31 && y < 54 && itemPixels[i + c] !== basePixels[i + c]) faceChanges++;
                  if (itemPixels[i + c] !== basePixels[i + c]) changed = true;
                }
              }
            if (changed) changedCells++;
          }
        paidReport.push({ id: cases[item].items?.[0], changedCells, bodyMaskChanges, faceChanges });
      }
      ref.current!.dataset.paidReport = JSON.stringify(paidReport);
      ref.current!.dataset.ready = "true";
    })();
  }, []);
  return <canvas ref={ref} width={1024} height={1792} aria-label="Side view contact sheet" />;
}
