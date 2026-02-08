import { BaseRhythmMiniGame } from "./0BaseRhythmMiniGame.js";
import {
  GrammarSequence,
  convertSymbolsToFractions,
  convertFractionsToSeconds,
  buildNotationPattern
} from "../MusicalUtilsAndGrammar.js";

export class ReadAndPlayMiniGame extends BaseRhythmMiniGame {
  constructor(grammar) {
    super({
      id: "read_and_play",
      name: "Leggi e Suona",
      totalBeats: 8,
      timingWindowStrictFraction: 0.10,
      timingWindowLooseFraction: 0.20,
      inputStartBeat: 4
    });

    this.beatIndex = 0;
    this.grammar = new GrammarSequence(grammar);

    this.expectedHits = [];
    this.inputStartTimeMs = null;
    this.notationPattern = [];
  }

  generatePattern(bpm) {
    this.symbolSequence = this.grammar.createSequence();
    const fractionsRaw = convertSymbolsToFractions(this.symbolSequence);

    let totalFraction = fractionsRaw.reduce((a, b) => a + b, 0);
    if (!totalFraction || !isFinite(totalFraction)) {
      this.symbolSequence = ["q", "q", "q", "q"];
      totalFraction = 1;
    }

    const fractions = fractionsRaw.map((f) => f / totalFraction);
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    this._buildExpectedHitsFromDurations(bpm, durationsSec);

    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
  }

  _phaseForBeat(beatIndex) {
    return beatIndex < this.inputStartBeat ? "read" : "input";
  }

  _maybeSetInputStartTimeOnBeat(beatIndex, nowMs) {
    if (beatIndex === this.inputStartBeat && this.inputStartTimeMs == null) {
      this.inputStartTimeMs = nowMs;
    }
  }

  startRound(gameModel) {
    return this._startRoundCommon(gameModel);
  }

  onBeat(gameModel, beatIndex, nowMs) {
    return this._onBeatCommon(gameModel, beatIndex, nowMs);
  }

  onInput(gameModel, deltaMs, targetBeatIndex, nowMs) {
    const bpm = gameModel.bpm;
    const beatDurationMs = this._beatDurationMs(bpm);
    const measureDurationMs = this._measureDurationMs(bpm);

    if (targetBeatIndex < this.inputStartBeat || targetBeatIndex >= this.totalBeats) {
      return { type: "ignore", payload: {} };
    }

    if (this.inputStartTimeMs == null) {
      const beatOffset = targetBeatIndex - this.inputStartBeat;
      const absBeatCenter = nowMs - deltaMs;
      this.inputStartTimeMs = absBeatCenter - beatOffset * beatDurationMs;
    }

    const hitTimeMs = nowMs - this.inputStartTimeMs;

    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs) {
      return { type: "ignore", payload: {} };
    }

    const best = this._findClosestExpectedHit(hitTimeMs);
    return this._scoreHitOrTimingError(best, hitTimeMs, beatDurationMs);
  }
}

