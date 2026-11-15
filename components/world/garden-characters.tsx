"use client";

import { useEffect, useRef, useState } from "react";
import type { GroupMemberStatus } from "@/types";
import { prepareSprite, drawSprite } from "@/components/avatar/sprite-art";
import {
  advanceWanderer,
  createNavigation,
  createWanderer,
  rehomeWanderer,
  sceneView,
  seededRandom,
  toScreen,
  type Wanderer,
} from "./wander";

export function GardenCharacters({
  members,
}: {
  members: GroupMemberStatus[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef(new Map<string, HTMLDivElement>());
  const persistent = useRef(new Map<string, Wanderer>());
  const [error, setError] = useState(false);
  const roster = JSON.stringify(members.slice(0, 4));
  useEffect(() => {
    const element = canvas.current,
      parent = element?.parentElement;
    if (!element || !parent) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    // Cache between change events: polling .matches in RAF can swallow Chromium's media-change event.
    let reduced = motion.matches;
    const people = JSON.parse(roster) as GroupMemberStatus[];
    const remembered = persistent.current;
    const entries: {
      member: GroupMemberStatus;
      random: () => number;
      actor: Wanderer | null;
      atlas?: HTMLCanvasElement;
    }[] = people.map((member) => {
      let seed = 2166136261;
      for (const char of member.user_id)
        seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
      return {
        member,
        random: seededRandom(seed),
        actor: persistent.current.get(member.user_id) || null,
      };
    });
    let disposed = false,
      raf = 0,
      last = 0,
      ready = false,
      width = 0,
      height = 0;
    let view = sceneView(1, 1),
      nav = createNavigation(view);
    function paint(time: number, delta = 0) {
      const context = ctx!;
      context.clearRect(0, 0, width, height);
      const running = !reduced && !document.hidden;
      for (const entry of entries) {
        const { actor, member } = entry;
        if (!actor) continue;
        if (delta && running) advanceWanderer(actor, nav, delta, entry.random);
        const p = toScreen(actor.position, view),
          frame =
            actor.state === "walk" && running && actor.speed > 3
              ? 2 + (Math.floor(actor.travel / 6) % 4)
              : running && (time + member.user_id.length * 431) % 4800 > 4640
                ? 1
                : 0;
        const label = labels.current.get(member.user_id);
        if (label) {
          label.style.transform = `translate3d(${Math.round(p.x)}px,${Math.round(p.y - 128 * view.scale - 6)}px,0)`;
          label.dataset.worldX = String(actor.position.x);
          label.dataset.worldY = String(actor.position.y);
          label.dataset.state = actor.state;
          label.dataset.facing = actor.facing;
          label.dataset.frame = String(frame);
        }
      }
      // Render lower feet last: consistent top-down RPG depth between characters.
      for (const entry of entries
        .slice()
        .sort(
          (a, b) => (a.actor?.position.y || 0) - (b.actor?.position.y || 0),
        )) {
        if (!entry.actor || !entry.atlas) continue;
        const { actor, member } = entry,
          p = toScreen(actor.position, view);
        const frame = Number(
          labels.current.get(member.user_id)?.dataset.frame || 0,
        );
        drawSprite(
          context,
          entry.atlas,
          p.x,
          p.y,
          actor.facing,
          frame,
          128 * view.scale,
        );
      }
      if (running) {
        context.fillStyle = "#fff2bd80";
        for (let i = 0; i < 5; i++) {
          const x = width * (0.18 + i * 0.16) + Math.sin(time / 6500 + i) * 11,
            y = height * (0.15 + i * 0.1) + Math.sin(time / 4100 + i * 2) * 8;
          context.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
      }
    }
    function tick(time: number) {
      if (disposed || reduced || document.hidden) {
        sync();
        return;
      }
      const delta = last ? Math.min((time - last) / 1000, 0.1) : 0;
      last = time;
      paint(time, delta);
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      reduced = motion.matches;
      cancelAnimationFrame(raf);
      last = 0;
      element!.dataset.running = "false";
      if (disposed) return;
      paint(performance.now());
      if (ready && !reduced && !document.hidden) {
        element!.dataset.running = "true";
        raf = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const w = parent!.clientWidth,
        h = parent!.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      width = w;
      height = h;
      const fit = getComputedStyle(parent!).getPropertyValue("--garden-fit").trim() === "cover" ? "cover" : "contain";
      view = sceneView(w, h, 0.5, fit);
      nav = createNavigation(view);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      element!.width = Math.round(w * dpr);
      element!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = false;
      const occupied: { x: number; y: number }[] = [];
      entries.forEach((entry, index) => {
        if (entry.actor) rehomeWanderer(entry.actor, nav, entry.random);
        else
          entry.actor = createWanderer(nav, index % 2, entry.random, occupied);
        if (entry.actor) occupied.push(entry.actor.position);
        if (entry.actor)
          persistent.current.set(entry.member.user_id, entry.actor);
      });
      paint(performance.now());
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    Promise.all(
      entries.map(async (entry, index) => {
        entry.atlas = await prepareSprite(
          entry.member.avatar,
          entry.member.equipped,
          index,
        );
      }),
    )
      .then(() => {
        if (disposed) return;
        setError(false);
        ready = entries.length > 0;
        element.dataset.spriteReady = "true";
        sync();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    // Empty gardens are intentionally peaceful, without invisible animation work.
    if (!entries.length) {
      ready = false;
      element.dataset.running = "false";
    }
    return () => {
      disposed = true;
      element.dataset.running = "false";
      cancelAnimationFrame(raf);
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      const present = new Set(people.map((p) => p.user_id));
      for (const id of remembered.keys())
        if (!present.has(id)) remembered.delete(id);
    };
  }, [roster]);
  return (
    <>
      <canvas className="garden-canvas" ref={canvas} aria-hidden="true" />
      <div className="garden-members" role="list" aria-label="Garden members">
        {members.slice(0, 4).map((member) => (
          <div
            role="listitem"
            className="garden-member"
            key={member.user_id}
            ref={(element) => {
              if (element) labels.current.set(member.user_id, element);
              else labels.current.delete(member.user_id);
            }}
          >
            <span className="garden-name" title={member.username}>
              {member.username}
              {member.personal_goal_completed && (
                <span aria-label="Goal complete"> ✓</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {error && (
        <p className="sprite-load-error" role="status">
          Character artwork unavailable
        </p>
      )}
    </>
  );
}
