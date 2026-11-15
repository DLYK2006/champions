export interface Point {
  x: number;
  y: number;
}
export type Facing = "down" | "left" | "right" | "up";
export interface SceneView {
  scale: number;
  offsetX: number;
  offsetY: number;
  bounds: { left: number; right: number; top: number; bottom: number };
}

// Feet-only grass polygons traced on both aligned 1536x1024 garden stages.
// The stone path disconnects the two sides. Deliberately omit narrow/decorated edges.
export const GRASS_REGIONS: readonly (readonly Point[])[] = [
  [
    [200, 455],
    [470, 455],
    [485, 510],
    [525, 540],
    [590, 555],
    [605, 585],
    [580, 635],
    [565, 685],
    [540, 730],
    [505, 790],
    [475, 835],
    [400, 850],
    [330, 815],
    [295, 765],
    [285, 735],
    [420, 720],
    [445, 680],
    [450, 560],
    [435, 525],
    [430, 482],
    [200, 478],
  ].map(([x, y]) => ({ x, y })),
  [
    [1060, 465],
    [1190, 465],
    [1190, 505],
    [1120, 520],
    [1090, 550],
    [1090, 675],
    [1100, 720],
    [1220, 735],
    [1230, 775],
    [1180, 825],
    [1100, 845],
    [1040, 820],
    [1020, 770],
    [970, 715],
    [970, 650],
    [970, 600],
    [1010, 550],
    [1040, 525],
  ].map(([x, y]) => ({ x, y })),
];

