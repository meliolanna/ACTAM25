//--------------------------------------------------
//  GAME MODEL non ho capito cos'è
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
    this.currentMiniGameIndex =
      (this.currentMiniGameIndex + 1) % this.miniGames.length;
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
