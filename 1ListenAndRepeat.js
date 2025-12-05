import { SoundScheduler, AudioManager } from './GameSounds.js';
import { GrammarSequence, convertSymbolsToFractions,  
  convertFractionsToSeconds, buildNotationPattern } from  './MusicalUtilsAndGrammar.js';


// --------------------------------------------------
// MINIGIOCO 2: il computer suona un pattern, tu lo ripeti
//  (versione time-based, compatibile con ottavi / pattern complessi)
// --------------------------------------------------
export class PatternRepeatMiniGame {
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

    this.expectedHits = [];
    this.inputStartTimeMs = null;

    this.notationPattern = [];
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

    const fractions = fractionsRaw.map(f => f / totalFraction);

    // durate tra un colpo e il successivo in secondi
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    // scheduler audio del pattern
    if (!this.audioManager.ctx) {
      console.warn("AudioContext non inizializzato in AudioManager");
    } else {
      this.soundScheduler = new SoundScheduler(this.audioManager.ctx, durationsSec);
      this.patternPlayed = false;
    }

    // onsets in ms
    const onsetsMs = [];
    let t = 0;
    for (let i = 0; i < durationsSec.length; i++) {
      onsetsMs.push(t * 1000);
      t += durationsSec[i];
    }

    const beatDurationMs = 60000 / bpm;

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

    // pattern grafico per il riquadro
    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
  }

  startRound(gameModel) {
    this.beatIndex = 0;
    this.expectedHits = [];
    this.inputStartTimeMs = null;

    const bpm = gameModel.bpm;
    this.generatePattern(bpm);

    return {
      type: "roundStart",
      payload: {
        miniGameId: this.id,
        miniGameName: this.name,
        patternSymbols: this.symbolSequence,
        notation: {
          enabled: true,
          notes: this.notationPattern
        }
      }
    };
  }

  onBeat(gameModel, beatIndex, nowMs) {
    const events = [];
    this.beatIndex = beatIndex;

    const prev = beatIndex - 1;

    if (prev >= 4 && prev < this.totalBeats) {
      const segment = prev - 4;
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

    if (beatIndex === 4 && this.inputStartTimeMs == null) {
      this.inputStartTimeMs = nowMs;
    }

    if (beatIndex >= this.totalBeats) {
      return { type: "roundEnd", payload: { events } };
    }

    const phase = beatIndex < 4 ? "listen" : "input";
    const ledIndex = beatIndex % 4;

    events.push({
      type: "beat",
      payload: { beatIndex, ledIndex, phase }
    });

    if (beatIndex === 0 && this.soundScheduler && !this.patternPlayed) {
      this.patternPlayed = true;
      this.soundScheduler.play();
    }

    return { type: "continue", payload: { events } };
  }

  onInput(gameModel, _deltaMs, targetBeatIndex, nowMs) {
    const bpm = gameModel.bpm;
    const beatDurationMs = 60000 / bpm;
    const measureDurationMs = 4 * beatDurationMs;

    if (this.inputStartTimeMs == null) {
      if (typeof targetBeatIndex === "number" && targetBeatIndex >= 4) {
        const beatOffset = targetBeatIndex - 4;
        const beatCenterAbs = nowMs - _deltaMs;
        this.inputStartTimeMs = beatCenterAbs - beatOffset * beatDurationMs;
      } else {
        return { type: "ignore", payload: {} };
      }
    }

    const hitTimeMs = nowMs - this.inputStartTimeMs;

    if (hitTimeMs < -beatDurationMs ||
        hitTimeMs > measureDurationMs + beatDurationMs) {
      return { type: "ignore", payload: {} };
    }

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
      return {
        type: "timingError",
        payload: { reason: "extra" }
      };
    }

    const windowMs = beatDurationMs * this.timingWindowFraction;

    if (best.distance <= windowMs) {
      this.expectedHits[best.index].matched = true;
      return { type: "perfect", payload: {} };
    }

    const reason = hitTimeMs < best.note.timeMs ? "early" : "late";
    return {
      type: "timingError",
      payload: { reason }
    };
  }
}