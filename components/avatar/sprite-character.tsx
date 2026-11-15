"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarConfig, Mood } from "@/types";
import { prepareSprite, drawSprite } from "./sprite-art";
import { sceneView, toScreen } from "../world/wander";
import type { Facing } from "../world/wander";

export function SpriteCharacter({
  config,
  equipped = [],
  mood = "ready",
  room = false,
  facing = "down",
  name = "Your pixel adventurer",
  variant = 0,
  animate = true,
}: {
  config?: AvatarConfig;
  equipped?: string[];
  mood?: Mood;
  room?: boolean;
  facing?: Facing;
  name?: string;
  variant?: number;
  animate?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const appearance = JSON.stringify([config, equipped]);
  useEffect(() => {
    const actor = canvas.current?.parentElement,
      scene = actor?.parentElement;
    if (!room || !actor || !scene) return;
    function position() {
      if (!scene!.clientWidth || !scene!.clientHeight) return;
      const view = sceneView(scene!.clientWidth, scene!.clientHeight, 1);
      const feet = toScreen({ x: 800, y: 880 }, view),
        scale = Math.min(view.scale * 2.5, Math.max(0.2, (feet.y - 18) / 132));
      actor!.style.width = `${112 * scale}px`;
      actor!.style.height = `${160 * scale}px`;
      actor!.style.left = `${feet.x}px`;
      actor!.style.bottom = `${scene!.clientHeight - feet.y - 12 * scale}px`;
      actor!.dataset.feetX = String(feet.x);
      actor!.dataset.feetY = String(feet.y);
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(scene);
    return () => observer.disconnect();
  }, [room]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let disposed = false,
      raf = 0,
      atlas: HTMLCanvasElement | undefined;
    let paintedFrame = -1;
    function paint(time = 0) {
      if (!atlas) return;
      const frame =
        animate && !reduced && !document.hidden && time % 5100 > 4900 ? 1 : 0;
      if (frame === paintedFrame) return;
      paintedFrame = frame;
      ctx!.clearRect(0, 0, 112, 160);
      if (atlas) drawSprite(ctx!, atlas, 56, 148, facing, frame, 132);
    }
    function tick(time: number) {
      if (disposed || reduced || document.hidden) {
        sync();
        return;
      }
      paint(time);
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      reduced = motion.matches;
      cancelAnimationFrame(raf);
      element!.dataset.running = "false";
      paint();
      if (animate && atlas && !reduced && !document.hidden && !disposed) {
        element!.dataset.running = "true";
        raf = requestAnimationFrame(tick);
      }
    }
    element.width = 224;
    element.height = 320;
    ctx.scale(2, 2);
    const [avatar, items] = JSON.parse(appearance) as [
      AvatarConfig | undefined,
      string[],
    ];
    prepareSprite(avatar, items, variant)
      .then((sprite) => {
        if (disposed) return;
        setError(false);
        atlas = sprite;
        element.dataset.spriteReady = "true";
        sync();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      element.dataset.running = "false";
      cancelAnimationFrame(raf);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [appearance, facing, variant, animate]);
  return (
    <div className={`room-character mood-${mood}`} role="img" aria-label={name}>
      <canvas ref={canvas} className="character-canvas" aria-hidden="true" />
      {error && (
        <span className="sprite-load-error" role="status">
          Character unavailable
        </span>
      )}
    </div>
  );
}
