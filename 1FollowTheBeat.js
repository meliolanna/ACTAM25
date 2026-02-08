import { BaseRhythmMiniGame } from "./BaseRhythmMiniGame.js";
import {
  convertSymbolsToFractions,
  convertFractionsToSeconds,
  buildNotationPattern
} from "./MusicalUtilsAndGrammar.js";

export class FourBeatsMetronomeMiniGame extends BaseRhythmMiniGame {
  constructor() {
    super({
      id: "4beats_metronome",
      name: "4 Beat Hit",
      totalBeats: 8,
      timingWindowStrictFraction: 0.10,
      timingWindowLooseFraction: 0.20,
      inputStartBeat: 4
    });
  }

  generatePattern(bpm) {
    this.symbolSequence = ["q", "q", "q", "q"];

    const fractions = convertSymbolsToFractions(this.symbolSequence);
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    this._buildExpectedHitsFromDurations(bpm, durationsSec);

    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
  }

  startRound(gameModel) {
    return this._startRoundCommon(gameModel);
  }

  onBeat(gameModel, beatIndex) {
    return this._onBeatCommon(gameModel, beatIndex, null);
  }

  onInput(gameModel, deltaMs, targetBeatIndex) {
    const bpm = gameModel.bpm;
    const beatDurationMs = this._beatDurationMs(bpm);
    const measureDurationMs = this._measureDurationMs(bpm);

    const beatIndex = targetBeatIndex;

    if (beatIndex < this.inputStartBeat || beatIndex >= this.totalBeats) {
      return { type: "ignore", payload: {} };
    }

    const hitTimeMs = (beatIndex - this.inputStartBeat) * beatDurationMs + deltaMs;

    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs) {
      return { type: "ignore", payload: {} };
    }

    const best = this._findClosestExpectedHit(hitTimeMs);
    return this._scoreHitOrTimingError(best, hitTimeMs, beatDurationMs);
  }
}
