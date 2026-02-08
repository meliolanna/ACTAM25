import { AudioManager } from "./GameSounds.js";

window.addEventListener("load", () => {
  const audio = new AudioManager();
  audio.init();

  const unlockAudio = () => {
    if (!audio.ctx) audio.init();
    else if (audio.ctx.state === "suspended") audio.ctx.resume();
  };

  // pulsanti standard (Start / Save / Play again / ecc.)
  document.querySelectorAll(".pulsante").forEach(btn => {

    //se è soundlink, lo gestiamo dopo
    if (btn.closest(".sound-link")) return;

    btn.addEventListener("click", () => {
      unlockAudio();
      audio.playTouchUI();

    });
  });

  // link di navigazione (Back to menu) con ritardo per far sentire il suono
  document.querySelectorAll(".sound-link").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      unlockAudio();
      audio.playTouchUI();

       // fadeout sottofondo  
       audio.stopMenuMusic();

      const targetUrl = link.getAttribute("href");
      if (!targetUrl) return;

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 350);
    });
  });
});
