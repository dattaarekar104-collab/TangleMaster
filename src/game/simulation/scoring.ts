import type { LevelDef } from "./types";

export const HINT_COST = 50;

/** 100 at or under par, 10 at a band-scaled move cap. Par already grows with nodes/edges. */
export function pointsForClear(level: LevelDef, moves: number): number {
  const par = Math.max(1, level.starCuts[0]);
  const span =
    level.band === "easy" ? par * 1.2 : level.band === "medium" ? par * 1.6 : par * 2.1;
  const floorAt = Math.max(par + 1, Math.round(par + span));
  if (moves <= par) return 100;
  if (moves >= floorAt) return 10;
  return Math.round(100 - (90 * (moves - par)) / (floorAt - par));
}
