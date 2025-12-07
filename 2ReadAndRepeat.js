import { GrammarSequence, convertSymbolsToFractions,  convertFractionsToSeconds, buildNotationPattern } from  './MusicalUtilsAndGrammar.js';

// -------------------------------------------------
//     MINIGIOCO 3: Leggi il ritmo e riproducilo
// -------------------------------------------------
export class ReadAndPlayMiniGame {
  constructor() {
    this.id = "read_and_play";
    this.name = "Leggi e Suona";

    this.totalBeats = 8;      // 4 lettura + 4 input
    this.timingWindowStrictFraction = 0.10; // 10% di un beat
    this.timingWindowLooseFraction  = 0.20; // 20% di un beat (come prima)

    this.beatIndex = 0;
    this.grammar = new GrammarSequence();

    this.expectedHits = [];
    this.inputStartTimeMs = null;

    this.notationPattern = [];
  }

  generatePattern(bpm) {
    // 1) simboli terminali da grammatica
    this.symbolSequence = this.grammar.createSequence();
    const fractionsRaw = convertSymbolsToFractions(this.symbolSequence);

    let totalFraction = fractionsRaw.reduce((a, b) => a + b, 0);
    if (!totalFraction || !isFinite(totalFraction)) {
      this.symbolSequence = ["q", "q", "q", "q"];
      totalFraction = 1;
    }

    const fractions = fractionsRaw.map(f => f / totalFraction);
    const durationsSec = convertFractionsToSeconds(fractions, bpm);

    // 2) Onset per la logica
    const onsetsMs = [];
    let t = 0;
    for (let i = 0; i < durationsSec.length; i++) {
      onsetsMs.push(t * 1000);
      t += durationsSec[i];
    }

    const beatDurationMs = 60000 / bpm;

    this.expectedHits = onsetsMs.map(tMs => ({
      timeMs: tMs,
      segmentIndex: Math.min(3, Math.max(0, Math.floor(tMs / beatDurationMs))),
      matched: false
    }));

    // 3) Pattern grafico per lo staff
    this.notationPattern = buildNotationPattern(this.symbolSequence, durationsSec);
  }

  startRound(gameModel) {
    this.beatIndex = 0;
    this.inputStartTimeMs = null;

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

  onBeat(gameModel, beatIndex, nowMs) {
    const events = [];
    this.beatIndex = beatIndex;

    const prev = beatIndex - 1;

    // Controllo miss nella fase di input (beat 4..7)
    if (prev >= 4 && prev < this.totalBeats) {
      const segment = prev - 4;
      const hasUnmatched = this.expectedHits.some(
        h => h.segmentIndex === segment && !h.matched
      );
      if (hasUnmatched) {
        events.push({ type: "miss", payload: { beatIndex: prev } });
      }
    }

    if (beatIndex === 4 && this.inputStartTimeMs == null) {
      this.inputStartTimeMs = nowMs;
    }

    // Fine round
    if (beatIndex >= this.totalBeats) {
      return { type: "roundEnd", payload: { events } };
    }

    // Evento beat: non viene suonato il pattern
    const phase = beatIndex < 4 ? "read" : "input";
    const ledIndex = beatIndex % 4;

    events.push({
      type: "beat",
      payload: { beatIndex, ledIndex, phase }
    });

    return { type: "continue", payload: { events } };
  }

  onInput(gameModel, deltaMs, targetBeatIndex, nowMs) {
    const bpm = gameModel.bpm;
    const beatDurationMs = 60000 / bpm;
    const measureDurationMs = beatDurationMs * 4;

    // Input valido solo nei beat 4..7
    if (targetBeatIndex < 4 || targetBeatIndex >= this.totalBeats)
      return { type: "ignore", payload: {} };

    // Stima inizio battuta input se non ancora definito
    if (this.inputStartTimeMs == null) {
      const beatOffset = targetBeatIndex - 4;
      const absBeatCenter = nowMs - deltaMs;
      this.inputStartTimeMs = absBeatCenter - beatOffset * beatDurationMs;
    }

    const hitTimeMs = nowMs - this.inputStartTimeMs;

    // Troppo fuori → ignora
    if (hitTimeMs < -beatDurationMs || hitTimeMs > measureDurationMs + beatDurationMs)
      return { type: "ignore", payload: {} };

    // Trova nota attesa più vicina
    let best = null;
    for (let i = 0; i < this.expectedHits.length; i++) {
      const h = this.expectedHits[i];
      if (h.matched) continue;
      const d = Math.abs(hitTimeMs - h.timeMs);
      if (!best || d < best.distance) {
        best = { index: i, distance: d, note: h };
      }
    }

    if (!best) {
      return { type: "timingError", payload: { reason: "extra" } };
    }

        const strictWindowMs = beatDurationMs * this.timingWindowStrictFraction;
    const looseWindowMs  = beatDurationMs * this.timingWindowLooseFraction;

    if (best.distance <= strictWindowMs) {
      this.expectedHits[best.index].matched = true;
      return {
        type: "score",
        payload: {
          kind: "perfect",
          points: 100
        }
      };
    }

    if (best.distance <= looseWindowMs) {
      this.expectedHits[best.index].matched = true;
      return {
        type: "score",
        payload: {
          kind: "good",
          points: 50
        }
      };
    }

    const reason = hitTimeMs < best.note.timeMs ? "early" : "late";
    return {
      type: "timingError",
      payload: { reason }
    };

  }
}
