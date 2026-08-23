import { CAMPAIGN } from "../content/levels";
import type { PuzzleState } from "./types";

export const HINT_DURATION = 5;

/** Places a color-matched target for every ball. Never moves beads. */
export function activateHints(puzzle: PuzzleState): boolean {
  if (puzzle.won || puzzle.nodes.length === 0) return false;
  if (puzzle.hintRemaining > 0) return false;
  const solved = CAMPAIGN[puzzle.levelIndex].solved;
  if (!solved || solved.length !== puzzle.nodes.length) return false;
  puzzle.hintTargets = solved.map(([x, z]) => ({ x, z }));
  puzzle.hintRemaining = HINT_DURATION;
  return true;
}

export function clearHints(puzzle: PuzzleState): void {
  puzzle.hintTargets = null;
  puzzle.hintRemaining = 0;
}

export function tickHints(puzzle: PuzzleState, dt: number, frozen: boolean): void {
  if (puzzle.hintRemaining <= 0) return;
  if (frozen) return;
  puzzle.hintRemaining -= dt;
  if (puzzle.hintRemaining <= 0) clearHints(puzzle);
}

export function isHintShowing(puzzle: PuzzleState): boolean {
  return puzzle.hintRemaining > 0 && !!puzzle.hintTargets && puzzle.hintTargets.length === puzzle.nodes.length;
}
