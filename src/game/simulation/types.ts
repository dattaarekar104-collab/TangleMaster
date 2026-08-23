export type ScreenId = "title" | "levels" | "play";

export type DifficultyBand = "easy" | "medium" | "hard";

export interface LevelDef {
  id: string;
  index: number;
  band: DifficultyBand;
  nodeCount: number;
  edges: Array<[number, number]>;
  start: Array<[number, number]>;
  solved: Array<[number, number]>;
  starCuts: [number, number];
}

export interface PuzzleState {
  levelIndex: number;
  nodes: Array<{ x: number; z: number }>;
  edges: Array<[number, number]>;
  crossings: number;
  moves: number;
  dragging: number;
  won: boolean;
  starsEarned: number;
  pointsEarned: number;
  pointsGained: number;
  hintTargets: Array<{ x: number; z: number }> | null;
  hintRemaining: number;
}

export interface ScoreToast {
  id: number;
  amount: number;
  kind: "gain" | "spend";
}

export interface Settings {
  sfx: boolean;
  music: boolean;
  reducedMotion: boolean;
}

export interface SaveData {
  stars: number[];
  bestScore: number[];
  points: number;
  settings: Settings;
  lastPlayed: number;
}

export interface AppState {
  screen: ScreenId;
  settingsOpen: boolean;
  creditsOpen: boolean;
  pauseOpen: boolean;
  resultOpen: boolean;
  save: SaveData;
  puzzle: PuzzleState | null;
  time: number;
  scoreToast: ScoreToast | null;
}
