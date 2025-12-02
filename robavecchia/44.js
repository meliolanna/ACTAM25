//--------------------------------------------------
// AUDIO MANAGER
//--------------------------------------------------
class AudioManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // metronomo beep
  click() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = 1000; // click acuto
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // suono del giocatore
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


//--------------------------------------------------
// GAME MODEL (stato globale + lista minigiochi)
//--------------------------------------------------
class GameModel {
  constructor() {
    this.maxLives = 3;
    this.lives = this.maxLives;

    this.baseBpm = 60;
    this.bpmStep = 6;
    this.round = 1;

    this.currentMiniGameIndex = 0;
    this.miniGames = [];
  }

  get bpm() {
    return this.baseBpm + (this.round - 1) * this.bpmStep;
  }

  addMiniGame(miniGame) {
    this.miniGames.push(miniGame);
  }

  get currentMiniGame() {
    return this.miniGames[this.currentMiniGameIndex];
  }

  nextMiniGame() {
    if (!this.miniGames.length) return;
    this.currentMiniGameIndex = (this.currentMiniGameIndex + 1) % this.miniGames.length;
  }

  resetLives() {
    this.lives = this.maxLives;
  }

  loseLife() {
    this.lives--;
    return this.lives <= 0;
  }

  nextRound() {
    this.round++;
  }
}


//--------------------------------------------------
// MINIGIOCO: 4 beat ascolto + 4 beat input, un bottone
//--------------------------------------------------
class FourBeatsHitMiniGame {
  constructor() {
    this.id = "4beats_hit";
    this.name = "4 Beat Hit";

    this.totalBeats = 8;          // 4 listen + 4 input
    this.hitWindow = 0.15;        // ±15% del beat

    this.beatIndex = 0;           // 0..7
    this.hitPerBeat = [];
  }

  startRound(gameModel) {
    this.beatIndex = 0;
    this.hitPerBeat = new Array(this.totalBeats).fill(false);

    return {
      type: "roundStart",
      payload: {
        miniGameId: this.id,
        miniGameName: this.name
      }
    };
  }

  /**
   * Chiamato ad ogni beat
   * @returns { type: "continue"|"roundEnd", payload?: {events:[]}}
   */
  onBeat(gameModel, beatIndex) {
    const events = [];
    this.beatIndex = beatIndex;

    const prev = beatIndex - 1;

    // Miss sul beat precedente (solo se era un beat di input)
    if (prev >= 4 && prev < this.totalBeats) {
      if (!this.hitPerBeat[prev]) {
        events.push({
          type: "miss",
          payload: { beatIndex: prev }
        });
      }
    }

    // fine minigioco
    if (beatIndex >= this.totalBeats) {
      return { type: "roundEnd", payload: { events } };
    }

    const phase = beatIndex < 4 ? "listen" : "input";
    const ledIndex = beatIndex % 4;

    events.push({
      type: "beat",
      payload: { beatIndex, ledIndex, phase }
    });

    return { type: "continue", payload: { events } };
  }

  /**
   * deltaMs = differenza rispetto al centro del beat target
   * targetBeatIndex = beat a cui associamo il colpo (deciso dal controller)
   */
  onInput(gameModel, deltaMs, targetBeatIndex) {
    const beatIndex = targetBeatIndex; // 0..7

    // input valido solo sui beat 4..7 (fase input)
    if (beatIndex < 4 || beatIndex >= this.totalBeats) {
      return { type: "ignore", payload: {} };
    }

    // se abbiamo già registrato un hit su questo beat, ignoriamo
    if (this.hitPerBeat[beatIndex]) {
      return { type: "ignore", payload: {} };
    }

    this.hitPerBeat[beatIndex] = true;

    const beatDuration = 60000 / gameModel.bpm;
    const windowMs = beatDuration * this.hitWindow;
    const absDelta = Math.abs(deltaMs);

    if (absDelta <= windowMs) {
      // Perfetto (entro finestra simmetrica)
      return { type: "perfect", payload: {} };
    }

    // Errore: early o late rispetto al beat target
    const reason = deltaMs < 0 ? "early" : "late";

    return {
      type: "timingError",
      payload: { reason }
    };
  }
}


