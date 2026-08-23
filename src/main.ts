import "./style.css";
import * as THREE from "three";
import { GameAudio } from "./audio/audio";
import { CAMPAIGN } from "./game/content/levels";
import { createPointer } from "./game/input/input";
import { defaultSave, isUnlocked, loadSave, nextPlayable, persistSave } from "./game/save/save";
import { activateHints, isHintShowing, tickHints } from "./game/simulation/hint";
import { clampNode, createPuzzle, refreshCrossings, tryWin } from "./game/simulation/puzzle";
import { HINT_COST } from "./game/simulation/scoring";
import type { AppState } from "./game/simulation/types";
import { createRenderer, setMenuCamera, setPlayCamera } from "./render/app/renderer";
import { addLights } from "./render/lights/lights";
import { PuzzleView } from "./render/objects/puzzleView";
import { TitleKnot } from "./render/objects/titleKnot";
import { mountUi } from "./ui/menus";

const host = document.querySelector("#game-root") as HTMLElement;
const uiRoot = document.querySelector("#ui-root") as HTMLElement;
const { scene, camera, renderer } = createRenderer(host);
addLights(scene);

const knot = new TitleKnot();
scene.add(knot.root);
const puzzleView = new PuzzleView();
scene.add(puzzleView.root);

const app: AppState = {
  screen: "title",
  settingsOpen: false,
  creditsOpen: false,
  pauseOpen: false,
  resultOpen: false,
  save: loadSave(),
  puzzle: null,
  time: 0,
  scoreToast: null,
};

const audio = new GameAudio();
audio.sfx = app.save.settings.sfx;
audio.music = app.save.settings.music;

const ui = mountUi(uiRoot);
const pointer = createPointer(renderer.domElement, camera);
let toastSeq = 0;

function flashScore(amount: number, kind: "gain" | "spend"): void {
  toastSeq += 1;
  app.scoreToast = { id: toastSeq, amount, kind };
}

function saveNow(): void {
  persistSave(app.save);
  audio.sfx = app.save.settings.sfx;
  audio.music = app.save.settings.music;
}

function goTitle(): void {
  app.screen = "title";
  app.pauseOpen = false;
  app.resultOpen = false;
  app.settingsOpen = false;
  app.creditsOpen = false;
  app.puzzle = null;
  puzzleView.setVisible(false);
  knot.setVisible(true);
}

function goLevels(): void {
  app.screen = "levels";
  app.pauseOpen = false;
  app.resultOpen = false;
  app.puzzle = null;
  puzzleView.setVisible(false);
  knot.setVisible(true);
}

function startLevel(index: number): void {
  if (!isUnlocked(app.save.stars, index)) {
    audio.lock();
    return;
  }
  app.save.lastPlayed = index;
  app.puzzle = createPuzzle(index);
  app.screen = "play";
  app.pauseOpen = false;
  app.resultOpen = false;
  app.settingsOpen = false;
  app.creditsOpen = false;
  knot.setVisible(false);
  puzzleView.setVisible(true);
  puzzleView.rebuild(app.puzzle);
  setPlayCamera(camera);
  saveNow();
}

