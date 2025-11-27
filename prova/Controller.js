class Controller {
    constructor(bpm, beatsPerMeasure, sequenceLengthBeats, tolerance, grammar) {
        this.bpm = bpm;
        this.beatsPerMeasure = beatsPerMeasure;
        this.sequenceLengthBeats = sequenceLengthBeats; // Es: 4 battiti totali
        this.beatDurationMs = (60 / this.bpm) * 1000;

        this.grammar = new GrammarSequence(grammar);
        this.converter = new MapConvertitor();
        this.scheduler = new SoundScheduler(this.bpm);
        this.rhythmGame = null; // Verrà inizializzato con la sequenza generata
        
        this.tolerance = tolerance;
        this.gamePhase = 'IDLE'; // IDLE, PLAYING, INPUT 
        this.currentMeasureBeat = 0; // Per il metronomo
    }
    
    // Funzione per aggiornare l'HTML
    log(message) {
        const outputDiv = document.getElementById('output');
        outputDiv.innerHTML += `<p>${message}</p>`;
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    // Funzione che gestisce la luce del metronomo
    updateMetronome(beat, isAccent = false) {
        const leds = document.querySelectorAll('.led');
        leds.forEach(led => led.classList.remove('active', 'accent'));
        
        if (beat >= 1 && beat <= this.beatsPerMeasure) {
            leds[beat - 1].classList.add('active');
            if (isAccent) {
                leds[beat - 1].classList.add('accent');
            }
        }
    }

    /**
     * Inizia il gioco: Genera, suona la sequenza e prepara l'input.
     */
    startNewGame() {
        this.log('--- NUOVA PARTITA ---');
        this.gamePhase = 'PLAYING';
        this.currentMeasureBeat = 0;
        
        // 1. Genera e Converte
        const symbolSequence = this.grammar.generate(this.sequenceLengthBeats);
        const relativeDurations = this.converter.convert(symbolSequence);
        const msDurations = this.scheduler.toMsDurations(relativeDurations);
        
        this.log(`Sequenza Generata (${symbolSequence.length} note): ${symbolSequence}`);
        this.log(`Durate in Ms: ${msDurations.join(', ')}`);

        // 2. Prepara la Metrica
        const metronomeMs = this.beatDurationMs;
        const playTimeMs = this.beatsPerMeasure * metronomeMs; // 4 battiti di metronomo
        
        // 3. Suona il Metronomo (4/4)
        this.startMetronome(metronomeMs, 1); // Parte dal beat 1

        // 4. Suona la Sequenza
        const totalPlaybackTime = this.scheduler.schedulePlayback(msDurations, (beatIndex) => {
            // Callback per il feedback audio della sequenza
            // Puoi accendere un LED specifico per la nota suonata
            console.log(`Nota ${beatIndex} suonata.`);
        });
        
        this.log(`Durata sequenza: ${totalPlaybackTime}ms`);

        // 5. Entra in Fase INPUT dopo la riproduzione + un metro di attesa (per il turno dell'utente)
        // La fase di INPUT inizia *dopo* i 4 battiti del metronomo
        
        // Dopo la riproduzione della frase (totalPlaybackTime) facciamo partire il metronomo
        // per la fase di input, che dura 4 battiti di 4/4 (4 * beatDurationMs).
        
        const delayUntilInputPhase = totalPlaybackTime;
        
        setTimeout(() => {
            this.log('*** FASE DI INPUT IN CORSO: INIZIA ORA! ***');
            this.gamePhase = 'INPUT';
            
            // Inizializza la classe di controllo
            this.rhythmGame = new RhythmGame(msDurations, this.tolerance);
            this.rhythmGame.start();

            // Riavvia il metronomo per la fase di input (4 battiti)
            this.startMetronome(metronomeMs, 1);
            
            // Imposta un timeout per la fine del tempo di input (4 battiti dopo l'inizio)
            setTimeout(() => {
                if (this.gamePhase === 'INPUT' && !this.rhythmGame.isFinished) {
                    this.log('⏰ TEMPO SCADUTO! Sequenza non completata.');
                    this.endGame(false); // Game Over per timeout
                }
            }, this.rhythmGame.targetTimesMs[this.rhythmGame.targetTimesMs.length - 1] + 1000); // tempo max + buffer
            
        }, delayUntilInputPhase);
    }

    /**
     * Logica del metronomo visuale 4/4
     * @param {number} intervalMs - Intervallo tra i battiti del metronomo.
     * @param {number} startBeat - Da quale battito iniziare.
     */
    startMetronome(intervalMs, startBeat) {
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
        }
        
        this.currentMeasureBeat = startBeat - 1; 

        const metronomeFunc = () => {
            this.currentMeasureBeat++;
            if (this.currentMeasureBeat > this.beatsPerMeasure) {
                this.currentMeasureBeat = 1;
                
                // Se la fase è INPUT e il metronomo ha fatto 4 battute complete, ferma.
                if (this.gamePhase === 'INPUT' && this.rhythmGame && this.rhythmGame.isFinished) {
                    this.stopMetronome();
                    return;
                }
            }
            
            const isAccent = this.currentMeasureBeat === 1; // Il primo battito è accentato
            this.updateMetronome(this.currentMeasureBeat, isAccent);
        };
        
        // Esegui subito il primo battito
        metronomeFunc(); 
        
        // Poi imposta l'intervallo
        this.metronomeInterval = setInterval(metronomeFunc, intervalMs);
    }
    
    stopMetronome() {
        clearInterval(this.metronomeInterval);
        this.updateMetronome(0); // Spegni i LED
    }

    /**
     * Gestisce l'input utente durante la fase INPUT.
     */
    handleInput(event) {
        if (this.gamePhase !== 'INPUT') {
            this.log('❌ INPUT IGNORATO: La sequenza non è in fase di ascolto.');
            return;
        }

        const result = this.rhythmGame.handleUserInput();
        
        // Logica di feedback visivo/testuale
        let color = '';
        if (result.status === 'HIT') {
            color = 'green';
        } else if (result.status === 'TOO_EARLY' || result.status === 'SKIPPED') {
            color = 'red';
        }

        this.log(`<span style="color:${color};">Input: ${result.status} (Delta: ${result.deltaMs.toFixed(0)}ms)</span>`);
        
        if (this.rhythmGame.isFinished) {
            this.log('*** SEQUENZA COMPLETATA CORRETTAMENTE! BRAVO! ***');
            this.endGame(true);
        }
    }
    
    endGame(success) {
        this.gamePhase = 'IDLE';
        this.stopMetronome();
        this.log(success ? '🎉 Partita terminata con successo.' : '😔 Partita terminata con errore.');
    }
}