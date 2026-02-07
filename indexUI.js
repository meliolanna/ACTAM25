import { initLeaderboard } from "./leaderboardUI.js";
import { initSettings } from "./settingsUI.js";
import { initInfo } from "./infoUI.js";
import { AudioManager } from "./GameSounds.js";

initLeaderboard();
initSettings();
initInfo();

window.addEventListener("load", () => {
  const audio = new AudioManager();
  audio.init();

  const unlockAudio = () => {
    if (!audio.ctx) audio.init();
    else if (audio.ctx.state === "suspended") audio.ctx.resume();
  };

//  Logica per la musica di sottofondo 
  const startMusicOnFirstInteraction = () => {
    unlockAudio(); 
    
    // Controlla se esiste la funzione nel tuo AudioManager e la chiama
    if (audio.playIndexMusic) { 
        audio.playIndexMusic(); 
    }

    // Rimuoviamo gli ascoltatori: vogliamo che succeda solo UNA volta
    document.removeEventListener("click", startMusicOnFirstInteraction);
    document.removeEventListener("keydown", startMusicOnFirstInteraction);
    document.removeEventListener("touchstart", startMusicOnFirstInteraction);
  };

  // Aggiungiamo ascoltatori globali: al primo tocco o tasto premuto, parte la musica
  document.addEventListener("click", startMusicOnFirstInteraction);
  document.addEventListener("keydown", startMusicOnFirstInteraction);
  document.addEventListener("touchstart", startMusicOnFirstInteraction);
  


  const modal = document.getElementById("gameModal"); 

  if (modal) {
    modal.onclick = (e) => {
      
      if (e.target === modal) {
        unlockAudio();
        if (audio.playIndexMusic) audio.playIndexMusic();
      }
    };
  }

  audio.playIndexMusic();



  
  // toolbar
  const simpleButtons = document.querySelectorAll(".mini-btn, .start-btn");

  simpleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      unlockAudio();
      audio.playTouchUI();
    });
  });

  // link di navigazione (difficoltà + sound-link)
  const gameLinks = document.querySelectorAll(".gigacontainer a, .sound-link");

  gameLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      unlockAudio();
      audio.playTouchUI();

     //fadeout 

     audio.stopMenuMusic();

      const targetUrl = link.getAttribute("href");

      if (targetUrl) {
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 300);
      }
    });
  });
});
