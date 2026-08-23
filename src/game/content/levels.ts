import type { DifficultyBand, LevelDef } from "../simulation/types";
import { countCrossings, isUntangled, NODE_CLEARANCE } from "../simulation/geometry";
import { LEVEL_COUNT } from "../save/save";
import { mulberry32, shuffle } from "./rng";

function bandFor(index: number): DifficultyBand {
  if (index < 15) return "easy";
  if (index < 35) return "medium";
  return "hard";
}

function nodeCountFor(index: number): number {
  if (index < 5) return 4 + (index % 2);
  if (index < 15) return 6 + (index % 2);
  if (index < 35) return 7 + (index % 3);
  return 9 + (index % 4);
}

function chordsCross(a: number, b: number, c: number, d: number, n: number): boolean {
  const norm = (x: number) => ((x % n) + n) % n;
  a = norm(a);
  b = norm(b);
  c = norm(c);
  d = norm(d);
  if (a === c || a === d || b === c || b === d) return false;
  const i = Math.min(a, b);
  const j = Math.max(a, b);
  const k = Math.min(c, d);
  const l = Math.max(c, d);
  return (i < k && k < j && j < l) || (k < i && i < l && l < j);
}

function buildPlanarEdges(n: number, extra: number, rand: () => number): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const have = new Set<string>();
  const add = (a: number, b: number) => {
    if (a === b) return;
    const k = key(a, b);
    if (have.has(k)) return;
    have.add(k);
    edges.push(a < b ? [a, b] : [b, a]);
  };

  for (let i = 0; i < n; i++) add(i, (i + 1) % n);

  const candidates: Array<[number, number]> = [];
  for (let a = 0; a < n; a++) {
    for (let span = 2; span < n - 1; span++) {
      const b = (a + span) % n;
      if (a < b) candidates.push([a, b]);
    }
  }
  const shuffled = shuffle(candidates, rand);
  let added = 0;
  for (const [a, b] of shuffled) {
    if (added >= extra) break;
    const crosses = edges.some(([c, d]) => chordsCross(a, b, c, d, n) && !(a === c && b === d));
    if (!crosses) {
      add(a, b);
      added++;
    }
  }
  return edges;
}

function circleLayout(n: number, radius: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push([Math.cos(t) * radius, Math.sin(t) * radius]);
  }
  return pts;
}

function scrambleLayout(
  n: number,
  radius: number,
  rand: () => number,
  tangle: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const minDist = NODE_CLEARANCE + 0.08;
  let guard = 0;
  while (pts.length < n && guard < 120) {
    guard++;
    const t = rand() * Math.PI * 2;
    const r = radius * (0.22 + rand() * 0.78);
    const jitter = tangle * 0.4;
    const x = Math.cos(t) * r + (rand() - 0.5) * jitter;
    const z = Math.sin(t) * r + (rand() - 0.5) * jitter;
    if (pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < minDist)) continue;
    pts.push([x, z]);
  }
  while (pts.length < n) {
    const i = pts.length;
    const ang = (i / n) * Math.PI * 2 + rand() * 0.4;
    pts.push([Math.cos(ang) * radius * 0.7, Math.sin(ang) * radius * 0.7]);
  }
  return pts;
}

function forceBowtie(pts: Array<[number, number]>): void {
  pts[0] = [-1.35, -1.15];
  pts[1] = [1.35, 1.15];
  pts[2] = [1.25, -1.25];
  pts[3] = [-1.25, 1.25];
}

function extraChords(index: number, n: number): number {
  if (index < 5) return 1;
  if (index < 15) return Math.min(2, n - 3);
  if (index < 35) return Math.min(3 + (index % 2), n - 3);
  return Math.min(4 + (index % 3), n - 2);
}

export function createLevel(index: number): LevelDef {
  const rand = mulberry32(18000 + index * 917);
  const n = nodeCountFor(index);
  const edges = buildPlanarEdges(n, extraChords(index, n), rand);
  let radius = 2.35 + Math.max(0, n - 8) * 0.08;
  let solved = circleLayout(n, radius);
  for (let grow = 0; grow < 10 && !isUntangled(solved.map(([x, z]) => ({ x, z })), edges); grow++) {
    radius += 0.2;
    solved = circleLayout(n, radius);
  }
  let start = scrambleLayout(n, radius, rand, 1 + index * 0.04);
  let guard = 0;
  const tangled = (layout: Array<[number, number]>) =>
    countCrossings(layout.map(([x, z]) => ({ x, z })), edges);
  while (tangled(start) < 1 && guard < 16) {
    start = scrambleLayout(n, radius, rand, 1.35 + index * 0.06);
    guard++;
  }
  if (tangled(start) < 1) {
    start = solved.map(([x, z]) => [x, z] as [number, number]);
    forceBowtie(start);
  }
  const band = bandFor(index);
  const movesBase = n + edges.length;
  const three = Math.max(n, Math.floor(movesBase * (band === "easy" ? 0.7 : band === "medium" ? 0.85 : 1)));
  const two = three + n + 2;
  return {
    id: `tangle-${String(index + 1).padStart(2, "0")}`,
    index,
    band,
    nodeCount: n,
    edges,
    start,
    solved,
    starCuts: [three, two],
  };
}

export const CAMPAIGN: LevelDef[] = Array.from({ length: LEVEL_COUNT }, (_, i) => createLevel(i));

export function packLabel(index: number): string {
  if (index < 15) return "Warm-up Knots";
  if (index < 35) return "Twisted Paths";
  return "Master Tangles";
}
