/* ******************************************************************
 * FUNZIONI VARIE CHE SERVONO SEMPRE PER GENERARE LE FRASI MUSICALI *
 ****************************************************************** */ 

const MS_PER_MINUTE = 60000;

const DURATION_MAP = {
  m: 1.0,   // semibreve (intera battuta 4/4)
  h: 0.5,   // minima
  q: 0.25,  // semiminima
  o: 0.125  // croma
  
};

/* Ritorna un elemento casuale da un array */
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/*  Ritorna un indice casuale dalla lista di indici */
function getRandomIndex(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/*  Converte simboli ('q','h', ecc.) in frazioni (rispetto alla battuta intera) */
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

/*  Converte frazioni in durate in SECONDI usando i BPM. */
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

export const DEFAULT_GRAMMAR = { //l'anna ha già tolto le cose ridondanti
  // Misura 4/4
  M: [
    ["H", "H"],            // 2 beat + 2 beat
    ["B", "h", "B"],       // 1 beat + 2 beat + 1 beat
  ],

  // Gruppo da 2 beat
  H: [
    "h",                   // minima (2 beat)
    ["B", "B"]             // due blocchi da 1 beat
    //,["E", "q", "E"]        // se vogliamo aggiungere la sincope (Ann)
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

export class GrammarSequence {
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
 * Utility per creare una "partitura" grafica generica
 * note = array di simboli (es. ["q","q","h"...])
 * durationsSec = durate tra un colpo e il successivo (IN SECONDI)
 * ritorna un array di:
 * { offset: 0..1, duration: 0..1, type: "q"/"h"/"o"/... }
 */
export function buildNotationPattern(symbols, durationsSec) {
  const totalDurationSec = durationsSec.reduce((a, b) => a + b, 0) || 1;
  const pattern = [];

  let t = 0;
  for (let i = 0; i < symbols.length; i++) {
    const onsetSec = t;
    const dur = durationsSec[i] || 0;
    const offset = onsetSec / totalDurationSec;
    const fracDur = dur / totalDurationSec;

    pattern.push({
      offset: offset,     // dove parte (0..1)
      duration: fracDur,  // quanto "vale" (0..1) - utile per futuri sviluppi
      type: symbols[i]    // es. "q", "h", "o"
    });

    t += dur;
  }

  return pattern;
}
