import { CAMPAIGN } from "../content/levels";
import { countCrossings, explainTangle, isUntangled, segmentsCross } from "./geometry";
import { HINT_COST, pointsForClear } from "./scoring";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(
  segmentsCross(-1, 0, 1, 0, 0, -1, 0, 1),
  "midpoint cross should count",
);
assert(
  segmentsCross(-2, 0, 2, 0, 1.95, -1, 1.95, 1),
  "near-vertex cross should count",
);
assert(
  !segmentsCross(0, 0, 1, 0, 1, 0, 2, 0),
  "endpoint touch should not count as a crossing",
);

const bowtie = [
  { x: -1, z: -1 },
  { x: 1, z: 1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
];
const cycle4: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];
assert(!isUntangled(bowtie, cycle4), "bowtie must stay unsolved");

const square = [
  { x: -1.6, z: -1.6 },
  { x: 1.6, z: -1.6 },
  { x: 1.6, z: 1.6 },
  { x: -1.6, z: 1.6 },
];
assert(isUntangled(square, cycle4), "convex cycle must be solved");

for (const level of CAMPAIGN) {
  const start = level.start.map(([x, z]) => ({ x, z }));
  const solved = level.solved.map(([x, z]) => ({ x, z }));
  assert(countCrossings(start, level.edges) > 0, `${level.id} start must be tangled`);
  assert(!isUntangled(start, level.edges), `${level.id} start must not pass win check`);
  if (!isUntangled(solved, level.edges)) {
    throw new Error(`${level.id} intended layout must be solvable: ${explainTangle(solved, level.edges).join(" | ")}`);
  }
}

assert(HINT_COST === 50, "hint cost must be 50");
for (const level of CAMPAIGN) {
  const hi = pointsForClear(level, 1);
  const lo = pointsForClear(level, 400);
  const parScore = pointsForClear(level, level.starCuts[0]);
  assert(hi === 100 && parScore === 100, `${level.id} efficient clear must be 100`);
  assert(lo === 10, `${level.id} slow clear must be 10`);
  const mid = pointsForClear(level, level.starCuts[0] + 2);
  assert(mid >= 10 && mid <= 100, `${level.id} mid score out of range`);
  assert(mid < 100, `${level.id} extra moves must reduce score`);
}

console.log(`geometry ok · ${CAMPAIGN.length} levels validated`);
