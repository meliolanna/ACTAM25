//--------------------------------------------------
//  VIEW
//--------------------------------------------------
export class RhythmView {
  constructor() {
    this.leds = [...document.querySelectorAll(".led")];
    this.startBtn = document.getElementById("startButton");
    this.hitBtn = document.getElementById("hitButton");
    this.status = document.getElementById("statusText");
    this.bpmEl = document.getElementById("bpmDisplay");
    this.roundEl = document.getElementById("roundDisplay");
    this.lifeContainer = document.getElementById("lifeContainer");

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
