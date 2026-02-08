import { AudioManager } from './GameSounds.js';
import { GameModel } from './GameModel.js';
import { RhythmView } from './RhythmView.js';
import { GameController } from './GameController.js';

import { FourBeatsMetronomeMiniGame } from './minigames/1FollowTheBeat.js';
import { PatternRepeatMiniGame } from './minigames/2ListenAndRepeat.js';
import { ReadAndPlayMiniGame } from './minigames/3ReadAndRepeat.js';

import { GRAMMAR_EASY44, DEFAULT_GRAMMAR, GRAMMAR_HARD44 } from './MusicalUtilsAndGrammar.js';

function pickGrammar(difficulty) {
  if (difficulty === "easy") return GRAMMAR_EASY44;
  if (difficulty === "hard") return GRAMMAR_HARD44;
  return DEFAULT_GRAMMAR; // medium di default
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const mode = params.get("mode") || "all";
  return { difficulty, mode };
}

function setTitles(mode, gameModes) {
  const titleEl = document.getElementById("mainTitle");
  const subTitleEl = document.getElementById("subTitle");

  const data = gameModes[mode] ?? gameModes.all;

  if (titleEl) titleEl.innerText = data.title;
  if (subTitleEl) subTitleEl.innerText = data.desc;
}

window.addEventListener("load", () => {
  const { difficulty, mode: rawMode } = getParams();

  const grammar = pickGrammar(difficulty);
  const audio = new AudioManager();

  const model = new GameModel();
  const view = new RhythmView();
  const controller = new GameController(model, view, audio);

  const gameModes = {
    mg1: {
      title: "Follow the Beat",
      desc: "Training to keep on time the beat, increasing the BPM.",
      build: () => [new FourBeatsMetronomeMiniGame()],
    },
    mg2: {
      title: "Listen and Repeat",
      desc: "Listen to the pattern first, then repeat it accurately.",
      build: () => [new PatternRepeatMiniGame(audio, grammar)],
    },
    mg3: {
      title: "Read the Rhythm",
      desc: "Read the notes on the staff and hit the beat.",
      build: () => [new ReadAndPlayMiniGame(grammar)],
    },
    all: {
      title: "Beat the Beat",
      desc: "Complete all rhythm challenges in sequence.",
      build: () => [
        new FourBeatsMetronomeMiniGame(),
        new PatternRepeatMiniGame(audio, grammar),
        new ReadAndPlayMiniGame(grammar),
      ],
    },
  };

  // fallback se mode sconosciuta
  const mode = gameModes[rawMode] ? rawMode : "all";

  setTitles(mode, gameModes);

  // aggiunta minigames
  for (const mg of gameModes[mode].build()) {
    model.addMiniGame(mg);
  }
});

