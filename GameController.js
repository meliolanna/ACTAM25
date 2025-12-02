//import non ho capito aaaaaaaaa

//--------------------------------------------------
//  CONTROLLER
//--------------------------------------------------
class GameController {
  constructor(model, view, audio) {
    this.model = model;
    this.view = view;
    this.audio = audio;

    this.timerId = null;
    this.lastBeatTime = 0;
    this.currentBeatIndex = 0;

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

    const info = mg.startRound(this.model);

    this.view.setBpm(bpm);
    this.view.setRound(this.model.round);

    // Gestione notazione: se il minigioco la espone, la disegniamo
    if (info && info.payload && info.payload.notation && info.payload.notation.enabled) {
      this.view.renderNotation(info.payload.notation.notes);
    } else {
      this.view.clearNotation();
    }

    this.view.setStatus("Ascolta i 4 beat…");

    if (this.timerId) clearInterval(this.timerId);

    this.currentBeatIndex = 0;
    this.lastBeatTime = performance.now();

    const beatDuration = 60000 / bpm;
    this.timerId = setInterval(() => this.tick(), beatDuration);
  }

  tick() {
    const mg = this.model.currentMiniGame;
    const now = performance.now();

    const res = mg.onBeat(this.model, this.currentBeatIndex, now);

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

        case "patternHit": {
          this.audio.hitSound();
          break;
        }

        case "miss": {
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

      const prevIndex = this.model.currentMiniGameIndex;
      this.model.nextMiniGame();

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

    const beatDuration = 60000 / this.model.bpm;

    const visualBeatIndex = mg.beatIndex;
    const prevBeatIndex   = visualBeatIndex - 1;
    const nextBeatIndex   = visualBeatIndex + 1;

    const centerCurrent = this.lastBeatTime;
    const centerNext    = this.lastBeatTime + beatDuration;

    const deltaCurrent = now - centerCurrent;
    const deltaNext    = now - centerNext;

    let targetBeatIndex;
    let deltaToUse;

    if (Math.abs(deltaCurrent) <= Math.abs(deltaNext)) {
      targetBeatIndex = visualBeatIndex;
      deltaToUse = deltaCurrent;
    } else {
      targetBeatIndex = nextBeatIndex;
      deltaToUse = deltaNext;
    }

    if (typeof mg.totalBeats === "number") {
      if (targetBeatIndex < 0) targetBeatIndex = 0;
      if (targetBeatIndex >= mg.totalBeats) {
        targetBeatIndex = mg.totalBeats - 1;
      }
    }

    const res = mg.onInput(this.model, deltaToUse, targetBeatIndex, now);
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
//  BOOTSTRAP
//--------------------------------------------------
window.addEventListener("load", () => {
  const audio = new AudioManager();
  const model = new GameModel();
  const view = new RhythmView();
  const controller = new GameController(model, view, audio);

  // Attiva i minigiochi che vuoi usare.
  // Minigioco 1: allineamento sul metronomo 4/4
  model.addMiniGame(new FourBeatsMetronomeMiniGame());

  // Minigioco 2: pattern casuale da ripetere
  model.addMiniGame(new PatternRepeatMiniGame(audio));
  
  model.addMiniGame(new ReadAndPlayMiniGame());

  view.setStatus("Premi START per cominciare");
});
