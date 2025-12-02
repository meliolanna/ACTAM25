// ----------------------
// UTILS MUSICALI
// ----------------------

// Millisecondi per minuto (se ti servisse)
const MS_PER_MINUTE = 60000;

const DURATION_MAP = {
  m: 1.0,   // intera battuta 4/4
  h: 0.5,   // minima
  q: 0.25,   // semiminima
  o: 0.125
};

/**
 * Ritorna un elemento casuale da un array
 */
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/**
 * Ritorna un indice casuale dalla lista di indici
 */
function getRandomIndex(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/**
 * Converte simboli ('q','h', ecc.) in frazioni (rispetto alla battuta intera)
 */
function convertSymbolsToFractions(symbolSequence, durationMap = DURATION_MAP) {
  const fractionalSequence = symbolSequence.map(symbol => {
    const fraction = durationMap[symbol];

    if (fraction === undefined) {
      console.warn(`Simbolo di durata sconosciuto: '${symbol}'. Ritornato 0.`);
      return 0;
    }
    return fraction;
  });

  return fractionalSequence;
}

/**
 * Converte frazioni in durate in SECONDI usando i BPM.
 */
function convertFractionsToSeconds(fractionalSequence, bpm) {
  if (bpm <= 0) {
    console.error("BPM deve essere maggiore di zero.");
    return [];
  }

  // Durata di un beat (semiminima) in secondi
  const beatDurationSec = 60 / bpm;

  // Durata della battuta intera (4/4) in secondi
  const wholeNoteDurationSec = 4 * beatDurationSec;

  const secondsSequence = fractionalSequence.map(fraction => {
    return wholeNoteDurationSec * fraction;
  });

  return secondsSequence;
}

// ----------------------
// GRAMMATICA
// ----------------------

// M = misura intera (4/4)
// H = gruppo da 2 beat (mezza misura)
// B = gruppo da 1 beat (un quarto di misura)
// E = gruppo da mezzo beat (ottavo)

const DEFAULT_GRAMMAR = {
  // Misura 4/4
  M: [
    ["H", "H"],            // 2 beat + 2 beat
    ["H", "B", "B"],       // 2 beat + 1 beat + 1 beat
    ["B", "H", "B"],       // 1 beat + 2 beat + 1 beat
    ["B", "B", "H"],       // 1 beat + 1 beat + 2 beat
    ["B", "B", "B", "B"]   // 1+1+1+1 (quattro gruppi da 1 beat)
  ],

  // Gruppo da 2 beat
  H: [
    "h",                   // minima (2 beat)
    ["B", "B"]             // due blocchi da 1 beat
  ],

  // Gruppo da 1 beat
  B: [
    "q",                   // un quarto
    ["E", "E"]             // due ottavi
  ],

  // E = mezzo beat
  E: [
    "o"                    // ottavo
  ]
};


class GrammarSequence {
  constructor(grammar = DEFAULT_GRAMMAR) {
    this.grammar = grammar;
    this.grammarKeys = Object.keys(this.grammar);
    this.sequence = [];
    this.startSymbol = "M";
  }

  replace(index, convertTo) {
    const conversionArray = Array.isArray(convertTo) ? convertTo : [convertTo];
    this.sequence.splice(index, 1, ...conversionArray);
  }

  convertSequence(idxs) {
    const index = getRandomIndex(idxs);
    if (index === null) return;

    const symbol = this.sequence[index];
    const possibleConversions = this.grammar[symbol];
    const convertTo = getRandomElement(possibleConversions);

    this.replace(index, convertTo);
  }

  findNonTerminalSymbols(sequence) {
    const idxs = [];
    const nonTerminals = new Set(this.grammarKeys);

    sequence.forEach((symbol, s) => {
      if (nonTerminals.has(symbol)) {
        idxs.push(s);
      }
    });

    const toConvert = idxs.length > 0;
    return [idxs, toConvert];
  }

  /**
   * Genera una sequenza TERMINALE (solo 'q', 'h', ...) partendo da 'M'
   */
  createSequence() {
    this.sequence = [this.startSymbol];

    while (true) {
      const [idxs, toConvert] = this.findNonTerminalSymbols(this.sequence);
      if (!toConvert) break;
      this.convertSequence(idxs);
    }

    return this.sequence;
  }
}

/**
 * Schedulatore di suoni che usa l'AudioContext interno.
 * Qui lo usiamo solo per far "suonare" il pattern del computer.
 */
class SoundScheduler {
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

    // primo attacco sempre a 0
    absoluteTimes.push(0);

    // aggiungo le durate tranne l'ultima (così ho N onset e non il bordo finale)
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

    // PIÙ ACUTO E LEGGERMENTE PIÙ FORTE DEL METRONOMO
    osc.frequency.setValueAtTime(2000, time); // metronomo è 1000Hz
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.6, time + 0.002); // un po' più "forte"
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

    // ✅ suona SOLO gli N onset (niente click extra alla fine)
    this.scheduleTimes.forEach((relativeTime) => {
      const absoluteScheduleTime = startTime + relativeTime;
      this.scheduleClick(absoluteScheduleTime);
    });

    // durata totale = somma delle durate
    const totalDuration = this.durationSequence.reduce((a, b) => a + b, 0);
    setTimeout(() => {
      this.isPlaying = false;
    }, (totalDuration * 1000) + 200);
  }
}



