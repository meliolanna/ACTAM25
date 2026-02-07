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

  // pulsanti semplici (toolbar)
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

      const targetUrl = link.getAttribute("href");

      if (targetUrl) {
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 250);
      }
    });
  });
});
