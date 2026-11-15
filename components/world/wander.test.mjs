import test from "node:test";
import assert from "node:assert/strict";
import * as w from "./wander.ts";

test("bottom-aligned bedroom framing keeps the rug inside wide, short panels", () => {
  for (const [width, height] of [
    [619, 180],
    [600, 246],
    [290, 170],
  ]) {
    const view = w.sceneView(width, height, 1),
      feet = w.toScreen({ x: 800, y: 880 }, view);
    assert.ok(feet.y > 0 && feet.y < height, `${width}x${height}: ${feet.y}`);
    assert.equal(view.offsetY, height - 1024 * view.scale);
  }
});

test("navigation exists and traces grass, not paths, beds, fountain or borders", () => {
  assert.equal(typeof w.isGrass, "function");
  for (const [x, y] of [
    [260, 468],
    [480, 650],
    [420, 800],
    [1150, 490],
    [1060, 650],
    [1100, 790],
  ])
    assert.ok(w.isGrass({ x, y }), `grass ${x},${y}`);
  for (const [x, y] of [
    [768, 580],
    [768, 400],
    [300, 600],
    [1200, 600],
    [350, 380],
    [1200, 380],
    [150, 800],
    [1400, 800],
    [768, 950],
    [260, 505],
    [1300, 500],
  ])
    assert.equal(w.isGrass({ x, y }), false, `obstacle ${x},${y}`);
});

test("routes remain on connected grass and cannot cross the stone path", () => {
  const nav = w.createNavigation(w.sceneView(900, 600));
  const start = { x: 260, y: 468 },
    end = { x: 420, y: 800 };
  const route = nav.route(start, end);
  assert.ok(
    route && route.length > 1,
    "Concave grass requires a real route around the bed",
  );
  let previous = start;
  for (const point of route) {
    assert.ok(nav.segment(previous, point));
    previous = point;
  }
  assert.deepEqual(route.at(-1), end);
  assert.equal(
    nav.route(start, { x: 1100, y: 790 }),
    null,
    "Do not cross stones to the other side",
  );
  assert.equal(
    nav.route(start, { x: 300, y: 600 }),
    null,
    "Do not plan into a bed",
  );
});

test("responsive cover mapping and navigation preserve feet and sprite clearance", () => {
  for (const [width, height] of [
    [900, 600],
    [360, 550],
    [330, 480],
    [640, 100],
    [300, 180],
  ]) {
    const view = w.sceneView(width, height),
      nav = w.createNavigation(view);
    assert.ok(nav.points.length > 0, `usable grass at ${width}x${height}`);
    for (const p of nav.points) {
      const screen = w.toScreen(p, view);
      assert.ok(
        screen.x >= 35 && screen.x <= width - 35,
        `horizontal clearance ${width} ${screen.x}`,
      );
      assert.ok(
        screen.y >= 128 * view.scale + 30,
        `head/name clearance ${height} ${screen.y}`,
      );
      assert.ok(screen.y <= height - 5, `feet clearance ${height} ${screen.y}`);
      assert.ok(w.isGrass(p));
    }
  }
});

test("long autonomous runs stay safe, walk and pause, vary destinations and face all directions", () => {
  const faces = new Set(),
    destinations = new Set();
  let walking = 0,
    idle = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const nav = w.createNavigation(
      w.sceneView(seed % 2 ? 900 : 360, seed % 2 ? 600 : 550),
    );
    const random = w.seededRandom(seed);
    const actor = w.createWanderer(nav, seed % 2, random);
    assert.ok(actor);
    for (let frame = 0; frame < 18000; frame++) {
      const before = { ...actor.position };
      w.advanceWanderer(actor, nav, 1 / 30, random);
      assert.ok(nav.contains(actor.position));
      assert.ok(
        nav.segment(before, actor.position),
        "Every actual movement segment must be grass",
      );
      assert.ok(
        Math.hypot(actor.position.x - before.x, actor.position.y - before.y) <
          3,
        "No jitter or teleport",
      );
      faces.add(actor.facing);
      if (actor.state === "walk") walking++;
      else idle++;
      if (actor.destination)
        destinations.add(
          `${Math.round(actor.destination.x)},${Math.round(actor.destination.y)}`,
        );
    }
  }
  assert.ok(walking > 0 && idle > 0);
  assert.ok(idle / (walking + idle) > 0.1, "Meaningful idle pauses");
  assert.ok(destinations.size > 40, "No fixed patrol loop");
  assert.deepEqual([...faces].sort(), ["down", "left", "right", "up"]);
});

test("large deltas cannot tunnel, and resize can rehome safely inside the new crop", () => {
  const nav = w.createNavigation(w.sceneView(900, 600)),
    random = w.seededRandom(42);
  const actor = w.createWanderer(nav, 0, random);
  for (let i = 0; i < 120; i++) w.advanceWanderer(actor, nav, 0.1, random);
  const before = { ...actor.position };
  w.advanceWanderer(actor, nav, 90, random);
  assert.ok(nav.segment(before, actor.position));
  assert.ok(
    Math.hypot(actor.position.x - before.x, actor.position.y - before.y) < 10,
  );
  const narrow = w.createNavigation(w.sceneView(330, 480));
  w.rehomeWanderer(actor, narrow, random);
  assert.ok(narrow.contains(actor.position));
  assert.equal(actor.state, "idle");
  assert.equal(actor.path.length, 0);
});

test("members spawn apart even when their random streams coincide", () => {
  const nav = w.createNavigation(w.sceneView(360, 550));
  const first = w.createWanderer(nav, 0, w.seededRandom(12));
  const second = w.createWanderer(nav, 0, w.seededRandom(12), [first.position]);
  assert.ok(
    Math.hypot(
      first.position.x - second.position.x,
      first.position.y - second.position.y,
    ) > 130,
    "Avoid stacked characters at first paint",
  );
});
