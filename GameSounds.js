/**
 * Schedulatore di suoni che usa l'AudioContext interno.
 * Qui lo usiamo solo per far "suonare" il pattern del computer.
 */

export class SoundScheduler {
  constructor(ctx, durationSequence) {
    this.ctx = ctx; // usi il contesto passato 
    this.durationSequence = durationSequence;
    this.isPlaying = false;
    this.scheduleTimes = this.calculateAbsoluteTimes(durationSequence);
  }

  /**
   * Converte durate relative in tempi assoluti di attacco.
   * Esempio: [1, 1, 1, 1] -> [0, 1, 2, 3]
   */
  calculateAbsoluteTimes(durations) {
    const absoluteTimes = [];
    let cumulativeTime = 0;

    absoluteTimes.push(0);

    for (let i = 0; i < durations.length - 1; i++) {
      cumulativeTime += durations[i];
      absoluteTimes.push(cumulativeTime);
    }

    return absoluteTimes;
  }

  /**
   * Suono del pattern: più in risalto rispetto al metronomo.
   */
  scheduleClick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(2000, time);
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.6, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  play() {
    if (!this.ctx) return;
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const startTime = this.ctx.currentTime;

    this.scheduleTimes.forEach((relativeTime) => {
      const absoluteScheduleTime = startTime + relativeTime;
      this.scheduleClick(absoluteScheduleTime);
    });

    const totalDuration = this.durationSequence.reduce((a, b) => a + b, 0);
    setTimeout(() => {
      this.isPlaying = false;
    }, (totalDuration * 1000) + 200);
  }
}

//--------------------------------------------------
//  AUDIO MANAGER (metronomo + hit player)
//--------------------------------------------------
export class AudioManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  click() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 900;
    const t0 = this.ctx.currentTime;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.1);
  }

  hitSound() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 300;
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.7, this.ctx.currentTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
}
