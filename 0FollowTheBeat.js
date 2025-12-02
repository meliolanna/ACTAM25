import { SoundScheduler, AudioManager } from './GameSounds.js';
import { GameModel } from './GameModel.js';
import { RhythmView } from '.RhythmView.js';

//--------------------------------------------------
//  MINIGIOCO 1: 4 beat ascolto + 4 beat input
//--------------------------------------------------
class FourBeatsMetronomeMiniGame {
  constructor() {
    this.id = "4beats_metronome";
    this.name = "4 Beat Hit";

    // 1 battuta di ascolto (4 beat) + 1 battuta di input (4 beat)
    this.totalBeats = 8;

    this.timingWindowFraction = 0.20;

    this.beatIndex = 0;

    this.expectedHits = [];
    this.notationPattern = [];
  }

  generatePattern(bpm) {
    // Pattern simbolico fisso: 4 quarti
    this.symbolSequence = ["q", "q", "q", "q"];

    const fractions = convertSymbolsToFractions(this.symbolSequence);
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

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

    // Pattern grafico per il riquadro
    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
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
        miniGameName: this.name,
        notation: {
          enabled: true,
          notes: this.notationPattern
        }
      }
    };
  }

  onBeat(gameModel, beatIndex) {
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

  onInput(gameModel, deltaMs, targetBeatIndex) {
    const bpm = gameModel.bpm;
    const beatDurationMs = 60000 / bpm;
    const measureDurationMs = 4 * beatDurationMs;

    const beatIndex = targetBeatIndex;

    if (beatIndex < 4 || beatIndex >= this.totalBeats) {
      return { type: "ignore", payload: {} };
    }

    const hitTimeMs =
      (beatIndex - 4) * beatDurationMs + deltaMs;

    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs) {
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