function inside(p: Point, polygon: readonly Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}
export function grassRegion(p: Point) {
  return GRASS_REGIONS.findIndex((polygon) => inside(p, polygon));
}
export function isGrass(p: Point) {
  return grassRegion(p) >= 0;
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function sceneView(
  width: number,
  height: number,
  alignY = 0.5,
  fit: "cover" | "contain" = "cover",
): SceneView {
  const scale = (fit === "contain" ? Math.min : Math.max)(width / 1536, height / 1024);
  const offsetX = (width - 1536 * scale) / 2,
    offsetY = (height - 1024 * scale) * alignY;
  return {
    scale,
    offsetX,
    offsetY,
    bounds: {
      left: -offsetX / scale,
      right: (width - offsetX) / scale,
      top: -offsetY / scale,
      bottom: (height - offsetY) / scale,
    },
  };
}
export function toScreen(p: Point, view: SceneView): Point {
  return {
    x: p.x * view.scale + view.offsetX,
    y: p.y * view.scale + view.offsetY,
  };
}
export interface Navigation {
  points: Point[];
  contains: (p: Point) => boolean;
  segment: (a: Point, b: Point) => boolean;
  route: (a: Point, b: Point) => Point[] | null;
}
export function createNavigation(view: SceneView): Navigation {
  const { bounds, scale } = view;
  function contains(p: Point) {
    if (
      p.x < bounds.left + Math.max(40, 38 / scale) ||
      p.x > bounds.right - Math.max(40, 38 / scale) ||
      p.y < bounds.top + 128 + 30 / scale ||
      p.y > bounds.bottom - 7 / scale
    )
      return false;
    // Include an inset footprint, not just one pixel at the feet.
    return [
      p,
      { x: p.x - 12, y: p.y },
      { x: p.x + 12, y: p.y },
      { x: p.x, y: p.y - 6 },
      { x: p.x, y: p.y + 6 },
    ].every(isGrass);
  }
  function segment(a: Point, b: Point) {
    if (!contains(a) || !contains(b)) return false;
    const steps = Math.ceil(distance(a, b) / 4);
    for (let i = 1; i < steps; i++)
      if (
        !contains({
          x: a.x + ((b.x - a.x) * i) / steps,
          y: a.y + ((b.y - a.y) * i) / steps,
        })
      )
        return false;
    return true;
  }
  const step = 12,
    points: Point[] = [],
    byCell = new Map<string, number>();
  for (let y = 450; y < 870; y += step)
    for (let x = 120; x < 1380; x += step) {
      const p = { x, y };
      if (!contains(p)) continue;
      byCell.set(`${x},${y}`, points.length);
      points.push(p);
    }
  const neighbors = points.map((p) => {
    const adjacent: number[] = [];
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
      [step, step],
      [step, -step],
      [-step, step],
      [-step, -step],
    ]) {
      const index = byCell.get(`${p.x + dx},${p.y + dy}`);
      if (index !== undefined && segment(p, points[index]))
        adjacent.push(index);
    }
    return adjacent;
  });
  function nearest(p: Point) {
    let best = -1,
      score = Infinity;
    points.forEach((q, index) => {
      const d = distance(p, q);
      if (d < score && segment(p, q)) {
        best = index;
        score = d;
      }
    });
    return best;
  }
  function route(a: Point, b: Point): Point[] | null {
    if (!contains(a) || !contains(b) || grassRegion(a) !== grassRegion(b))
      return null;
    if (segment(a, b)) return [{ ...b }];
    const start = nearest(a),
      end = nearest(b);
    if (start < 0 || end < 0) return null;
    const queue = [start],
      cameFrom = new Map<number, number>([[start, -1]]);
    for (let i = 0; i < queue.length && !cameFrom.has(end); i++)
      for (const next of neighbors[queue[i]]) {
        if (cameFrom.has(next)) continue;
        cameFrom.set(next, queue[i]);
        queue.push(next);
      }
    if (!cameFrom.has(end)) return null;
    const path: Point[] = [{ ...b }];
    let current = end;
    while (current !== -1) {
      path.unshift(points[current]);
      current = cameFrom.get(current)!;
    }
    // Remove grid corners only when the entire shortcut is collision-free.
    const simplified: Point[] = [];
    let previous = a,
      index = 0;
    while (index < path.length) {
      let farthest = index;
      for (let j = index + 1; j < path.length; j++)
        if (segment(previous, path[j])) farthest = j;
      simplified.push({ ...path[farthest] });
      previous = path[farthest];
      index = farthest + 1;
    }
    return simplified;
  }
  return { points, contains, segment, route };
}

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export interface Wanderer {
  position: Point;
  facing: Facing;
  state: "idle" | "walk";
  path: Point[];
  destination: Point | null;
  previousDestination: Point | null;
  pause: number;
  gazeIn: number;
  speed: number;
  cruiseSpeed: number;
  travel: number;
}
export function createWanderer(
  nav: Navigation,
  region: number,
  random: () => number,
  occupied: readonly Point[] = [],
): Wanderer | null {
  const choices = nav.points.filter((p) => grassRegion(p) === region);
  let position =
    choices[Math.floor(random() * choices.length)] || nav.points[0];
  if (!position) return null;
  if (occupied.length) {
    let clearance = Math.min(...occupied.map((p) => distance(p, position)));
    for (let i = 0; i < 24 && choices.length; i++) {
      const candidate = choices[Math.floor(random() * choices.length)];
      const margin = Math.min(...occupied.map((p) => distance(p, candidate)));
      if (margin > clearance) {
        position = candidate;
        clearance = margin;
      }
    }
  }
  return {
    position: { ...position },
    facing: "down",
    state: "idle",
    path: [],
    destination: null,
    previousDestination: null,
    pause: 0.6 + random() * 2,
    gazeIn: 0.8 + random() * 2,
    speed: 0,
    cruiseSpeed: 45,
    travel: 0,
  };
}
export function rehomeWanderer(
  actor: Wanderer,
  nav: Navigation,
  random: () => number,
) {
  if (!nav.contains(actor.position)) {
    const region = grassRegion(actor.position);
    const choices = nav.points.filter((p) => grassRegion(p) === region);
    choices.sort(
      (a, b) => distance(a, actor.position) - distance(b, actor.position),
    );
    const next = choices[0] || nav.points[0];
    if (next) actor.position = { ...next };
  }
  actor.path = [];
  actor.destination = null;
  actor.previousDestination = null;
  actor.state = "idle";
  actor.speed = 0;
  actor.pause = 0.7 + random();
}
function facing(dx: number, dy: number, current: Facing): Facing {
  if (Math.abs(dx) > Math.abs(dy) * 1.15) return dx > 0 ? "right" : "left";
  if (Math.abs(dy) > Math.abs(dx) * 1.15) return dy > 0 ? "down" : "up";
  return current === "left" || current === "right"
    ? dx > 0
      ? "right"
      : "left"
    : dy > 0
      ? "down"
      : "up";
}
export function advanceWanderer(
  actor: Wanderer,
  nav: Navigation,
  delta: number,
  random: () => number,
) {
  const dt = Math.min(Math.max(delta, 0), 0.1);
  if (actor.state === "idle") {
    actor.pause -= dt;
    actor.gazeIn -= dt;
    if (actor.gazeIn <= 0) {
      actor.facing = (["down", "left", "right", "up"] as Facing[])[
        Math.floor(random() * 4)
      ];
      actor.gazeIn = 2 + random() * 4;
    }
    if (actor.pause > 0) return;
    const region = grassRegion(actor.position);
    const choices = nav.points.filter(
      (p) =>
        grassRegion(p) === region &&
        distance(p, actor.position) > 60 &&
        (!actor.previousDestination ||
          distance(p, actor.previousDestination) > 65),
    );
    for (let attempt = 0; attempt < 24 && choices.length; attempt++) {
      const target = choices[Math.floor(random() * choices.length)],
        path = nav.route(actor.position, target);
      if (!path) continue;
      actor.previousDestination = { ...actor.position };
      actor.destination = { ...target };
      actor.path = path;
      actor.state = "walk";
      actor.speed = 0;
      actor.cruiseSpeed = 38 + random() * 16;
      actor.travel = 0;
      return;
    }
    actor.pause = 1 + random() * 2;
    return;
  }
  const next = actor.path[0];
  if (!next) {
    actor.state = "idle";
    actor.pause = 1.4 + random() * 3.8;
    actor.gazeIn = 0.8 + random() * 2;
    actor.speed = 0;
    return;
  }
  const dx = next.x - actor.position.x,
    dy = next.y - actor.position.y,
    d = distance(next, actor.position);
  if (d < 1.2) {
    actor.path.shift();
    return;
  }
  let remaining = d;
  for (let i = 1; i < actor.path.length; i++)
    remaining += distance(actor.path[i - 1], actor.path[i]);
  const desired = actor.cruiseSpeed * Math.min(1, remaining / 22);
  actor.speed += (desired - actor.speed) * Math.min(1, dt * 5);
  const amount = Math.min(d, actor.speed * dt),
    proposed = {
      x: actor.position.x + (dx / d) * amount,
      y: actor.position.y + (dy / d) * amount,
    };
  if (!nav.segment(actor.position, proposed)) {
    actor.path = [];
    actor.state = "idle";
    actor.pause = 1;
    actor.speed = 0;
    return;
  }
  actor.position = proposed;
  actor.travel += amount;
  actor.facing = facing(dx, dy, actor.facing);
}
