import { AudioManager } from './GameSounds.js';

export async function initInfo() {
  
  const audio = new AudioManager();
  await audio.init(); 

  const response = await fetch("infoModal.html");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);

  const modal = document.getElementById("infoModal");
  const openBtn = document.getElementById("infoBtn");
  const closeBtn = document.getElementById("closeInfoBtn");

  
    openBtn.onclick = () => modal.classList.remove("modal--hidden");
  
    closeBtn.onclick = () => {
      if (audio.playTouchUI) audio.playTouchUI();
      modal.classList.add("modal--hidden");
    };
    
    
   modal.onclick = (e) => {
    if (e.target === modal) {
    if (audio.playTouchUI) audio.playTouchUI();
    modal.classList.add("modal--hidden");
  }
};
}