
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
    this.samplesToLoad = ["clap", "dog", "cat", "error", "ui_touch", "gameOver","menuMusicLF","menuMusic"];
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
      gain.gain.value = 0.6; // Volume errore

      src.buffer = buffer;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      return;
    }
  }
  

   playTouchUI() {
    if (!this.ctx) return;

    
    const buffer = this.sampleBuffers.get("ui_touch");
    if (buffer) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.9; // Volume touch

      src.buffer = buffer;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(0,0.0677); 
      return;
    }
  }


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
      src.start(this.ctx.currentTime + 0.50,0.9);
      return;
    }
} 



playIndexMusic() {
    if (!this.ctx) return;
    
    //non sovrapporre più istanze della stessa musica
    if (this.bgmSource) return;

    const buffer = this.sampleBuffers.get("menuMusic");
    if (!buffer) return;

    this.bgmSource = this.ctx.createBufferSource();
    this.bgmGain = this.ctx.createGain();

    // filtro passa-basso musica ovattata
    this.bgmFilter = this.ctx.createBiquadFilter();
    this.bgmFilter.type = 'lowpass'; 
    this.bgmFilter.frequency.value = 650; // freq di taglio
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true; 
    this.bgmGain.gain.value = 0.2; 
    this.bgmSource.connect(this.bgmFilter);
    this.bgmFilter.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.bgmSource.start(); 
}




playGamesListMusic() {
    if (!this.ctx) return;
    
   
    if (this.bgmSource) return;

    const buffer = this.sampleBuffers.get("menuMusic");
    if (!buffer) return;

    this.bgmSource = this.ctx.createBufferSource();
    this.bgmGain = this.ctx.createGain();

    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true; 
    this.bgmGain.gain.value = 0.3; 

    this.bgmSource.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.bgmSource.start(); 
  }



playMenuMusic() {
    if (!this.ctx) return;
    
    
    if (this.bgmSource) return;

    const buffer = this.sampleBuffers.get("menuMusicLF");
    if (!buffer) return;

    this.bgmSource = this.ctx.createBufferSource();
    this.bgmGain = this.ctx.createGain();

    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true; 
    this.bgmGain.gain.value = 0.4; 

    this.bgmSource.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.bgmSource.start(this.ctx.currentTime + 2.3); // Parte dopo 1 secondo e mezzo
  }

  //ferma la musica di sottofondo 
  stopMenuMusic() {
    if (this.bgmSource) {
      // Fade out 
      try {
        this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        this.bgmSource.stop(this.ctx.currentTime + 0.5);
      } catch(e) {
        this.bgmSource.stop(); 
      }
      
      this.bgmSource = null;
      this.bgmGain = null;
    }
  }


}

