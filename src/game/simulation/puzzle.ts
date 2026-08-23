import { CAMPAIGN } from "../content/levels";
import { countCrossings, isUntangled, starsForMoves } from "./geometry";
import { clearHints } from "./hint";
import { pointsForClear } from "./scoring";
import type { PuzzleState } from "./types";

export function createPuzzle(levelIndex: number): PuzzleState {
  const level = CAMPAIGN[levelIndex];
  const nodes = level.start.map(([x, z]) => ({ x, z }));
  return {
    levelIndex,
    nodes,
    edges: level.edges.map((e) => [e[0], e[1]]),
    crossings: countCrossings(nodes, level.edges),
    moves: 0,
    dragging: -1,
    won: false,
    starsEarned: 0,
    pointsEarned: 0,
    pointsGained: 0,
    hintTargets: null,
    hintRemaining: 0,
  };
}

export function refreshCrossings(puzzle: PuzzleState): void {
  puzzle.crossings = countCrossings(puzzle.nodes, puzzle.edges);
}

export function tryWin(puzzle: PuzzleState): boolean {
  if (puzzle.won) return false;
  if (puzzle.moves < 1) return false;
  if (!isUntangled(puzzle.nodes, puzzle.edges)) return false;
  const cuts = CAMPAIGN[puzzle.levelIndex].starCuts;
  puzzle.won = true;
  puzzle.starsEarned = starsForMoves(puzzle.moves, cuts);
  puzzle.pointsEarned = pointsForClear(CAMPAIGN[puzzle.levelIndex], puzzle.moves);
  puzzle.crossings = 0;
  clearHints(puzzle);
  return true;
}

export function clampNode(node: { x: number; z: number }, radius = 3.15): void {
  const d = Math.hypot(node.x, node.z);
  if (d > radius) {
    node.x = (node.x / d) * radius;
    node.z = (node.z / d) * radius;
  }
}
