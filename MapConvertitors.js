const MS_PER_MINUTE = 60000; // millisecondi come costante

/**
 * Converte una sequenza di simboli musicali (es. 'q', 'h') 
 * nella loro rappresentazione in frazioni numeriche.
 * * @param {string[]} symbolSequence - La sequenza di lettere generata 
 * @param {Object<string, number>} durationMap - La mappa di conversione lettere - frazioni
 * @returns {number[]} Una nuova lista contenente le frazioni
 */
function convertSymbolsToFractions(symbolSequence, durationMap) {
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

/**
 * Converte una sequenza di frazioni numeriche (dove 1.0 è la battuta 4/4 intera) 
 * in millisecondi, usando i BPM forniti.
 * * @param {number[]} fractionalSequence - La sequenza di valori frazionari 
 * @param {number} bpm - Velocità di gioco in BPM
 * @returns {number[]} Una nuova lista contenente le durate in millisecondi
 */

function convertFractionsToMs(fractionalSequence, bpm) {
    if (bpm <= 0) {
        console.error("BPM deve essere maggiore di zero.");
        return [];
    }

    // Durata del beat in ms
    const beatDurationMs = MS_PER_MINUTE / bpm;

    // Durata della battuta in 4/4 in ms
    const wholeNoteDurationMs = 4 * beatDurationMs;

    const msSequence = fractionalSequence.map(fraction => {
        // Durata ms = durata beat * frazione
        return wholeNoteDurationMs * fraction;
    });

    return msSequence;
}