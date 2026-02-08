import { initLeaderboard } from "./leaderboardUI.js";
import { initSettings } from "./settingsUI.js";
import { initInfo } from "./infoUI.js";
import { AudioManager } from "./GameSounds.js";

// Parametri URL + link dinamici
const params = new URLSearchParams(window.location.search);
const difficulty =
  params.get("difficulty") ||
  localStorage.getItem("difficulty") ||
  "medium";

localStorage.setItem("difficulty", difficulty);


document.getElementById("playAllBtn").href = `gamesPage.html?difficulty=${difficulty}&mode=all`;
document.getElementById("mg1Btn").href = `gamesPage.html?difficulty=${difficulty}&mode=mg1`;
document.getElementById("mg2Btn").href = `gamesPage.html?difficulty=${difficulty}&mode=mg2`;
document.getElementById("mg3Btn").href = `gamesPage.html?difficulty=${difficulty}&mode=mg3`;

// Init UI modali
initLeaderboard();
initSettings();
initInfo();

// Feedback sonoro pulsanti + ritardo navigazione
window.addEventListener("load", () => {
  const audio = new AudioManager();
  audio.init();

  const unlockAudio = () => {
    if (!audio.ctx) audio.init();
    else if (audio.ctx.state === "suspended") audio.ctx.resume();
  };


  /*  Logica per la musica di sottofondo 

  const startMusicOnFirstInteraction = () => {
    unlockAudio(); 
    
    // Controlla se esiste la funzione nel tuo AudioManager e la chiama
    if (audio.playGamesListMusic) { 
        audio.playGamesListMusic(); 
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
        if (audio.playGamesListMusic) audio.playGamesListMusic();
      }
    };
  }

 audio.playGamesListMusic();


*/


 //gestione suoni pulsanti e link

  const simpleButtons = document.querySelectorAll(".mini-btn, .start-btn");

  simpleButtons.forEach(btn => {
    if (btn.closest(".sound-link")) return;

    btn.addEventListener("click", () => {
      unlockAudio();
      audio.playTouchUI();
    });
  });

  // link di navigazione (ritardiamo per far sentire il suono)
  const navLinks = document.querySelectorAll(".sound-link");

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      unlockAudio();
      audio.playTouchUI();

      //prova fadeout 
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
