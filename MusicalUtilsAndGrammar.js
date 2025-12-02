/* ******************************************************************
 * FUNZIONI VARIE CHE SERVONO SEMPRE PER GENERARE LE FRASI MUSICALI *
 ****************************************************************** */ 

// Millisecondi per minuto (se ti servisse)
const MS_PER_MINUTE = 60000;

const DURATION_MAP = {
  m: 1.0,    // semibreve
  h: 0.5,    // minima
  q: 0.25,   // semiminima
  o: 0.125,   // croma
  tq: 2/3,   // terzina di semiminime
  to: 1/3    // terzina di crome
};

/* Ritorna un elemento casuale da un array */
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/* Ritorna un indice casuale dalla lista di indici */
function getRandomIndex(arr) {
  if (!arr || arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/* Converte simboli ('q','h', ecc.) in frazioni (rispetto alla battuta intera) */
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

/* Converte frazioni in durate in SECONDI usando i BPM. */
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


/* *****************************************
 * GRAMMATICHE DIVERSE PER LIVELLI DIVERSI *
 ***************************************** */ 

// M = misura intera (4/4)
// H = gruppo da 2 beat (mezza misura)
// B = gruppo da 1 beat (un quarto di misura)
// E = gruppo da mezzo beat (ottavo)

const DEFAULT_GRAMMAR = { // per ora una sola, implementabili più grammatiche per i livelli diversi?
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

/* **********************************************
 * CLASSE PER APPLICARE LA GRAMMATICA ALLE COSE *
 ********************************************** */ 

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
