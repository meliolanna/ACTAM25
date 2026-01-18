import { submitScoreIfBest } from "./leaderboardService.js";

//--------------------------------------------------
//  CONTROLLER
//--------------------------------------------------
export class GameController {
  constructor(model, view, audio) {
    this.model = model;
    this.view = view;
    this.audio = audio;

    this.timerId = null;
    this.lastBeatTime = 0;
    this.currentBeatIndex = 0;

    this.roundLifeLost = false;

    view.onStart(() => this.handleStart());
    // Mostra la schermata START non appena il Controller è inizializzato
    this.view.showStartScreen();
    
    view.onHit(() => this.handleHit());
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.handleHit();
      }
    });
  }

  handleStart() {
    this.view.hideModal();
    this.audio.init();
    this.model.resetLives();
    this.view.renderLives(this.model.lives);
    this.model.resetScore();
    this.view.setScore(this.model.score);
    //this.view.enableStart(false);
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

    this.view.setStatus("Listen to the 4 beats...");

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
            this.view.setStatus("Listen to the 4 beats…");
          } else if (phase === "input" && beatIndex === 4) {
            this.view.setStatus("Now repeat the rhythm!");
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
              this.view.setStatus("Beat missed! Game Over");
              this.view.flashWrong();
              this.stopGameOver();
              return;
            }
          }
          this.view.setStatus("Beat missed!");
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

    if (res.type === "score") {
      const { points, kind } = res.payload;

      this.model.addScore(points);
      this.view.setScore(this.model.score);

      if (kind === "perfect") {
        this.view.setStatus(`Perfect! +${points}`);
      } else if (kind === "good") {
        this.view.setStatus(`Good! +${points}`);
      } else {
        this.view.setStatus(`Hit! +${points}`);
      }

      this.view.flashCorrect();
      return;
    }

    if (res.type === "timingError") {
      const reason = res.payload.reason;
      if (reason === "early") this.view.setStatus("Too early!");
      else if (reason === "late") this.view.setStatus("Too late!");
      else this.view.setStatus("Error!");

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

    const finalRound = this.model.round;
    const finalBPM = this.model.bpm;
    const finalScore = this.model.score;

    const isAllMode = (this.model.mode === "all");

    this.view.showGameOverScreen(finalRound, finalBPM, finalScore, isAllMode);

    if (isAllMode) {
      this.view.onSubmitName(async (playerName) => {
        try {
          await submitScoreIfBest(playerName, finalScore);
          this.view.setNameSubmitResult("Saved! ✅");
        } catch (e) {
          this.view.setNameSubmitResult("Error saving score ❌");
          console.error(e);
        }
      });
    }

    this.view.setStatus("Game Over – press START to play again");
    this.view.enableStart(true);
  }

}






