import { AudioManager } from './GameSounds.js';
import { GameModel } from './GameModel.js';
import { RhythmView } from './RhythmView.js';
import { GameController } from './GameController.js';

import { FourBeatsMetronomeMiniGame } from './0FollowTheBeat.js';
import { PatternRepeatMiniGame } from './1ListenAndRepeat.js';
import { ReadAndPlayMiniGame } from './2ReadAndRepeat.js';

import { GRAMMAR_EASY44, DEFAULT_GRAMMAR, GRAMMAR_HARD44 } from './MusicalUtilsAndGrammar.js';

function pickGrammar(difficulty) {
  if (difficulty === "easy") return GRAMMAR_EASY44;
  if (difficulty === "hard") return GRAMMAR_HARD44;
  return DEFAULT_GRAMMAR; // medium di default
}

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const mode = params.get("mode") || "all";

   
  // gestione titoli
  
  const titleEl = document.getElementById("mainTitle");
  const subTitleEl = document.getElementById("subTitle");

  // Qui definisci i testi per ogni codice modalità (mg1, mg2, mg3)
  const gameTexts = {
    "mg1": { 
        title: "Follow the Beat", 
        desc: "Training to keep on time the beat, increasing the BPM." 
    },
    "mg2": { 
        title: "Listen and Repeat", 
        desc: "Listen to the pattern first, then repeat it accurately." 
    },
    "mg3": { 
        title: "Read the Rhythm", 
        desc: "Read the notes on the staff and hit the beat." 
    },
    "all": {
        title: "Beat the Beat",
        desc: "Complete all rhythm challenges in sequence."
    }
  };

  // aggiorna l'HTML
  if (gameTexts[mode]) {
      if (titleEl) titleEl.innerText = gameTexts[mode].title;
      if (subTitleEl) subTitleEl.innerText = gameTexts[mode].desc;
  }
  
  

  const grammar = pickGrammar(difficulty);
  const audio = new AudioManager();
  const model = new GameModel();
  const view = new RhythmView();
  const controller = new GameController(model, view, audio);

  // Modalità:
  // all = tutti in sequenza
  // mg1 / mg2 / mg3 = pratica singolo
  if (mode === "mg1") {
    model.addMiniGame(new FourBeatsMetronomeMiniGame());
  } else if (mode === "mg2") {
    model.addMiniGame(new PatternRepeatMiniGame(audio, grammar));
  } else if (mode === "mg3") {
    model.addMiniGame(new ReadAndPlayMiniGame(grammar));
  } else {
    model.addMiniGame(new FourBeatsMetronomeMiniGame());
    model.addMiniGame(new PatternRepeatMiniGame(audio, grammar));
    model.addMiniGame(new ReadAndPlayMiniGame(grammar));
  }

 
});
