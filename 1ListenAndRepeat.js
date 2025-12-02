import { SoundScheduler, AudioManager } from './GameSounds.js';
import { GameModel } from './GameModel.js';
import {RhythmView } from './RhythmView.js';
import { DEFAULT_GRAMMAR, GrammarSequence } from  './MusicalUtilsAndGrammar';


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