//--------------------------------------------------
// VIEW (DOM/UI) – semplice e precisa sulle vite
//--------------------------------------------------
class RhythmView {
  constructor() {
    this.leds = [...document.querySelectorAll(".led")];
    this.startBtn = document.getElementById("startButton");
    this.hitBtn = document.getElementById("hitButton");
    this.status = document.getElementById("statusText");
    this.bpmEl = document.getElementById("bpmDisplay");
    this.roundEl = document.getElementById("roundDisplay");
    this.lifeContainer = document.getElementById("lifeContainer");

    // piccola label testuale per debug vite
    this.lifeLabel = document.createElement("div");
    this.lifeLabel.style.fontSize = "0.8rem";
    this.lifeLabel.style.marginTop = "4px";
    this.lifeLabel.style.color = "#555";
    this.lifeContainer.parentElement.appendChild(this.lifeLabel);
  }

  onStart(cb) {
    this.startBtn.onclick = cb;
  }

  onHit(cb) {
    this.hitBtn.onclick = cb;
  }

  setStatus(t) { this.status.textContent = t; }
  setBpm(v) { this.bpmEl.textContent = v; }
  setRound(v) { this.roundEl.textContent = v; }
  enableStart(v) { this.startBtn.disabled = !v; }

  renderLives(lives) {
    this.lifeContainer.innerHTML = "";
    const hearts = "❤️".repeat(Math.max(0, lives));
    this.lifeContainer.textContent = hearts;
    this.lifeLabel.textContent = `Vite: ${lives}`;
  }

  setActiveLed(i) {
    this.leds.forEach((led, idx) =>
      led.classList.toggle("led--active", idx === i)
    );
  }

  flashCorrect() {
    this.hitBtn.classList.add("hit-btn-big--correct");
    setTimeout(() => this.hitBtn.classList.remove("hit-btn-big--correct"), 200);
  }

  flashWrong() {
    this.hitBtn.classList.add("hit-btn-big--wrong");
    setTimeout(() => this.hitBtn.classList.remove("hit-btn-big--wrong"), 200);
  }
}


