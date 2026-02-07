export class BaseRhythmMiniGame {
  constructor({
    id,
    name,
    totalBeats = 8,                  // default: 4 ascolto/lettura + 4 input
    timingWindowStrictFraction = 0.10,
    timingWindowLooseFraction = 0.20,
    inputStartBeat = 4               // beat da cui parte la fase input
  }) {
    this.id = id;
    this.name = name;

    this.totalBeats = totalBeats;
    this.inputStartBeat = inputStartBeat;

    this.timingWindowStrictFraction = timingWindowStrictFraction;
    this.timingWindowLooseFraction = timingWindowLooseFraction;

    this.beatIndex = 0;

    this.symbolSequence = [];
    this.expectedHits = [];
    this.notationPattern = [];

    // usato da alcuni giochi
    this.inputStartTimeMs = null;
  }

  // ---------- Helpers comuni ----------
  _beatDurationMs(bpm) {
    return 60000 / bpm;
  }

  _measureDurationMs(bpm) {
    return 4 * this._beatDurationMs(bpm);
  }

  _buildExpectedHitsFromDurations(bpm, durationsSec) {
    const onsetsMs = [];
    let t = 0;
    for (let i = 0; i < durationsSec.length; i++) {
      onsetsMs.push(t * 1000);
      t += durationsSec[i];
    }

    const beatDurationMs = this._beatDurationMs(bpm);

    this.expectedHits = onsetsMs.map((tMs) => {
      const seg = Math.min(3, Math.max(0, Math.floor(tMs / beatDurationMs)));
      return {
        timeMs: tMs,
        segmentIndex: seg,
        matched: false
      };
    });
  }

  _checkMissForPrevBeat(prevBeatIndex, events) {
    if (prevBeatIndex >= this.inputStartBeat && prevBeatIndex < this.totalBeats) {
      const segment = prevBeatIndex - this.inputStartBeat;
      const hasUnmatchedInSegment = this.expectedHits.some(
        (h) => h.segmentIndex === segment && !h.matched
      );
      if (hasUnmatchedInSegment) {
        events.push({
          type: "miss",
          payload: { beatIndex: prevBeatIndex }
        });
      }
    }
  }

  _makeBeatEvent(beatIndex, phase) {
    return {
      type: "beat",
      payload: {
        beatIndex,
        ledIndex: beatIndex % 4,
        phase
      }
    };
  }

  _findClosestExpectedHit(hitTimeMs) {
    let best = null;
    for (let i = 0; i < this.expectedHits.length; i++) {
      const h = this.expectedHits[i];
      if (h.matched) continue;
      const d = Math.abs(hitTimeMs - h.timeMs);
      if (best === null || d < best.distance) {
        best = { index: i, distance: d, note: h };
      }
    }
    return best;
  }

  _scoreHitOrTimingError(best, hitTimeMs, beatDurationMs) {
    if (!best) {
      return { type: "timingError", payload: { reason: "extra" } };
    }

    const strictWindowMs = beatDurationMs * this.timingWindowStrictFraction;
    const looseWindowMs = beatDurationMs * this.timingWindowLooseFraction;

    if (best.distance <= strictWindowMs) {
      this.expectedHits[best.index].matched = true;
      return {
        type: "score",
        payload: { kind: "perfect", points: 100 }
      };
    }

    if (best.distance <= looseWindowMs) {
      this.expectedHits[best.index].matched = true;
      return {
        type: "score",
        payload: { kind: "good", points: 50 }
      };
    }

    const reason = hitTimeMs < best.note.timeMs ? "early" : "late";
    return { type: "timingError", payload: { reason } };
  }

  // ---------- Template methods ----------
  generatePattern(_bpm) {
    throw new Error("generatePattern(bpm) must be implemented by subclass");
  }

  _maybeSetInputStartTimeOnBeat(_beatIndex, _nowMs) {
    // default: no-op
  }

  _phaseForBeat(beatIndex) {
    return beatIndex < this.inputStartBeat ? "listen" : "input";
  }

  _onBeatSideEffects(_beatIndex, _nowMs) {
    // default: no-op
  }

  _startRoundCommon(gameModel, extraPayload = {}) {
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
        notation: { enabled: true, notes: this.notationPattern },
        ...extraPayload
      }
    };
  }

  _onBeatCommon(gameModel, beatIndex, nowMs = null) {
    const events = [];
    this.beatIndex = beatIndex;

    const prev = beatIndex - 1;
    this._checkMissForPrevBeat(prev, events);

    this._maybeSetInputStartTimeOnBeat(beatIndex, nowMs);

    if (beatIndex >= this.totalBeats) {
      return { type: "roundEnd", payload: { events } };
    }

    const phase = this._phaseForBeat(beatIndex);
    events.push(this._makeBeatEvent(beatIndex, phase));

    this._onBeatSideEffects(beatIndex, nowMs);

    return { type: "continue", payload: { events } };
  }

  getId() {
    return this.id;
  }
}
