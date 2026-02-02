
export class SoundScheduler {
  constructor(ctx, durationSequence) {
    this.ctx = ctx; // usi il contesto passato 
    this.durationSequence = durationSequence;
    this.isPlaying = false;
    this.scheduleTimes = this.calculateAbsoluteTimes(durationSequence);
  }


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
//  AUDIO MANAGER 
//--------------------------------------------------
export class AudioManager {
  constructor() {
    this.ctx = null;

    
    this.inputSound = localStorage.getItem("btb_input_sound") || "osc"; // osc|clap|dog|cat

    
    this.sampleBuffers = new Map(); // name -> AudioBuffer
    this.samplesToLoad = ["clap", "dog", "cat", "error", "ui_touch", "gameOver"];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    
    this.preloadSamples();
  }

  setInputSound(value) {
    this.inputSound = value || "osc";
    localStorage.setItem("btb_input_sound", this.inputSound);
  }

  async preloadSamples() {
    if (!this.ctx) return;

    
    for (const name of this.samplesToLoad) {
      if (this.sampleBuffers.has(name)) continue;

      try {
        const res = await fetch(`samples/${name}.wav`);
        const arr = await res.arrayBuffer();
        const buf = await this.ctx.decodeAudioData(arr);
        this.sampleBuffers.set(name, buf);
      } catch (e) {
        console.warn("Could not load sample:", name, e);
      }
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

    
    const selected = localStorage.getItem("btb_input_sound") || this.inputSound || "osc";

    
    if (selected !== "osc") {
      const buffer = this.sampleBuffers.get(selected);

      
      if (buffer) {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.value = 0.9; // volume

        src.buffer = buffer;
        src.connect(gain);
        gain.connect(this.ctx.destination);

        src.start();
        return;
      }
    }

    // 2) DEFAULT OSC
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

  
  playError() {
    if (!this.ctx) return;

    
    const buffer = this.sampleBuffers.get("error");
    if (buffer) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.8; // Volume errore

      src.buffer = buffer;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      return;
    }
  }
  
/*
   playTouchUI() {
    if (!this.ctx) return;

    
    const buffer = this.sampleBuffers.get("ui_touch");
    if (buffer) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.8; // Volume touch

      src.buffer = buffer;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      return;
    }
  }
*/

  playGameOver() {
    if (!this.ctx) return;

    
    const buffer = this.sampleBuffers.get("gameOver");
    if (buffer) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.8; 
      src.playbackRate.value = 2.0; 
      src.buffer = buffer;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(0,0.90);
      return;
    }
} 

}

