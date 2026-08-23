import { packLabel } from "../game/content/levels";
import { completedCount, isUnlocked, LEVEL_COUNT, nextPlayable, starTotal } from "../game/save/save";
import { HINT_DURATION, isHintShowing } from "../game/simulation/hint";
import { HINT_COST } from "../game/simulation/scoring";
import type { AppState } from "../game/simulation/types";

const ICONS = {
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-7 6 7 6"/></svg>`,
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/></svg>`,
  sound: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>`,
  music: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="16" r="2.4"/></svg>`,
  gear: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>`,
  grid: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></svg>`,
  pause: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>`,
};

function starString(n: number): string {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

export function mountUi(root: HTMLElement): {
  sync: (app: AppState) => void;
  on: (event: string, fn: (payload?: number) => void) => void;
} {
  const listeners = new Map<string, (payload?: number) => void>();
  const emit = (event: string, payload?: number) => listeners.get(event)?.(payload);

  const cells = Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const packStart = i === 0 || packLabel(i) !== packLabel(i - 1);
    const open = packStart ? `<section class="pack" data-pack="${packLabel(i)}"><h3>${packLabel(i)}</h3><div class="grid">` : "";
    const closeNext = i === LEVEL_COUNT - 1 || packLabel(i) !== packLabel(i + 1);
    const cell = `<button class="level-cell" type="button" data-level="${i}" aria-label="Level ${i + 1}">${i + 1}</button>`;
    const close = closeNext ? `</div></section>` : "";
    return open + cell + close;
  }).join("");

  root.innerHTML = `
    <div class="scrim"></div>
    <section class="screen" id="screen-title">
      <div class="title-hero">
        <h1>TANGLE<span>MASTER</span></h1>
        <p>Pull the beads. Untie the knot. Master 50 tangles.</p>
      </div>
      <div class="title-actions">
        <button class="play-btn" id="play-btn" type="button">PLAY</button>
        <p class="continue-chip" id="continue-chip"></p>
        <div class="chip" id="title-points" style="margin: 0 auto">0 pts</div>
        <div class="dock">
          <button class="icon-btn" id="btn-sfx" type="button" aria-label="Sound">${ICONS.sound}</button>
          <button class="icon-btn" id="btn-music" type="button" aria-label="Music">${ICONS.music}</button>
          <button class="icon-btn" id="btn-settings" type="button" aria-label="Settings">${ICONS.gear}</button>
          <button class="icon-btn wide" id="btn-levels" type="button">${ICONS.grid}&nbsp;LEVELS</button>
          <button class="icon-btn wide" id="btn-how" type="button">HOW TO</button>
        </div>
      </div>
    </section>

    <section class="screen hidden" id="screen-levels">
      <div class="levels-head">
        <button class="nav-btn" id="levels-home" type="button" aria-label="Home">${ICONS.home}</button>
        <h2>Level Select</h2>
        <div class="levels-meta">
          <div class="chip" id="progress-chip">0 / 50</div>
          <div class="chip" id="stars-chip">★ 0</div>
          <div class="chip" id="levels-points">0 pts</div>
        </div>
      </div>
      <div class="levels-panel" id="levels-panel">${cells}</div>
    </section>

    <div class="hud hidden" id="hud">
      <div class="hud-top">
        <button class="nav-btn" id="hud-home" type="button" aria-label="Home">${ICONS.home}</button>
        <button class="nav-btn" id="hud-pause" type="button" aria-label="Pause">${ICONS.pause}</button>
        <div class="grow">
          <div class="objective">
            <strong id="hud-level">Level 1</strong>
            <span id="hud-status">0 tangles · 0 moves</span>
          </div>
        </div>
        <div class="score-chip" id="hud-score" aria-live="polite"><small>POINTS</small><b id="hud-score-val">0</b></div>
        <button class="icon-btn" id="hud-sfx" type="button" aria-label="Sound">${ICONS.sound}</button>
      </div>
      <div class="hud-bottom">
        <button class="hint-btn" id="hud-hint-btn" type="button">HINT · ${HINT_COST}</button>
        <div class="hud-hint" id="hud-hint">Drag a colorful bead to untangle the ropes</div>
      </div>
    </div>
    <div class="score-float hidden" id="score-float"></div>

    <div class="modal hidden" id="modal-settings">
      <div class="card">
        <h2>Settings</h2>
        <div class="row"><span>Sound effects</span><button class="toggle" id="set-sfx" type="button" aria-label="Toggle sound"></button></div>
        <div class="row"><span>Music</span><button class="toggle" id="set-music" type="button" aria-label="Toggle music"></button></div>
        <div class="row"><span>Reduce motion</span><button class="toggle" id="set-motion" type="button" aria-label="Toggle reduced motion"></button></div>
        <div class="actions">
          <button class="ghost" id="settings-close" type="button">Close</button>
          <button class="danger" id="settings-reset" type="button">Reset progress</button>
        </div>
      </div>
    </div>

    <div class="modal hidden" id="modal-how">
      <div class="card">
        <h2>How to play</h2>
        <ul>
          <li>Each tangle is a knot of glossy 3D ropes and beads.</li>
          <li>Drag a bead to move it. Untangle until no ropes cross.</li>
          <li>Clear a level to unlock the next. Fewer moves earn 10–100 points.</li>
          <li>Hints cost 50 points. One press shows a matching-color home dot and path for every ball for 5 seconds — nothing moves by itself.</li>
        </ul>
        <div class="actions"><button class="primary" id="how-close" type="button">Got it</button></div>
      </div>
    </div>

    <div class="modal hidden" id="modal-pause">
      <div class="card">
        <h2>Paused</h2>
        <p>The knot holds still until you come back.</p>
        <div class="actions">
          <button class="ghost" id="pause-home" type="button">Home</button>
          <button class="ghost" id="pause-levels" type="button">Levels</button>
          <button class="primary" id="pause-resume" type="button">Resume</button>
        </div>
      </div>
    </div>

    <div class="modal hidden" id="modal-result">
      <div class="card">
        <h2 id="result-title">Untangled!</h2>
        <div class="stars-big" id="result-stars">★★★</div>
        <p class="points-big" id="result-points">+0 pts</p>
        <p id="result-copy"></p>
        <div class="actions">
          <button class="ghost" id="result-retry" type="button">Retry</button>
          <button class="ghost" id="result-map" type="button">Levels</button>
          <button class="primary" id="result-next" type="button">Next</button>
        </div>
      </div>
    </div>
  `;

  const byId = (id: string) => root.querySelector(`#${id}`) as HTMLElement;

  byId("play-btn").addEventListener("click", () => emit("play"));
  byId("btn-levels").addEventListener("click", () => emit("levels"));
  byId("btn-settings").addEventListener("click", () => emit("settings"));
  byId("btn-how").addEventListener("click", () => emit("how"));
  byId("btn-sfx").addEventListener("click", () => emit("toggle-sfx"));
  byId("btn-music").addEventListener("click", () => emit("toggle-music"));
  byId("levels-home").addEventListener("click", () => emit("home"));
  byId("hud-home").addEventListener("click", () => emit("home"));
  byId("hud-pause").addEventListener("click", () => emit("pause"));
  byId("hud-sfx").addEventListener("click", () => emit("toggle-sfx"));
  byId("hud-hint-btn").addEventListener("click", () => emit("hint"));
  byId("settings-close").addEventListener("click", () => emit("close-settings"));
  byId("settings-reset").addEventListener("click", () => emit("reset"));
  byId("set-sfx").addEventListener("click", () => emit("toggle-sfx"));
  byId("set-music").addEventListener("click", () => emit("toggle-music"));
  byId("set-motion").addEventListener("click", () => emit("toggle-motion"));
  byId("how-close").addEventListener("click", () => emit("close-how"));
  byId("pause-resume").addEventListener("click", () => emit("resume"));
  byId("pause-home").addEventListener("click", () => emit("home"));
  byId("pause-levels").addEventListener("click", () => emit("levels"));
  byId("result-retry").addEventListener("click", () => emit("retry"));
  byId("result-map").addEventListener("click", () => emit("levels"));
  byId("result-next").addEventListener("click", () => emit("next"));

  root.querySelectorAll<HTMLButtonElement>(".level-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) {
        emit("locked");
        return;
      }
      emit("select-level", Number(btn.dataset.level));
    });
  });

  let lastToastId = -1;

  return {
    on(event, fn) {
      listeners.set(event, fn);
    },
    sync(app) {
      byId("screen-title").classList.toggle("hidden", app.screen !== "title");
      byId("screen-levels").classList.toggle("hidden", app.screen !== "levels");
      byId("hud").classList.toggle("hidden", app.screen !== "play");
      byId("modal-settings").classList.toggle("hidden", !app.settingsOpen);
      byId("modal-how").classList.toggle("hidden", !app.creditsOpen);
      byId("modal-pause").classList.toggle("hidden", !app.pauseOpen);
      byId("modal-result").classList.toggle("hidden", !app.resultOpen);

      const next = nextPlayable(app.save.stars);
      byId("continue-chip").textContent =
        completedCount(app.save.stars) === 0 ? "Level 1 is ready" : `Continue · Level ${next + 1}`;

      const mark = (id: string, on: boolean) => {
        const el = byId(id);
        el.classList.toggle("off", !on);
        el.classList.toggle("on", on);
      };
      mark("btn-sfx", app.save.settings.sfx);
      mark("btn-music", app.save.settings.music);
      mark("hud-sfx", app.save.settings.sfx);
      byId("set-sfx").classList.toggle("on", app.save.settings.sfx);
      byId("set-music").classList.toggle("on", app.save.settings.music);
      byId("set-motion").classList.toggle("on", app.save.settings.reducedMotion);

      byId("progress-chip").textContent = `${completedCount(app.save.stars)} / ${LEVEL_COUNT}`;
      byId("stars-chip").textContent = `★ ${starTotal(app.save.stars)}`;
      byId("title-points").textContent = `${app.save.points} pts`;
      byId("levels-points").textContent = `${app.save.points} pts`;
      const scoreChip = byId("hud-score");
      const scoreVal = byId("hud-score-val");
      scoreVal.textContent = String(app.save.points);

      root.querySelectorAll<HTMLButtonElement>(".level-cell").forEach((btn) => {
        const i = Number(btn.dataset.level);
        const unlocked = isUnlocked(app.save.stars, i);
        const stars = app.save.stars[i];
        btn.disabled = !unlocked;
        btn.classList.toggle("locked", !unlocked);
        btn.classList.toggle("done", stars > 0);
        btn.innerHTML = unlocked
          ? `${i + 1}${stars > 0 ? `<span class="stars">${starString(stars)}</span>` : ""}`
          : `${i + 1}<span class="lock">🔒</span>`;
      });

      const hintBtn = byId("hud-hint-btn") as HTMLButtonElement;
      const showingHint = !!app.puzzle && isHintShowing(app.puzzle);
      const canHint =
        !!app.puzzle &&
        !app.puzzle.won &&
        !app.pauseOpen &&
        !app.resultOpen &&
        !showingHint &&
        app.save.points >= HINT_COST;
      hintBtn.disabled = !canHint;
      if (showingHint && app.puzzle) {
        hintBtn.textContent = `HINT · ${Math.max(1, Math.ceil(app.puzzle.hintRemaining))}s`;
        hintBtn.title = "Hints are already showing";
      } else if (app.save.points < HINT_COST) {
        hintBtn.textContent = `HINT · ${app.save.points}/${HINT_COST}`;
        hintBtn.title = `Need ${HINT_COST} points for a hint`;
      } else {
        hintBtn.textContent = `HINT · ${HINT_COST}`;
        hintBtn.title = `Spend ${HINT_COST} points to show every ball's home for ${HINT_DURATION}s`;
      }

      if (app.puzzle) {
        byId("hud-level").textContent = `Level ${app.puzzle.levelIndex + 1}`;
        byId("hud-status").textContent = app.puzzle.won
          ? `Cleared · ${starString(app.puzzle.starsEarned)}`
          : `${app.puzzle.crossings} tangle${app.puzzle.crossings === 1 ? "" : "s"} · ${app.puzzle.moves} moves`;
        const hintEl = byId("hud-hint");
        if (showingHint) {
          hintEl.style.opacity = "1";
          hintEl.textContent = "Follow each color to its matching dot";
        } else {
          hintEl.style.opacity = app.puzzle.moves < 2 && !app.puzzle.won ? "1" : "0";
          hintEl.textContent = "Drag a colorful bead to untangle the ropes";
        }
      }

      const floatEl = byId("score-float");
      if (app.scoreToast && app.scoreToast.id !== lastToastId) {
        lastToastId = app.scoreToast.id;
        const signed = app.scoreToast.kind === "gain" ? `+${app.scoreToast.amount}` : `-${app.scoreToast.amount}`;
        floatEl.textContent = `${signed} pts`;
        floatEl.classList.remove("hidden", "gain", "spend");
        void floatEl.offsetWidth;
        floatEl.classList.add(app.scoreToast.kind);
        scoreChip.classList.remove("pulse-gain", "pulse-spend");
        void scoreChip.offsetWidth;
        scoreChip.classList.add(app.scoreToast.kind === "gain" ? "pulse-gain" : "pulse-spend");
      }

      if (app.resultOpen && app.puzzle) {
        byId("result-title").textContent = "Untangled!";
        byId("result-stars").textContent = starString(app.puzzle.starsEarned);
        const gained = app.puzzle.pointsGained;
        byId("result-points").textContent =
          gained > 0 ? `+${gained} pts` : `${app.puzzle.pointsEarned} pts · best kept`;
        byId("result-copy").textContent = `${app.puzzle.moves} moves · ${app.puzzle.pointsEarned} this run · ${app.puzzle.starsEarned} star${app.puzzle.starsEarned === 1 ? "" : "s"}`;
        const last = app.puzzle.levelIndex >= LEVEL_COUNT - 1;
        const nextBtn = byId("result-next") as HTMLButtonElement;
        nextBtn.textContent = last ? "Home" : "Next";
      }
    },
  };
}
