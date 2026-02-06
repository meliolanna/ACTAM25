import { AudioManager } from './GameSounds.js';

const LS_KEY = "btb_input_sound"; // osc | clap | dog | cat
let previewCtx = null;
const settingsAudio = new AudioManager();

function getPreviewCtx() {
  if (!previewCtx) {
    previewCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return previewCtx;
}

async function previewDefaultOsc() {
  const ctx = getPreviewCtx();

  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch (_) {}
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // suono simile al default usato in game
  const t0 = ctx.currentTime;
  osc.frequency.value = 300;

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.7, t0 + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + 0.15);
}


function getDefaultValue() {
  return localStorage.getItem(LS_KEY) || "osc";
}

function setValue(v) {
  localStorage.setItem(LS_KEY, v);
}

function samplePath(value) {
  
  return `samples/${value}.wav`;
}

export async function initSettings() {

  
  const btn = document.getElementById("settingsBtn");
  if (!btn) return;

   await settingsAudio.init();

  
  if (document.getElementById("settingsModal")) {
    wireSettingsHandlers();
    return;
  }

  
  const res = await fetch("./settingsModal.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  wireSettingsHandlers();
}

function wireSettingsHandlers() {
  const modal = document.getElementById("settingsModal");
  const closeBtn = document.getElementById("closeSettingsBtn");
  const previewBtn = document.getElementById("previewSoundBtn");
  const btn = document.getElementById("settingsBtn");

  function open() {
    modal.classList.remove("modal--hidden");

    
    const current = getDefaultValue();
    const radio = modal.querySelector(`input[name="inputSound"][value="${current}"]`);
    if (radio) radio.checked = true;
  }

  function close() {
    if (settingsAudio.playTouchUI) settingsAudio.playTouchUI();
    modal.classList.add("modal--hidden");
  }

  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  
  modal.querySelectorAll(`input[name="inputSound"]`).forEach((r) => {
    r.addEventListener("change", () => {
      setValue(r.value);
    });
  });

  
  previewBtn.addEventListener("click", () => {
  const sel = modal.querySelector(`input[name="inputSound"]:checked`)?.value || "osc";

  if (sel === "osc") {
    previewDefaultOsc();
    return;
  }

  const a = new Audio(`samples/${sel}.wav`);
  a.currentTime = 0;
  a.play();
});


  
  window.openSettings = open;
}
