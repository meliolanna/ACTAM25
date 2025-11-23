/**
 * @param {Array<any>} arr - La lista da cui selezionare.
 * @returns {any} Un elemento casuale dalla lista.
 */


function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

/**
 * @param {Array<number>} arr - La lista di indici.
 * @returns {number} Un indice casuale dalla lista.
 */
function getRandomIndex(arr) {
    if (!arr || arr.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

class GrammarSequence {
    /**
     * @param {Object<string, Array<string|Array<string>>>} grammar - La grammatica (es. {'S': ['A', ['B', 'C']]})
     */
    constructor(grammar) {
        this.grammar = grammar;
        // Ottiene le chiavi della grammatica (simboli non terminali).
        this.grammarKeys = Object.keys(grammar);
        this.N = this.grammarKeys.length;
        this.sequence = []; // Inizializza la sequenza come array vuoto
    }

    /**
     * Sostituisce il simbolo all'indice con uno o più simboli in convertTo.
     * * @param {number} index - Indice della sequenza da sostituire.
     * @param {string | string[]} convertTo - Simbolo/i con cui sostituire.
     */
    replace(index, convertTo) {
        // Uniforma convertTo a un array se è una stringa singola.
        const conversionArray = Array.isArray(convertTo) ? convertTo : [convertTo];
        
        // Utilizza splice per un'operazione di sostituzione in-place più pulita e performante.
        // splice(index, deleteCount, item1, item2, ...)
        // Qui, deleteCount è 1 (il simbolo da sostituire).
        this.sequence.splice(index, 1, ...conversionArray);
    }

    /**
     * Converte un simbolo non terminale casuale nella sequenza.
     * * @param {number[]} idxs - Array di indici dove si trovano i simboli non terminali.
     */
    convertSequence(idxs) {
        // Seleziona un indice casuale tra quelli forniti.
        const index = getRandomIndex(idxs);
        if (index === null) return;

        const symbol = this.sequence[index];
        
        // Seleziona una regola di conversione casuale per il simbolo.
        const possibleConversions = this.grammar[symbol];
        const convertTo = getRandomElement(possibleConversions);
        
        this.replace(index, convertTo);
    }

    /**
     * Cerca i simboli non terminali in una sequenza e ne restituisce gli indici.
     * * @param {string[]} sequence - La sequenza di simboli.
     * @returns {[number[], boolean]} Un array contenente:
     * 1. Array di indici dove si trovano i simboli non terminali.
     * 2. Un booleano che indica se sono stati trovati simboli non terminali.
     */
    findNonTerminalSymbols(sequence) {
        const idxs = [];
        
        // Utilizza un Set per una ricerca più veloce di simboli.
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
     * Crea una sequenza di simboli terminali partendo da una sequenza iniziale 
     * di simboli non terminali, usando un approccio iterativo.
     * * @param {string[]} startSequence - La sequenza iniziale di simboli.
     * @returns {[string[], string[][]]} Un array contenente:
     * 1. La sequenza finale di simboli terminali.
     * 2. La cronologia delle trasformazioni della sequenza.
     */
    createSequence(startSequence) {
        this.sequence = [...startSequence]; // Usa la copia spread per evitare modifiche all'input
        const sequenceTransformation = [[...startSequence]]; // Inizializza con la sequenza iniziale
        
        while (true) {
            const [idxs, toConvert] = this.findNonTerminalSymbols(this.sequence);
            
            if (!toConvert) {
                break; // Tutte le sostituzioni sono state completate
            }
            
            this.convertSequence(idxs);
            // Salva una COPIA della sequenza corrente nella cronologia.
            sequenceTransformation.push([...this.sequence]);
        }
        
        return [this.sequence, sequenceTransformation];
    }
}