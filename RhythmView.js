//--------------------------------------------------
//  VIEW
//--------------------------------------------------
export class RhythmView {
  constructor() {
    this.leds = [...document.querySelectorAll(".led")];
    //this.startBtn = document.getElementById("startButton");
    // !!! AGGIUNGI I NUOVI RIFERIMENTI:
    this.gameModal = document.getElementById("gameModal");
    this.startBtn = document.getElementById("modalStartButton"); // Nuovo ID del pulsante START
    this.startScreen = document.getElementById("startScreen");
    this.gameOverScreen = document.getElementById("gameOverScreen");
    this.modalRestartBtn = document.getElementById("modalRestartButton");
    this.finalScoreEl = document.getElementById("finalScore");
    
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

    this.namePanel = document.getElementById("namePanel");
    this.nameInput = document.getElementById("playerNameInput");
    this.nameSubmitBtn = document.getElementById("saveScoreBtn");
    this.nameResult = document.getElementById("nameResult");
    this._nameSubmitCb = null;

  }

  onStart(cb) {
    this.startBtn.onclick = cb;
    if (this.modalRestartBtn) {
        this.modalRestartBtn.onclick = cb;
    }
  }

  onHit(cb) {
    this.hitBtn.onclick = cb;
  }
 
  // Nasconde il pop-up e mostra il gioco
  hideModal() {
    if (this.gameModal) {
        this.gameModal.classList.add('modal--hidden');
    }
  }
  // !!! NUOVO: Mostra la schermata Game Over
  showGameOverScreen(round, bpm) {
    if (this.gameModal) {
        this.gameModal.classList.remove('modal--hidden');
        
        // Nascondi START, mostra GAME OVER
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // Aggiorna il punteggio
        this.finalScoreEl.textContent = `Round ${round} @ ${bpm} BPM`;
    }
  }
  
  //Mostra la schermata iniziale (per il reset)
  showStartScreen() {
    if (this.gameModal) {
        this.gameModal.classList.remove('modal--hidden');
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
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
    //this.lifeLabel.textContent = `Lives: ${lives}`;
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

  const staff = this.notationStaff;

  // Legge il padding interno definito in CSS: --edge-pad
  const style = getComputedStyle(staff);
  const edgePad = parseFloat(style.getPropertyValue("--edge-pad")) || 0;

  // Larghezza “utile” dove disegnare le note (escludendo i margini)
  const innerWidth = staff.clientWidth - 2 * edgePad;

  pattern.forEach(note => {
    const noteEl = document.createElement("div");
    const typeSymbol = note.type || "q";

    noteEl.className = `note note--${typeSymbol}`;
    noteEl.dataset.type = typeSymbol;

    // offset 0..1 -> pixel dentro [edgePad .. edgePad+innerWidth]
    const x = edgePad + (note.offset * innerWidth);
    noteEl.style.left = `${x}px`;

    const head = document.createElement("div");
    head.className = "note-head";

    const stem = document.createElement("div");
    stem.className = "note-stem";

    const flag = document.createElement("div");
    flag.className = "note-flag";

    const doubleflag = document.createElement("div");
    doubleflag.className = "note-doubleflag";

    const dot = document.createElement("div");
    dot.className = "note-dot";

    noteEl.appendChild(head);
    noteEl.appendChild(stem);
    noteEl.appendChild(flag);
    noteEl.appendChild(doubleflag);
    noteEl.appendChild(dot);

    staff.appendChild(noteEl);
  });
}


  setScore(v) {
    if (this.scoreEl) {
      this.scoreEl.textContent = v;
    }
  }

    showGameOverScreen(round, bpm, score, askName) {
    if (this.gameModal) {
      this.gameModal.classList.remove('modal--hidden');

      this.startScreen.classList.add('hidden');
      this.gameOverScreen.classList.remove('hidden');

      this.finalScoreEl.textContent = `Round ${round} @ ${bpm} BPM — Score: ${score}`;

      if (this.namePanel) {
        this.namePanel.classList.toggle("hidden", !askName);
      }
      if (this.nameResult) this.nameResult.textContent = "";
      if (this.nameInput) this.nameInput.value = "";
    }
  }

  onSubmitName(cb) {
    this._nameSubmitCb = cb;
    if (!this.nameSubmitBtn) return;

    this.nameSubmitBtn.onclick = () => {
      const name = (this.nameInput?.value ?? "").trim();
      if (!name) {
        this.setNameSubmitResult("Insert your name 🙂");
        return;
      }
      cb(name);
    };
  }

  setNameSubmitResult(msg) {
    if (this.nameResult) this.nameResult.textContent = msg;
  }


}



