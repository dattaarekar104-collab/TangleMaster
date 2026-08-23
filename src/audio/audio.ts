export class GameAudio {
  private ctx: AudioContext | null = null;
  sfx = true;
  music = true;
  private musicTimer = 0;
  private step = 0;

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
    }
    void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, delay = 0): void {
    if (!this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  tap(): void {
    this.tone(520, 0.07, "triangle", 0.05);
  }

  grab(): void {
    this.tone(340, 0.08, "sine", 0.05);
  }

  drop(): void {
    this.tone(280, 0.09, "sine", 0.04);
  }

  lock(): void {
    this.tone(180, 0.12, "square", 0.03);
  }

  win(): void {
    this.tone(523, 0.12, "triangle", 0.07, 0);
    this.tone(659, 0.14, "triangle", 0.07, 0.1);
    this.tone(784, 0.22, "triangle", 0.08, 0.2);
  }

  star(): void {
    this.tone(880, 0.1, "sine", 0.05);
  }

  gain(): void {
    this.tone(660, 0.1, "triangle", 0.06, 0);
    this.tone(880, 0.14, "triangle", 0.07, 0.08);
  }

  spend(): void {
    this.tone(420, 0.1, "sine", 0.05, 0);
    this.tone(280, 0.14, "sine", 0.05, 0.08);
  }

  updateMusic(dt: number): void {
    if (!this.music || !this.ctx) return;
    this.musicTimer += dt;
    if (this.musicTimer < 0.46) return;
    this.musicTimer = 0;
    const notes = [392, 494, 587, 494, 440, 523, 392, 330];
    const f = notes[this.step % notes.length];
    this.step++;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.025, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.42);
  }
}
