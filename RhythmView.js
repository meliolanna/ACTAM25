//--------------------------------------------------
//  VIEW
//--------------------------------------------------
export class RhythmView {
  constructor() {
    this.leds = [...document.querySelectorAll(".led")];
    //this.startBtn = document.getElementById("startButton");
    // !!! AGGIUNGI I NUOVI RIFERIMENTI:
    this.modal = document.getElementById("startModal");
    this.startBtn = document.getElementById("modalStartButton"); // Nuovo ID del pulsante START

    this.hitBtn = document.getElementById("hitButton");
    this.status = document.getElementById("statusText");
    this.bpmEl = document.getElementById("bpmDisplay");
    this.roundEl = document.getElementById("roundDisplay");
    this.lifeContainer = document.getElementById("lifeContainer");
    this.notationStaff = document.getElementById("notationStaff");

    this.scoreEl = document.getElementById("scoreDisplay");

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
  // !!! NUOVO METODO PER NASCONDERE IL POP-UP
  hideStartModal() {
    if (this.modal) {
        this.modal.classList.add('modal--hidden');
    }
  }
  
  setStatus(t) { this.status.textContent = t; }
  setBpm(v) { this.bpmEl.textContent = v; }
  setRound(v) { this.roundEl.textContent = v; }
  enableStart(v) { this.startBtn.disabled = !v; }

  renderLives(lives) {
    this.lifeContainer.innerHTML = "";
    const hearts = "❤️".repeat(Math.max(0, lives));
    this.lifeContainer.textContent = hearts;
    this.lifeLabel.textContent = `Lives: ${lives}`;
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

  clearNotation() {
    if (!this.notationStaff) return;
    this.notationStaff.innerHTML = "";
  }

  /**
   * pattern = [{ offset: 0..1, duration: 0..1, type: "q"/"h"/"o"/... }, ...]
   */
  renderNotation(pattern) {
    if (!this.notationStaff) return;
    this.clearNotation();

    pattern.forEach(note => {
      const noteEl = document.createElement("div");
      const typeSymbol = note.type || "q";

      noteEl.className = `note note--${typeSymbol}`;
      noteEl.style.left = (note.offset * 100) + "%";
      noteEl.dataset.type = typeSymbol;

      const head = document.createElement("div");
      head.className = "note-head";

      const stem = document.createElement("div");
      stem.className = "note-stem";

      const flag = document.createElement("div");
      flag.className = "note-flag";

      noteEl.appendChild(head);
      noteEl.appendChild(stem);
      noteEl.appendChild(flag);

      this.notationStaff.appendChild(noteEl);
    });
  }

    setScore(v) {
    if (this.scoreEl) {
      this.scoreEl.textContent = v;
    }
  }

}

