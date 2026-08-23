import type { SaveData, Settings } from "../simulation/types";

export const LEVEL_COUNT = 50;
const KEY = "tangle-master-save-v1";

export const defaultSettings = (): Settings => ({
  sfx: true,
  music: true,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});

export function defaultSave(): SaveData {
  return {
    stars: Array.from({ length: LEVEL_COUNT }, () => 0),
    bestScore: Array.from({ length: LEVEL_COUNT }, () => 0),
    points: 0,
    settings: defaultSettings(),
    lastPlayed: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    if (Array.isArray(parsed.stars) && parsed.stars.length === LEVEL_COUNT) {
      base.stars = parsed.stars.map((n) => (n === 1 || n === 2 || n === 3 ? n : 0));
    }
    if (parsed.settings) {
      base.settings = { ...base.settings, ...parsed.settings };
    }
    if (typeof parsed.lastPlayed === "number") {
      base.lastPlayed = Math.max(0, Math.min(LEVEL_COUNT - 1, parsed.lastPlayed));
    }
    if (typeof parsed.points === "number" && Number.isFinite(parsed.points)) {
      base.points = Math.max(0, Math.round(parsed.points));
    }
    if (Array.isArray(parsed.bestScore) && parsed.bestScore.length === LEVEL_COUNT) {
      base.bestScore = parsed.bestScore.map((n) =>
        typeof n === "number" && n >= 10 && n <= 100 ? Math.round(n) : 0,
      );
    }
    return base;
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function isUnlocked(stars: number[], index: number): boolean {
  if (index <= 0) return true;
  return stars[index - 1] > 0;
}

export function nextPlayable(stars: number[]): number {
  for (let i = 0; i < stars.length; i++) {
    if (isUnlocked(stars, i) && stars[i] === 0) return i;
  }
  let last = 0;
  for (let i = 0; i < stars.length; i++) {
    if (stars[i] > 0) last = i;
  }
  return last;
}

export function completedCount(stars: number[]): number {
  return stars.filter((s) => s > 0).length;
}

export function starTotal(stars: number[]): number {
  return stars.reduce((a, b) => a + b, 0);
}