//--------------------------------------------------
// CONTROLLER (timer + input + collegamento MVC)
//--------------------------------------------------
class GameController {
  constructor(model, view, audio) {
    this.model = model;
    this.view = view;
    this.audio = audio;

    this.timerId = null;
    this.lastBeatTime = 0;
    this.currentBeatIndex = 0;

    // flag: in questo minigioco ho già perso una vita?
    this.roundLifeLost = false;

    view.onStart(() => this.handleStart());
    view.onHit(() => this.handleHit());
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.handleHit();
      }
    });
  }

  handleStart() {
    this.audio.init();
    this.model.resetLives();
    this.view.renderLives(this.model.lives);
    this.view.enableStart(false);
    this.model.round = 1;
    this.model.currentMiniGameIndex = 0;
    this.startMiniGameRound();
  }

  startMiniGameRound() {
    const mg = this.model.currentMiniGame;
    const bpm = this.model.bpm;

    this.roundLifeLost = false;

    mg.startRound(this.model);

    this.view.setBpm(bpm);
    this.view.setRound(this.model.round);
    this.view.setStatus(`Ascolta i 4 beat…`);

    if (this.timerId) clearInterval(this.timerId);

    this.currentBeatIndex = 0;
    this.lastBeatTime = performance.now();

    const beatDuration = 60000 / bpm;
    this.timerId = setInterval(() => this.tick(), beatDuration);
  }

  tick() {
    const mg = this.model.currentMiniGame;
    const now = performance.now();
    const res = mg.onBeat(this.model, this.currentBeatIndex);
    this.lastBeatTime = now;

    const events = (res && res.payload && res.payload.events) || [];

    for (const e of events) {
      switch (e.type) {
        case "beat": {
          const { beatIndex, ledIndex, phase } = e.payload;
          this.view.setActiveLed(ledIndex);
          this.audio.click();
          if (phase === "listen" && beatIndex === 0) {
            this.view.setStatus("Ascolta i 4 beat…");
          } else if (phase === "input" && beatIndex === 4) {
            this.view.setStatus("Ora ripeti il ritmo!");
          }
          break;
        }

        case "miss": {
          // Miss sul beat precedente → eventuale perdita vita (max 1 per minigioco)
          if (!this.roundLifeLost) {
            this.roundLifeLost = true;
            const gameOver = this.model.loseLife();
            this.view.renderLives(this.model.lives);
            if (gameOver) {
              this.view.setStatus("Missata! Game Over");
              this.view.flashWrong();
              this.stopGameOver();
              return;
            }
          }
          this.view.setStatus("Missata!");
          this.view.flashWrong();
          break;
        }
      }
    }

    if (res.type === "roundEnd") {
      clearInterval(this.timerId);

      // cicla tutti i minigiochi prima di aumentare il BPM
      const prevIndex = this.model.currentMiniGameIndex;
      this.model.nextMiniGame();

      // se abbiamo appena finito l'ultimo minigioco della lista,
      // allora abbiamo completato un "giro" → aumenta il round (e quindi il BPM)
      if (prevIndex === this.model.miniGames.length - 1) {
        this.model.nextRound();
      }

      if (this.model.lives > 0) {
        this.startMiniGameRound();
      } else {
        this.stopGameOver();
      }
      return;
    }

    this.currentBeatIndex++;
  }

  handleHit() {
    const mg = this.model.currentMiniGame;
    const now = performance.now();

    // Durata di un beat
    const beatDuration = 60000 / this.model.bpm;

    // beat "visuale" corrente: impostato in onBeat
    const visualBeatIndex = mg.beatIndex;        // 0..7
    const prevBeatIndex   = visualBeatIndex - 1;
    const nextBeatIndex   = visualBeatIndex + 1;

    // centro del beat corrente e del prossimo
    const centerCurrent = this.lastBeatTime;
    const centerNext = this.lastBeatTime + beatDuration;

    const deltaCurrent = now - centerCurrent;
    const deltaNext = now - centerNext;

    // scegliamo a quale beat associare il colpo:
    // se sei più vicino al beat corrente → usiamo quello
    // se sei più vicino al prossimo → lo consideriamo in anticipo sul prossimo
    let targetBeatIndex;
    let deltaToUse;

    if (Math.abs(deltaCurrent) <= Math.abs(deltaNext)) {
      targetBeatIndex = visualBeatIndex;
      deltaToUse = deltaCurrent;
    } else {
      targetBeatIndex = nextBeatIndex;
      deltaToUse = deltaNext;
    }

    const res = mg.onInput(this.model, deltaToUse, targetBeatIndex);
    if (!res || res.type === "ignore") return;

    this.audio.hitSound();

    if (res.type === "perfect") {
      this.view.setStatus("Perfetto!");
      this.view.flashCorrect();
      return;
    }

    if (res.type === "timingError") {
      const reason = res.payload.reason;
      if (reason === "early") this.view.setStatus("Troppo presto!");
      else if (reason === "late") this.view.setStatus("Troppo tardi!");
      else this.view.setStatus("Errore!");

      // togli vita solo se non già persa in questo minigioco
      if (!this.roundLifeLost) {
        this.roundLifeLost = true;
        const gameOver = this.model.loseLife();
        this.view.renderLives(this.model.lives);
        if (gameOver) {
          this.view.flashWrong();
          this.stopGameOver();
          return;
        }
      }

      this.view.flashWrong();
    }
  }

  stopGameOver() {
    if (this.timerId) clearInterval(this.timerId);
    this.view.setStatus("Game Over – premi START per ricominciare");
    this.view.enableStart(true);
  }
}


//--------------------------------------------------
// BOOTSTRAP
//--------------------------------------------------
const audio = new AudioManager();
const model = new GameModel();
const view = new RhythmView();
const controller = new GameController(model, view, audio);

// registra i minigiochi (per ora solo uno, ma puoi aggiungerne altri)
model.addMiniGame(new FourBeatsHitMiniGame());

view.setStatus("Premi START per cominciare");