//--------------------------------------------------
//  AUDIO MANAGER "CLASSICO" (metronomo + hit player)
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

 click() {
  if (!this.ctx) return;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  // Metronomo: un po' più basso e meno forte
  osc.frequency.value = 900; // prima era 1000
  const t0 = this.ctx.currentTime;

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.002); // prima 0.4
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

//--------------------------------------------------
//  GAME MODEL
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

//--------------------------------------------------
//  VIEW
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
//  INTERFACCIA / BASE PER I MINIGIOCHI
//--------------------------------------------------
/**
 * Ogni minigioco dovrebbe avere:
 * - id, name
 * - startRound(gameModel) -> {type:"roundStart", payload?...}
 * - onBeat(gameModel, beatIndex) -> {type:"continue"|"roundEnd", payload:{events:[]}}
 * - onInput(gameModel, deltaMs, targetBeatIndex) -> evento (perfect / timingError / miss / ignore)
 *
 * In questo modo puoi aggiungere minigiochi diversi ma compatibili
 * con il GameController.
 */

//--------------------------------------------------
//  MINIGIOCO 1: 4 beat ascolto + 4 beat input
//  (usa le funzioni di durata e resta agganciato al metronomo 4/4)
//--------------------------------------------------
// --------------------------------------------------
// MINIGIOCO 1: allineamento sul metronomo con expectedHits
// --------------------------------------------------
class FourBeatsMetronomeMiniGame {
  constructor() {
    this.id = "4beats_metronome";
    this.name = "4 Beat Hit";

    // 1 battuta di ascolto (4 beat) + 1 battuta di input (4 beat)
    this.totalBeats = 8;

    // Finestra di tolleranza (stessa logica del secondo minigioco)
    this.timingWindowFraction = 0.20;

    this.beatIndex = 0;

    /**
     * expectedHits = [
     *   { timeMs: <ms da inizio battuta di input>, segmentIndex: 0..3, matched: false },
     *   ...
     * ]
     * Qui il pattern è fisso: 4 quarti → onset a 0, 1/4, 2/4, 3/4 di battuta.
     */
    this.expectedHits = [];
  }

  generatePattern(bpm) {
    // Pattern simbolico fisso: 4 quarti da ripetere
    this.symbolSequence = ["q", "q", "q", "q"];

    // Frazioni rispetto alla battuta intera
    const fractions = convertSymbolsToFractions(this.symbolSequence);

    // Durate in secondi tra un colpo e il successivo
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    // Calcola onset assoluti (in millisecondi da t=0)
    const onsetsMs = [];
    let t = 0;
    for (let i = 0; i < durationsSec.length; i++) {
      onsetsMs.push(t * 1000); // salvo tempo PRIMA di aggiungere la durata
      t += durationsSec[i];
    }

    const beatDurationMs = 60000 / bpm;

    // SegmentIndex = in quale quarto di battuta cade la nota (0..3)
    this.expectedHits = onsetsMs.map(tMs => {
      const seg = Math.min(
        3,
        Math.max(0, Math.floor(tMs / beatDurationMs))
      );
      return {
        timeMs: tMs,
        segmentIndex: seg,
        matched: false
      };
    });
  }

