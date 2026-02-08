import { BaseRhythmMiniGame } from "./0BaseRhythmMiniGame.js";
import {
  GrammarSequence,
  convertSymbolsToFractions,
  convertFractionsToSeconds,
  buildNotationPattern
} from "../MusicalUtilsAndGrammar.js";
import { SoundScheduler } from "../GameSounds.js";

export class PatternRepeatMiniGame extends BaseRhythmMiniGame {
  constructor(audioManager, grammar) {
    super({
      id: "pattern_repeat",
      name: "Ripeti il ritmo",
      totalBeats: 8,
      timingWindowStrictFraction: 0.10,
      timingWindowLooseFraction: 0.20,
      inputStartBeat: 4
    });

    this.audioManager = audioManager;

    this.beatIndex = 0;
    this.grammar = new GrammarSequence(grammar);

    this.soundScheduler = null;
    this.patternPlayed = false;
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

    if (!this.audioManager?.ctx) {
      console.warn("AudioContext non inizializzato in AudioManager");
      this.soundScheduler = null;
      this.patternPlayed = false;
    } else {
      this.soundScheduler = new SoundScheduler(this.audioManager.ctx, durationsSec);
      this.patternPlayed = false;
    }

    this._buildExpectedHitsFromDurations(bpm, durationsSec);

    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
  }

  startRound(gameModel) {
    // deve includere patternSymbols come prima
    return this._startRoundCommon(gameModel, {
      patternSymbols: this.symbolSequence
    });
  }

  _maybeSetInputStartTimeOnBeat(beatIndex, nowMs) {
    if (beatIndex === this.inputStartBeat && this.inputStartTimeMs == null) {
      this.inputStartTimeMs = nowMs;
    }
  }

  _onBeatSideEffects(beatIndex, _nowMs) {
    if (beatIndex === 0 && this.soundScheduler && !this.patternPlayed) {
      this.patternPlayed = true;
      this.soundScheduler.play();
    }
  }

  onBeat(gameModel, beatIndex, nowMs) {
    return this._onBeatCommon(gameModel, beatIndex, nowMs);
  }

  onInput(gameModel, _deltaMs, targetBeatIndex, nowMs) {
    const bpm = gameModel.bpm;
    const beatDurationMs = this._beatDurationMs(bpm);
    const measureDurationMs = this._measureDurationMs(bpm);

    if (this.inputStartTimeMs == null) {
      if (typeof targetBeatIndex === "number" && targetBeatIndex >= this.inputStartBeat) {
        const beatOffset = targetBeatIndex - this.inputStartBeat;
        const beatCenterAbs = nowMs - _deltaMs;
        this.inputStartTimeMs = beatCenterAbs - beatOffset * beatDurationMs;
      } else {
        return { type: "ignore", payload: {} };
      }
    }

    const hitTimeMs = nowMs - this.inputStartTimeMs;

    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs) {
      return { type: "ignore", payload: {} };
    }

    const best = this._findClosestExpectedHit(hitTimeMs);
    return this._scoreHitOrTimingError(best, hitTimeMs, beatDurationMs);
  }
}

