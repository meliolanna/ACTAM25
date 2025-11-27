/**
 * Classe per schedulare una sequenza di suoni in base a intervalli di durata,
 * utilizzando il timer preciso dell'AudioContext.
 */
class SoundScheduler {
    /**
     * @param {number[]} durationSequence - Array delle durate tra un suono e l'altro in secondi 
     */
    constructor(durationSequence) {
        // Inizializza l'AudioContext (il motore audio)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.durationSequence = durationSequence;
        this.isPlaying = false;
        
        // Calcola i tempi assoluti (in secondi)
        this.scheduleTimes = this.calculateAbsoluteTimes(durationSequence);
    }

    /**
     * Converte la sequenza di durate relative in un array di tempi assoluti (dal momento dell'avvio).
     * Esempio: [1, 0.5, 0.5, 1] -> [0, 1, 1.5, 2, 3]
     * @param {number[]} durations - Array delle durate relative.
     * @returns {number[]} Array dei tempi assoluti.
     */
    calculateAbsoluteTimes(durations) {
        const absoluteTimes = [0]; // Il primo suono è sempre a tempo 0 (all'avvio)
        let cumulativeTime = 0;

        for (const duration of durations) {
            cumulativeTime += duration;
            absoluteTimes.push(cumulativeTime);
        }
        return absoluteTimes;
    }

    /**
     * Funzione che genera il suono 'click' e lo schedula per un tempo futuro.
     * @param {number} time - Il tempo assoluto (in secondi, relativo a this.ctx.currentTime) 
     * in cui il suono deve iniziare.
     */
    scheduleClick(time) {
        // Schedulazione del suono che hai fornito
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 1. Schedulazione della frequenza e dei nodi
        osc.frequency.setValueAtTime(1000, time); // Usa 'time'
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // 2. Schedulazione del Gain (Volume) per l'attacco/rilascio
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + (time - this.ctx.currentTime) + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + (time - this.ctx.currentTime) + 0.08);

        // 3. Avvia e ferma l'oscillatore con precisione
        osc.start(time);
        osc.stop(time + 0.1); // Il suono dura 0.1 secondi
    }
    
    /**
     * Avvia la riproduzione schedulando tutti i suoni.
     */
    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        // Assicura che l'AudioContext sia sbloccato se necessario
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const startTime = this.ctx.currentTime;
        console.log(`Avvio della sequenza al tempo assoluto: ${startTime.toFixed(3)}s`);
        
        // Schedula ogni suono rispetto all'ora di inizio assoluta
        this.scheduleTimes.forEach((relativeTime, index) => {
            const absoluteScheduleTime = startTime + relativeTime;
            this.scheduleClick(absoluteScheduleTime);
            console.log(`Schedulato suono ${index + 1} a ${absoluteScheduleTime.toFixed(3)}s (Relativo: ${relativeTime.toFixed(3)}s)`);
        });

        // Opzionale: Monitora la fine della riproduzione
        const totalDuration = this.scheduleTimes[this.scheduleTimes.length - 1];
        setTimeout(() => {
            this.isPlaying = false;
            console.log("Sequenza completata.");
        }, (totalDuration * 1000) + 200); // 200ms di margine
    }
}