  startRound(gameModel) {
    this.beatIndex = 0;
    this.expectedHits = [];

    const bpm = gameModel.bpm;
    this.generatePattern(bpm);

    return {
      type: "roundStart",
      payload: {
        miniGameId: this.id,
        miniGameName: this.name
      }
    };
  }

  onBeat(gameModel, beatIndex) {
    const events = [];
    this.beatIndex = beatIndex;

    const prev = beatIndex - 1;

    // Nella battuta di input (beat 4..7),
    // controlla il segmento precedente: se ci sono note non matchate → miss
    if (prev >= 4 && prev < this.totalBeats) {
      const segment = prev - 4; // 0..3 dentro la battuta di input
      const hasUnmatchedInSegment = this.expectedHits.some(
        h => h.segmentIndex === segment && !h.matched
      );
      if (hasUnmatchedInSegment) {
        events.push({
          type: "miss",
          payload: { beatIndex: prev }
        });
      }
    }

    // Fine minigioco dopo 8 beat
    if (beatIndex >= this.totalBeats) {
      return { type: "roundEnd", payload: { events } };
    }

    const phase = beatIndex < 4 ? "listen" : "input";
    const ledIndex = beatIndex % 4;

    // Evento di metronomo (LED + click, gestito dal controller)
    events.push({
      type: "beat",
      payload: { beatIndex, ledIndex, phase }
    });

    return { type: "continue", payload: { events } };
  }

  onInput(gameModel, deltaMs, targetBeatIndex) {
    const bpm = gameModel.bpm;
    const beatDurationMs = 60000 / bpm;
    const measureDurationMs = 4 * beatDurationMs;

    const beatIndex = targetBeatIndex; // 0..7

    // Input valido solo nella seconda battuta (beat 4..7)
    if (beatIndex < 4 || beatIndex >= this.totalBeats) {
      return { type: "ignore", payload: {} };
    }

    // Trasforma in tempo assoluto dentro la battuta di input:
    // (beatIndex - 4) * durataBeat + offset dentro il beat
    const hitTimeMs =
      (beatIndex - 4) * beatDurationMs + deltaMs;

    // Se il colpo è troppo fuori dalla battuta → ignora
    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs) {
      return { type: "ignore", payload: {} };
    }

    // Trova la nota attesa più vicina non ancora matchata
    let best = null;
    for (let i = 0; i < this.expectedHits.length; i++) {
      const h = this.expectedHits[i];
      if (h.matched) continue;
      const d = Math.abs(hitTimeMs - h.timeMs);
      if (best === null || d < best.distance) {
        best = { index: i, distance: d, note: h };
      }
    }

    // Nessuna nota rimasta → colpo in più
    if (!best) {
      return {
        type: "timingError",
        payload: { reason: "extra" }
      };
    }

    const windowMs = beatDurationMs * this.timingWindowFraction;

    // Dentro finestra → perfetto
    if (best.distance <= windowMs) {
      this.expectedHits[best.index].matched = true;
      return { type: "perfect", payload: {} };
    }

    // Fuori finestra → errore di timing
    const reason = hitTimeMs < best.note.timeMs ? "early" : "late";
    return {
      type: "timingError",
      payload: { reason }
    };
  }
}


// --------------------------------------------------
// MINIGIOCO 2: il computer suona un pattern, tu lo ripeti
//  (versione time-based, compatibile con ottavi / pattern complessi)
// --------------------------------------------------
class PatternRepeatMiniGame {
  constructor(audioManager) {
    this.audioManager = audioManager;
    
    this.id = "pattern_repeat";
    this.name = "Ripeti il ritmo";

    this.totalBeats = 8;              // 4 ascolto + 4 input
    this.timingWindowFraction = 0.20; // finestra ±20% di un quarto

    this.beatIndex = 0;
    this.grammar = new GrammarSequence();

    this.soundScheduler = null;
    this.patternPlayed = false;

    this.expectedHits = [];           // [{ timeMs, segmentIndex, matched }]
    this.inputStartTimeMs = null;     // t0 della battuta di input (performance.now)
  }

