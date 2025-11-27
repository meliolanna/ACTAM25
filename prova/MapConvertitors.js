class MapConvertitor{

     contructor(symbolSequence, durationMap, bpm, beatsPerMeasure){
        this.symbolSequence = symbolSequence
        this.durationMap = durationMap
        this.bpm = bpm
        this.beatsPerMeasure = beatsPerMeasure

        this.fractionalSequence = []
        this.msSequence = []
     }

    /**
     * Converte una sequenza di simboli musicali (es. 'q', 'h') 
     * nella loro rappresentazione in frazioni numeriche.
     * * @param {string[]} symbolSequence - La sequenza di lettere generata 
     * @param {Object<string, number>} durationMap - La mappa di conversione lettere - frazioni
     * @returns {number[]} Una nuova lista contenente le frazioni
     */
    convertSymbolsToFractions(symbolSequence, durationMap) {
        this.fractionalSequence = symbolSequence.map(symbol => {
            const fraction = durationMap[symbol];

            if (fraction === undefined) {
                console.warn(`Simbolo di durata sconosciuto: '${symbol}'`);
                return 0;
            }
        });
    }

    /**
     * Converte una sequenza di frazioni numeriche (dove 1.0 è la battuta 4/4 intera) 
     * in millisecondi, usando i BPM forniti.
     * * @param {number[]} fractionalSequence - La sequenza di valori frazionari 
     * @param {number} bpm - Velocità di gioco in BPM
     * @returns {number[]} Una nuova lista contenente le durate in millisecondi
     */

    convertFractionsToMs(fractionalSequence, bpm) {
        if (bpm <= 0) {
            console.error("BPM deve essere maggiore di zero.");
            return [];
        }

        // Durata del beat in ms
        const beatDurationMs = 60000 / bpm;

        // Durata della battuta in 4/4 in ms
        const wholeNoteDurationMs =  this.beatsPerMeasure* beatDurationMs;

        this.msSequence = fractionalSequence.map(fraction => {
            // Durata ms = durata beat * frazione
            return wholeNoteDurationMs * fraction;
        });
    }

}


