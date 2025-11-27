class InputSequence {
    /**
     * @param {number[]} rhythmSequence - Array di intervalli in secondi (es: [0.5, 0.5, 1]).
     * @param {number} timingTolerancePercent - Percentuale di tolleranza (0 a 100).
     */
    constructor(rhythmSequence, timingTolerancePercent = 10) {
        // La sequenza completa dei *tempi assoluti* (in secondi) in cui l'utente deve battere.
        this.targetTimes = [0]; // Il primo battito è sempre a tempo 0
        let currentTime = 0;
        for (const interval of rhythmSequence) {
            currentTime += interval;
            this.targetTimes.push(currentTime);
        }

        this.timingTolerance = timingTolerancePercent / 100;
        this.currentBeatIndex = 0;
        this.startTime = null; // Timestamp di inizio della sequenza
        this.isSequencePlaying = false;
        this.isFinished = false;

        // Batti che l'utente ha battuto (per tracciare gli errori/successi)
        this.userInputs = [];
    }

    /**
     * Inizia il tracciamento della sequenza.
     */
    start() {
        if (this.isSequencePlaying) {
            console.warn("La sequenza è già in esecuzione.");
            return;
        }
        
        this.startTime = performance.now(); // Usa performance.now() per alta precisione
        this.currentBeatIndex = 0;
        this.isSequencePlaying = true;
        this.isFinished = false;
        this.userInputs = [];

        console.log(`Sequenza iniziata. Battiti totali: ${this.targetTimes.length}`);
    }

    /**
     * Resetta lo stato del gioco.
     */
    reset() {
        this.startTime = null;
        this.currentBeatIndex = 0;
        this.isSequencePlaying = false;
        this.isFinished = false;
        this.userInputs = [];
        console.log("Gioco resettato.");
    }

    /**
     * Gestisce l'input dell'utente (click, tocco, spazio) e ne verifica il timing.
     * @returns {{ status: string, expectedTime: number, actualTime: number, delta: number } | null} 
     * Il risultato del controllo o null se la sequenza è finita.
     */
    handleUserInput() {
        if (!this.isSequencePlaying) {
            return { status: 'ERROR', message: 'Sequenza non avviata.' };
        }

        if (this.isFinished) {
            return { status: 'FINISH', message: 'Sequenza completata.' };
        }
        
        // Calcola il tempo trascorso in secondi
        const elapsedSeconds = (performance.now() - this.startTime) / 1000;
        
        const expectedTime = this.targetTimesMs[this.currentBeatIndex];
        const nextExpectedTime = this.targetTimes[this.currentBeatIndex + 1];

        // 1. Definisci la finestra di tolleranza
        // La tolleranza è simmetrica rispetto al tempo target.
        const tolerance = expectedTime * this.timingTolerance; 
        // Variazione sul concetto: potresti anche basare la tolleranza sul tempo tra i battiti,
        // ma la tolleranza sul tempo assoluto è più semplice.
        
        const minTime = expectedTime - tolerance;
        const maxTime = expectedTime + tolerance;
        
        // 2. Controlla il timing
        let status = 'MISS';
        let delta = elapsedSeconds - expectedTime;

        if (elapsedSeconds >= minTime && elapsedSeconds <= maxTime) {
            // ✅ Batti Corretto
            status = 'HIT';
            this.currentBeatIndex++; // Passa al prossimo battito
            
            // 3. Controlla se è finita
            if (this.currentBeatIndex >= this.targetTimes.length) {
                this.isSequencePlaying = false;
                this.isFinished = true;
                console.log("Sequenza completata con successo!");
            }
        } else if (elapsedSeconds < minTime) {
            // ❌ Troppo Presto (Early)
            // L'utente ha battuto un input valido, ma è arrivato prima della finestra
            // del battito corrente. Mantiene l'indice e considera l'input come errato.
            // NON incrementare l'indice qui, altrimenti salti il battito.
            status = 'TOO_EARLY';
            
        } else { // elapsedSeconds > maxTime
            // ❌ Troppo Tardi (Late) O Saltato (Skipped)
            
            // Questo è il caso più delicato. Se l'input arriva dopo il tempo massimo
            // consentito per il battito CORRENTE, allora:
            // a) Il battito CORRENTE è stato *saltato* (Skipped).
            // b) L'input è potenzialmente un battito 'Too Early' per il *prossimo* battito.
            
            // Per semplicità, consideriamo che se l'input arriva troppo tardi per il battito 'N',
            // l'utente ha mancato il battito 'N' e deve riprovare con il battito 'N+1'.
            
            // Dobbiamo prima registrare il "Salto" del battito precedente
            if (this.currentBeatIndex < this.targetTimes.length) {
                // Questo indica che il battito previsto in `expectedTime` è stato saltato dall'utente
                console.log(`❌ Battito ${this.currentBeatIndex} (tempo ${expectedTime}s) saltato.`);
                
                // Avanza l'indice per prepararsi al prossimo battito
                this.currentBeatIndex++; 

                // Se dopo aver avanzato siamo ancora in gioco, ricontrolla.
                // Questo input è comunque un MISS, ma l'indice è avanzato.
                
                if (this.currentBeatIndex >= this.targetTimes.length) {
                    this.isSequencePlaying = false;
                    this.isFinished = true;
                    status = 'SKIPPED_LAST_AND_FINISHED';
                } else {
                     status = 'SKIPPED_AND_TOO_LATE';
                }

            }
        }

        // Registra l'input dell'utente
        const inputResult = { 
            status: status, 
            expectedTime: expectedTime, 
            actualTime: elapsedSeconds, 
            delta: delta 
        };
        this.userInputs.push(inputResult);
        
        console.log(`Input ricevuto: ${JSON.stringify(inputResult)}`);

        return inputResult;
    }
}