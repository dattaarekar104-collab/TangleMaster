/** Matches the 3D bead / rope sizes in puzzleView. */
export const NODE_RADIUS = 0.28;
export const ROPE_RADIUS = 0.07;
export const ROPE_CLEARANCE = ROPE_RADIUS * 2 + 0.06;
export const NODE_CLEARANCE = NODE_RADIUS * 1.7;
export const NODE_ROPE_CLEARANCE = NODE_RADIUS * 0.5 + ROPE_RADIUS;

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function orient(ax: number, az: number, bx: number, bz: number, cx: number, cz: number): number {
  return (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
}

function collinearOverlap(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  dx: number,
  dz: number,
): boolean {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz;
  if (len2 < 1e-10) return false;
  const t0 = ((cx - ax) * abx + (cz - az) * abz) / len2;
  const t1 = ((dx - ax) * abx + (dz - az) * abz) / len2;
  const lo = Math.max(0, Math.min(t0, t1));
  const hi = Math.min(1, Math.max(t0, t1));
  return hi - lo > 0.04;
}

export function segmentsCross(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  dx: number,
  dz: number,
): boolean {
  const o1 = orient(ax, az, bx, bz, cx, cz);
  const o2 = orient(ax, az, bx, bz, dx, dz);
  const o3 = orient(cx, cz, dx, dz, ax, az);
  const o4 = orient(cx, cz, dx, dz, bx, bz);
  const scale =
    Math.hypot(bx - ax, bz - az) * Math.hypot(dx - cx, dz - cz) + Number.EPSILON;
  const eps = 1e-8 * scale;
  const z = (v: number) => (Math.abs(v) <= eps ? 0 : v);
  const a = z(o1);
  const b = z(o2);
  const c = z(o3);
  const d = z(o4);
  if (a === 0 && b === 0 && c === 0 && d === 0) {
    return collinearOverlap(ax, az, bx, bz, cx, cz, dx, dz);
  }
  const opp = (p: number, q: number) => (p > 0 && q < 0) || (p < 0 && q > 0);
  return opp(a, b) && opp(c, d);
}

export function segmentDistance(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  cx: number,
  cz: number,
  dx: number,
  dz: number,
): number {
  const d1x = bx - ax;
  const d1z = bz - az;
  const d2x = dx - cx;
  const d2z = dz - cz;
  const rx = ax - cx;
  const rz = az - cz;
  const a = d1x * d1x + d1z * d1z;
  const e = d2x * d2x + d2z * d2z;
  const f = d2x * rx + d2z * rz;
  const EPS = 1e-12;
  let s: number;
  let t: number;
  if (a <= EPS && e <= EPS) {
    return Math.hypot(rx, rz);
  }
  if (a <= EPS) {
    s = 0;
    t = clamp(f / e, 0, 1);
  } else {
    const cc = d1x * rx + d1z * rz;
    if (e <= EPS) {
      t = 0;
      s = clamp(-cc / a, 0, 1);
    } else {
      const b = d1x * d2x + d1z * d2z;
      const denom = a * e - b * b;
      s = Math.abs(denom) > EPS ? clamp((b * f - cc * e) / denom, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-cc / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - cc) / a, 0, 1);
      }
    }
  }
  return Math.hypot(ax + d1x * s - (cx + d2x * t), az + d1z * s - (cz + d2z * t));
}

function pointSegmentDistance(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { dist: number; t: number } {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz;
  if (len2 < 1e-12) return { dist: Math.hypot(px - ax, pz - az), t: 0 };
  const t = clamp(((px - ax) * abx + (pz - az) * abz) / len2, 0, 1);
  return { dist: Math.hypot(px - (ax + abx * t), pz - (az + abz * t)), t };
}

export function countCrossings(
  nodes: Array<{ x: number; z: number }>,
  edges: Array<[number, number]>,
): number {
  let n = 0;
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (pairTangled(nodes, a, b, c, d)) n++;
    }
  }
  n += stackedNodes(nodes);
  n += beadsOnForeignRopes(nodes, edges);
  return n;
}

function pairTangled(
  nodes: Array<{ x: number; z: number }>,
  a: number,
  b: number,
  c: number,
  d: number,
): boolean {
  const na = nodes[a];
  const nb = nodes[b];
  const nc = nodes[c];
  const nd = nodes[d];
  if (Math.hypot(nb.x - na.x, nb.z - na.z) < 0.08) return true;
  if (Math.hypot(nd.x - nc.x, nd.z - nc.z) < 0.08) return true;
  if (segmentsCross(na.x, na.z, nb.x, nb.z, nc.x, nc.z, nd.x, nd.z)) return true;
  return segmentDistance(na.x, na.z, nb.x, nb.z, nc.x, nc.z, nd.x, nd.z) < ROPE_CLEARANCE;
}

export function explainTangle(
  nodes: Array<{ x: number; z: number }>,
  edges: Array<[number, number]>,
): string[] {
  const why: string[] = [];
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (!pairTangled(nodes, a, b, c, d)) continue;
      const dist = segmentDistance(
        nodes[a].x, nodes[a].z, nodes[b].x, nodes[b].z,
        nodes[c].x, nodes[c].z, nodes[d].x, nodes[d].z,
      );
      const cross = segmentsCross(
        nodes[a].x, nodes[a].z, nodes[b].x, nodes[b].z,
        nodes[c].x, nodes[c].z, nodes[d].x, nodes[d].z,
      );
      why.push(`edges ${a}-${b} & ${c}-${d} cross=${cross} dist=${dist.toFixed(3)}`);
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].z - nodes[j].z);
      if (d < NODE_CLEARANCE) why.push(`nodes ${i},${j} dist=${d.toFixed(3)}`);
    }
  }
  for (const [a, b] of edges) {
    for (let i = 0; i < nodes.length; i++) {
      if (i === a || i === b) continue;
      const hit = pointSegmentDistance(nodes[i].x, nodes[i].z, nodes[a].x, nodes[a].z, nodes[b].x, nodes[b].z);
      if (hit.t > 0.08 && hit.t < 0.92 && hit.dist < NODE_ROPE_CLEARANCE) {
        why.push(`node ${i} on rope ${a}-${b} t=${hit.t.toFixed(2)} d=${hit.dist.toFixed(3)}`);
      }
    }
  }
  return why;
}

function stackedNodes(nodes: Array<{ x: number; z: number }>): number {
  let n = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].z - nodes[j].z) < NODE_CLEARANCE) n++;
    }
  }
  return n;
}

function beadsOnForeignRopes(
  nodes: Array<{ x: number; z: number }>,
  edges: Array<[number, number]>,
): number {
  let n = 0;
  for (const [a, b] of edges) {
    for (let i = 0; i < nodes.length; i++) {
      if (i === a || i === b) continue;
      const hit = pointSegmentDistance(nodes[i].x, nodes[i].z, nodes[a].x, nodes[a].z, nodes[b].x, nodes[b].z);
      if (hit.t > 0.08 && hit.t < 0.92 && hit.dist < NODE_ROPE_CLEARANCE) n++;
    }
  }
  return n;
}

export function isUntangled(
  nodes: Array<{ x: number; z: number }>,
  edges: Array<[number, number]>,
): boolean {
  return countCrossings(nodes, edges) === 0;
}

export function starsForMoves(moves: number, cuts: [number, number]): number {
  if (moves <= cuts[0]) return 3;
  if (moves <= cuts[1]) return 2;
  return 1;
}
