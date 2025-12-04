import { AudioManager } from './GameSounds.js';
import { GameModel } from './GameModel.js';
import { RhythmView } from './RhythmView.js';
import { GameController } from './GameController.js';
import { FourBeatsMetronomeMiniGame } from './0FollowTheBeat.js'
import { PatternRepeatMiniGame } from './1ListenAndRepeat.js'
import { ReadAndPlayMiniGame } from './2ReadAndRepeat.js'


window.addEventListener("load", () => {
  const audio = new AudioManager();
  const model = new GameModel();
  const view = new RhythmView();
  const controller = new GameController(model, view, audio);

  // Attiva i minigiochi che vuoi usare.
  // Minigioco 1: allineamento sul metronomo 4/4
  model.addMiniGame(new FourBeatsMetronomeMiniGame());

  // Minigioco 2: pattern casuale da ripetere
  model.addMiniGame(new PatternRepeatMiniGame(audio));
  
  // Minigioco 3: pattern da leggere
  model.addMiniGame(new ReadAndPlayMiniGame());

  view.setStatus("Press start to begin!");
});