import { fetchTopLeaderboard } from "./leaderboardService.js";
import { AudioManager } from './GameSounds.js';


export async function initLeaderboard() {

  const audio = new AudioManager();
  await audio.init(); 
  const response = await fetch("leaderboardModal.html");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);

  const modal = document.getElementById("leaderboardModal");
  const closeBtn = document.getElementById("closeLeaderboardBtn");
  const listEl = document.getElementById("leaderboardList");

  // Funzioni di controllo
  const closeModal = () => {
    modal.classList.add("modal--hidden");
    if (audio.playTouchUI) audio.playTouchUI();
  };

  const openModal = () => {
    modal.classList.remove("modal--hidden");
    loadLeaderboardData(listEl);
  };

  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
    };
  
  window.openLeaderboard = openModal;
}

async function loadLeaderboardData(listEl) {
  listEl.textContent = "Loading...";
  try {
    const items = await fetchTopLeaderboard(10);
    if (!items.length) {
      listEl.textContent = "No scores yet.";
      return;
    }
    listEl.innerHTML = `
      <ol style="text-align:left; padding-left: 18px; color: #131138;">
        ${items.map(i => `<li><b>${i.name}</b> — ${i.bestScore}</li>`).join("")}
      </ol>
    `;
  } catch (e) {
    listEl.textContent = "Error loading leaderboard.";
  }
}