ui.on("play", () => {
  audio.unlock();
  audio.tap();
  startLevel(nextPlayable(app.save.stars));
});
ui.on("levels", () => {
  audio.unlock();
  audio.tap();
  goLevels();
});
ui.on("home", () => {
  audio.tap();
  goTitle();
});
ui.on("settings", () => {
  audio.tap();
  app.settingsOpen = true;
});
ui.on("close-settings", () => {
  app.settingsOpen = false;
});
ui.on("how", () => {
  audio.tap();
  app.creditsOpen = true;
});
ui.on("close-how", () => {
  app.creditsOpen = false;
});
ui.on("pause", () => {
  if (app.screen === "play" && !app.resultOpen) app.pauseOpen = true;
});
ui.on("resume", () => {
  app.pauseOpen = false;
});
ui.on("toggle-sfx", () => {
  app.save.settings.sfx = !app.save.settings.sfx;
  saveNow();
  audio.tap();
});
ui.on("toggle-music", () => {
  app.save.settings.music = !app.save.settings.music;
  saveNow();
  audio.tap();
});
ui.on("toggle-motion", () => {
  app.save.settings.reducedMotion = !app.save.settings.reducedMotion;
  saveNow();
});
ui.on("reset", () => {
  const keep = app.save.settings;
  app.save = defaultSave();
  app.save.settings = keep;
  saveNow();
  audio.lock();
});
ui.on("select-level", (index) => {
  audio.unlock();
  audio.tap();
  if (typeof index === "number") startLevel(index);
});
ui.on("locked", () => audio.lock());
ui.on("hint", () => {
  if (!app.puzzle || app.puzzle.won || app.pauseOpen || app.resultOpen) return;
  if (isHintShowing(app.puzzle)) {
    audio.lock();
    return;
  }
  if (app.save.points < HINT_COST) {
    audio.lock();
    return;
  }
  if (!activateHints(app.puzzle)) {
    audio.lock();
    return;
  }
  app.save.points -= HINT_COST;
  saveNow();
  flashScore(HINT_COST, "spend");
  audio.spend();
});
ui.on("retry", () => {
  if (app.puzzle) startLevel(app.puzzle.levelIndex);
});
ui.on("next", () => {
  if (!app.puzzle) return;
  const n = app.puzzle.levelIndex + 1;
  if (n >= CAMPAIGN.length) {
    goTitle();
    return;
  }
  startLevel(n);
});

let grabX = 0;
let grabZ = 0;

pointer.onDown(() => {
  audio.unlock();
  if (app.screen !== "play" || app.pauseOpen || app.resultOpen || !app.puzzle) return;
  const id = puzzleView.pickNode(pointer.raycaster);
  if (id < 0) return;
  app.puzzle.dragging = id;
  grabX = app.puzzle.nodes[id].x;
  grabZ = app.puzzle.nodes[id].z;
  audio.grab();
});

pointer.onMove(() => {
  if (!app.puzzle || app.puzzle.dragging < 0 || !pointer.planeHit) return;
  const node = app.puzzle.nodes[app.puzzle.dragging];
  node.x = pointer.planeHit.x;
  node.z = pointer.planeHit.z;
  clampNode(node);
  refreshCrossings(app.puzzle);
  puzzleView.sync(app.puzzle);
});

pointer.onUp(() => {
  if (!app.puzzle || app.puzzle.dragging < 0) return;
  const node = app.puzzle.nodes[app.puzzle.dragging];
  const dragged = Math.hypot(node.x - grabX, node.z - grabZ) > 0.05;
  app.puzzle.dragging = -1;
  refreshCrossings(app.puzzle);
  puzzleView.sync(app.puzzle);
  audio.drop();
  if (!dragged) return;
  app.puzzle.moves += 1;
  if (tryWin(app.puzzle)) {
    const idx = app.puzzle.levelIndex;
    const prevBest = app.save.bestScore[idx];
    const gain = Math.max(0, app.puzzle.pointsEarned - prevBest);
    app.puzzle.pointsGained = gain;
    if (gain > 0) {
      app.save.bestScore[idx] = app.puzzle.pointsEarned;
      app.save.points += gain;
      flashScore(gain, "gain");
      audio.gain();
    }
    const prevStars = app.save.stars[idx];
    app.save.stars[idx] = Math.max(prevStars, app.puzzle.starsEarned);
    saveNow();
    app.resultOpen = true;
    audio.win();
  }
});

window.addEventListener("visibilitychange", () => {
  if (document.hidden && app.screen === "play" && !app.resultOpen) app.pauseOpen = true;
});

const clock = new THREE.Clock();
ui.sync(app);

const splashDone = (window as Window & { __bootSplashDone?: Promise<void> }).__bootSplashDone;
void (splashDone ?? Promise.resolve()).then(() => {
  document.getElementById("boot-splash")?.classList.add("hidden");
});

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  app.time += dt;
  const reduced = app.save.settings.reducedMotion;
  if (app.screen !== "play") {
    setMenuCamera(camera, reduced, app.time);
    knot.update(dt, app.time, reduced);
  } else if (app.puzzle) {
    tickHints(app.puzzle, dt, app.pauseOpen || app.resultOpen);
    puzzleView.sync(app.puzzle);
  }
  audio.updateMusic(dt);
  ui.sync(app);
  renderer.render(scene, camera);
});
