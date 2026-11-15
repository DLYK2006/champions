"use client";
import { useEffect, useRef } from "react";
import { loadImage, drawCard } from "@/lib/share/card";
import { prepareSprite, drawSprite } from "@/components/avatar/sprite-art";
import { DEFAULT_AVATAR } from "@/components/onboarding/avatarOptions";

export default function ShareArtFixture() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    void (async () => {
      const scenes = await Promise.all([loadImage('/dig-in/garden-starter.png'), loadImage('/dig-in/garden.png')]);
      const atlas = await prepareSprite(DEFAULT_AVATAR);
      const avatar = document.createElement('canvas');
      avatar.width = avatar.height = 240;
      drawSprite(avatar.getContext('2d')!, atlas, 120, 220, 'down', 0, 210);
      const canvas = ref.current;
      if (!canvas) return;
      drawCard(canvas.getContext('2d')!, { username: 'jay', avatar: DEFAULT_AVATAR, equipped: [], streak: 2, mealsToday: 1, goalMet: false, group: { name: 'hello', completion: 0 } }, scenes, avatar, 'sans-serif');
      canvas.dataset.ready = 'true';
    })();
  }, []);
  return <canvas ref={ref} width={1080} height={1350} aria-label="Downloaded progress artwork" style={{ width: 540, height: 675 }} />;
}