  generatePattern(bpm) {
    // 1) simboli terminali
    this.symbolSequence = this.grammar.createSequence();
    const fractionsRaw = convertSymbolsToFractions(this.symbolSequence);

    let totalFraction = fractionsRaw.reduce((a, b) => a + b, 0);

    if (!totalFraction || !isFinite(totalFraction)) {
      this.symbolSequence = ["q", "q", "q", "q"];
      totalFraction = 1;
    }

    // 2) normalizza: somma = 1.0 (una battuta esatta)
    const fractions = fractionsRaw.map(f => f / totalFraction);

    // 3) durate tra un colpo e il successivo in secondi
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    // 4) scheduler audio del pattern del computer
    if (!this.audioManager.ctx) {
    console.warn("AudioContext non inizializzato in AudioManager");
  } else {
    this.soundScheduler = new SoundScheduler(this.audioManager.ctx, durationsSec);
    this.patternPlayed = false;
  }

    // 5) onsets in ms (da t=0 all’inizio della battuta)
    const onsetsMs = [];
    let t = 0;
    for (let i = 0; i < durationsSec.length; i++) {
      onsetsMs.push(t * 1000);
      t += durationsSec[i];
    }

    const beatDurationMs = 60000 / bpm;

    // 6) per ogni colpo, segmentIndex = in quale quarto cade (0..3)
    this.expectedHits = onsetsMs.map(tMs => {
      const seg = Math.min(
        3,
        Math.max(0, Math.floor(tMs / beatDurationMs))
      );
      return {
        timeMs: tMs,       // tempo dalla partenza della battuta
        segmentIndex: seg, // 0..3
        matched: false
      };
    });
  }

  startRound(gameModel) {
    this.beatIndex = 0;
    this.expectedHits = [];
    this.inputStartTimeMs = null; // sarà impostato al beat 4

    const bpm = gameModel.bpm;
    this.generatePattern(bpm);

    return {
      type: "roundStart",
      payload: {
        miniGameId: this.id,
        miniGameName: this.name,
        patternSymbols: this.symbolSequence
      }
    };
  }

  /**
   * onBeat ora riceve anche nowMs (performance.now) dal controller.
   */
 onBeat(gameModel, beatIndex, nowMs) {
  const events = [];
  this.beatIndex = beatIndex;

  const prev = beatIndex - 1;

  // Se siamo nella battuta di input (beat 4..7),
  // controlla se nel segmento precedente ci sono hit non matchati → miss
  if (prev >= 4 && prev < this.totalBeats) {
    const segment = prev - 4; // 0..3
    const hasUnmatchedInSegment = this.expectedHits.some(
      h => h.segmentIndex === segment && !h.matched
    );
    if (hasUnmatchedInSegment) {
      events.push({
        type: "miss",
        payload: { beatIndex: prev }
      });
    }
  }

  // La battuta di input parte al beatIndex 4 → salviamo il tempo assoluto
  // ma SOLO se non è già stato stimato da un colpo anticipato
  if (beatIndex === 4 && this.inputStartTimeMs == null) {
    this.inputStartTimeMs = nowMs;
  }

  // Fine minigioco
  if (beatIndex >= this.totalBeats) {
    return { type: "roundEnd", payload: { events } };
  }

  const phase = beatIndex < 4 ? "listen" : "input";
  const ledIndex = beatIndex % 4;

  events.push({
    type: "beat",
    payload: { beatIndex, ledIndex, phase }
  });

  // Avvio pattern computer al beat 0
  if (beatIndex === 0 && this.soundScheduler && !this.patternPlayed) {
    this.patternPlayed = true;
    this.soundScheduler.play();
  }

  return { type: "continue", payload: { events } };
}


  /**
   * onInput ora riceve anche nowMs: usiamo quello per avere
   * il tempo esatto dentro la battuta di input, senza dipendere
   * da targetBeatIndex.
   */
  onInput(gameModel, _deltaMs, targetBeatIndex, nowMs) {
  const bpm = gameModel.bpm;
  const beatDurationMs = 60000 / bpm;
  const measureDurationMs = 4 * beatDurationMs;

  // Se non abbiamo ancora un riferimento per l'inizio della battuta di input,
  // proviamo a ricostruirlo dal colpo (per permettere i click in anticipo).
  if (this.inputStartTimeMs == null) {
    // Consideriamo solo colpi "indirizzati" alla battuta di input (beat >= 4)
    if (typeof targetBeatIndex === "number" && targetBeatIndex >= 4) {
      const beatOffset = targetBeatIndex - 4;   // 0 per il primo beat della battuta
      const beatCenterAbs = nowMs - _deltaMs;   // istante assoluto del beat target
      // t0 della battuta di input
      this.inputStartTimeMs = beatCenterAbs - beatOffset * beatDurationMs;
    } else {
      // Ancora in fase di ascolto, o troppo presto → ignora
      return { type: "ignore", payload: {} };
    }
  }

  // Tempo del colpo dentro la battuta di input
  const hitTimeMs = nowMs - this.inputStartTimeMs;

  // Consentiamo un po' di anticipo/ritardo (1 beat di margine)
  if (hitTimeMs < -beatDurationMs ||
      hitTimeMs > measureDurationMs + beatDurationMs) {
    return { type: "ignore", payload: {} };
  }

  // Trova la nota attesa più vicina non ancora matchata
  let best = null;
  for (let i = 0; i < this.expectedHits.length; i++) {
    const h = this.expectedHits[i];
    if (h.matched) continue;
    const d = Math.abs(hitTimeMs - h.timeMs);
    if (best === null || d < best.distance) {
      best = { index: i, distance: d, note: h };
    }
  }

  if (!best) {
    // Non c'era niente più da matchare → colpo extra
    return {
      type: "timingError",
      payload: { reason: "extra" }
    };
  }

  const windowMs = beatDurationMs * this.timingWindowFraction;

  if (best.distance <= windowMs) {
    // Match perfetto
    this.expectedHits[best.index].matched = true;
    return { type: "perfect", payload: {} };
  }

  // Errore di timing
  const reason = hitTimeMs < best.note.timeMs ? "early" : "late";
  return {
    type: "timingError",
    payload: { reason }
  };
}

}








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

    mg.startRound(this.model);

    this.view.setBpm(bpm);
    this.view.setRound(this.model.round);
    this.view.setStatus("Ascolta i 4 beat…");

    if (this.timerId) clearInterval(this.timerId);

    this.currentBeatIndex = 0;
    this.lastBeatTime = performance.now();

    const beatDuration = 60000 / bpm; // metronomo fisso sui 4 beat
    this.timerId = setInterval(() => this.tick(), beatDuration);
  }

tick() {
  const mg = this.model.currentMiniGame;
  const now = performance.now();
  
  // PRIMA: const res = mg.onBeat(this.model, this.currentBeatIndex);
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

  const visualBeatIndex = mg.beatIndex;  // 0..N
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

  // Clamp di sicurezza nel range dei beat del minigioco (se definito)
  if (typeof mg.totalBeats === "number") {
    if (targetBeatIndex < 0) targetBeatIndex = 0;
    if (targetBeatIndex >= mg.totalBeats) {
      targetBeatIndex = mg.totalBeats - 1;
    }
  }

  // PRIMA: const res = mg.onInput(this.model, deltaToUse, targetBeatIndex);
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
const audio = new AudioManager();
const model = new GameModel();
const view = new RhythmView();
const controller = new GameController(model, view, audio);

// REGISTRA I MINIGIOCHI QUI
// Minigioco 1: allineamento sul metronomo 4/4
//model.addMiniGame(new FourBeatsMetronomeMiniGame());

// Qui potrai aggiungere altri minigiochi, es:
model.addMiniGame(new PatternRepeatMiniGame(audio));

view.setStatus("Premi START per cominciare");
