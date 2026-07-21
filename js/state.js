/* ============================================================
   VAULT ARCADE — core state, passcode gate, hub navigation
   ============================================================ */

const PASSCODE = "Ilovestink";
const SAVE_KEY = "vaultarcade_save_v1";
const GATE_KEY = "vaultarcade_gate_v1";
const INTRO_KEY = "vaultarcade_seenintro_v1";

const LEVEL_NAMES = {
  1: "Frequency Recall",
  2: "Quoridor Duel",
  3: "The Chess Table",
  4: "Breakout Vault"
};

function defaultState(){
  return {
    hearts: 3,
    currentLevel: 1,          // 1-4, the level currently playable / in progress
    levelsDone: [false,false,false,false], // index 0..3 for levels 1..4
    finaleUnlocked: false
  };
}

let STATE = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // basic shape guard
    if(typeof parsed.hearts !== "number" || !Array.isArray(parsed.levelsDone)) return defaultState();
    return parsed;
  }catch(e){
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(SAVE_KEY, JSON.stringify(STATE));
}

function resetAllProgress(){
  STATE = defaultState();
  saveState();
}

/* ---------- passcode gate ---------- */
function initGate(){
  const gate = document.getElementById("gate");
  const input = document.getElementById("passcode-input");
  const err = document.getElementById("gate-error");
  const btn = document.getElementById("gate-submit");

  showScreen("gate");
  input.focus();

  function tryUnlock(){
    if(input.value === PASSCODE){
      err.textContent = "";
      proceedPastGate();
    }else{
      err.textContent = "Incorrect passcode.";
      input.value = "";
      input.focus();
    }
  }

  btn.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") tryUnlock();
  });
}

function proceedPastGate(){
  showScreen("cutscene");
}

/* ---------- screen switching ---------- */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0,0);
}

/* ---------- hearts UI ---------- */
function heartsHTML(){
  let html = "";
  for(let i=0;i<3;i++){
    const full = i < STATE.hearts;
    html += `<svg class="heart-icon ${full?'full':'lost'}" viewBox="0 0 32 29">
      <path d="M16 28 C 6 20, 1 14, 1 8.5 C 1 3.5, 5 0.5, 9.3 0.5 C 12.2 0.5, 14.6 2, 16 4.5 C 17.4 2, 19.8 0.5, 22.7 0.5 C 27 0.5, 31 3.5, 31 8.5 C 31 14, 26 20, 16 28 Z"
        stroke-width="1.4"/>
    </svg>`;
  }
  return html;
}

function renderHeartsInto(elId){
  const el = document.getElementById(elId);
  if(el) el.innerHTML = heartsHTML();
}

function animateHeartLoss(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.classList.remove("heart-shake");
  void el.offsetWidth; // force reflow so the animation restarts if triggered again quickly
  el.classList.add("heart-shake");
  setTimeout(()=> el.classList.remove("heart-shake"), 550);
}

// Convenience wrapper: lose a heart, refresh the hearts display, and animate it.
function loseHeartAndAnimate(elId){
  const result = loseHeart();
  renderHeartsInto(elId);
  animateHeartLoss(elId);
  return result;
}

/* ---------- lose a heart / fail a level ---------- */
// Call this when the player loses the current level's match/round-set.
// Returns "retry" (stay on this level, heart lost) or "sentback" (all hearts gone).
function loseHeart(){
  STATE.hearts -= 1;
  if(STATE.hearts <= 0){
    STATE.hearts = 3;
    STATE.currentLevel = Math.max(1, STATE.currentLevel - 1);
    saveState();
    return "sentback";
  }
  saveState();
  return "retry";
}

// Call this when the player beats the current level.
function completeLevel(n){
  STATE.levelsDone[n-1] = true;
  STATE.currentLevel = Math.min(4, n+1);
  STATE.hearts = 3; // fresh hearts entering the next challenge
  if(STATE.levelsDone[0] && STATE.levelsDone[1] && STATE.levelsDone[2] && STATE.levelsDone[3]){
    STATE.finaleUnlocked = true;
  }
  saveState();
}

/* ---------- hub rendering ---------- */
function renderHub(){
  renderHeartsInto("hubHearts");

  const track = document.getElementById("track");
  track.innerHTML = "";
  for(let i=1;i<=4;i++){
    const done = STATE.levelsDone[i-1];
    const unlocked = i <= STATE.currentLevel || done;

    if(i > 1){
      const connector = document.createElement("div");
      connector.className = "path-connector";
      track.appendChild(connector);
    }

    const div = document.createElement("div");
    div.className = "node " + (done ? "done" : (unlocked ? "unlocked" : "locked"));
    div.innerHTML = `
      <div class="node-badge">${done ? "✓" : i}</div>
      <div>
        <div class="node-name">${LEVEL_NAMES[i]}</div>
        <div class="node-status">${done ? "Cleared — piece secured" : (unlocked ? "Ready to climb" : "Locked")}</div>
      </div>
      ${unlocked ? '<div class="node-arrow">↑</div>' : ''}
    `;
    if(unlocked){
      div.addEventListener("click", ()=> enterLevel(i));
    }
    track.appendChild(div);
  }

  // lock preview segments
  document.getElementById("lockSeg1").classList.toggle("seg-hidden", !STATE.levelsDone[0]);
  document.getElementById("lockSeg2").classList.toggle("seg-hidden", !STATE.levelsDone[1]);
  document.getElementById("lockSeg3").classList.toggle("seg-hidden", !STATE.levelsDone[2]);

  const finaleBtn = document.getElementById("goFinaleBtn");
  finaleBtn.style.display = STATE.finaleUnlocked ? "inline-block" : "none";
}

function enterLevel(n){
  showScreen("levelShell");
  renderHeartsInto("levelHearts");
  document.getElementById("levelTitle").textContent = "Stage " + n + " — " + LEVEL_NAMES[n];
  document.getElementById("levelSub").textContent = LEVEL_SUBTEXT[n];

  const stage = document.getElementById("gameStage");
  stage.innerHTML = "";

  const starters = { 1: startSoundLevel, 2: startQuoridorLevel, 3: startChessLevel, 4: startBreakoutLevel };
  showLevelInstructions(n, ()=> starters[n](stage));
}

const LEVEL_SUBTEXT = {
  1: "Score above 8.5 on all five rounds to pass",
  2: "Beat the bot to the far side of the board",
  3: "Checkmate the bot",
  4: "Clear the vault wall to expose the key"
};

const LEVEL_INSTRUCTIONS = {
  1: {
    icon: "🎧",
    title: "Frequency Recall",
    body: `
      <p>You'll hear a short musical tone, then it goes quiet.</p>
      <ul>
        <li>Drag the slider to reproduce that pitch from memory — you'll hear the note you're currently pointing to as you drag, so use your ear!</li>
        <li>Lock in your answer once you're happy with it.</li>
        <li>There are 5 rounds. You need a score <strong>above 8.5</strong> (out of 10) on <strong>every single round</strong> to clear the stage.</li>
      </ul>
    `
  },
  2: {
    icon: "🧩",
    title: "Quoridor Duel",
    body: `
      <p>A 9×9 race to the far side of the board.</p>
      <ul>
        <li>You (mint) start at the bottom and are trying to reach the <strong>top row</strong>. The bot (pink) starts at the top, heading for the <strong>bottom row</strong>.</li>
        <li>Click a highlighted square to move your pawn there.</li>
        <li>Click a gap between squares to drop a wall there — walls block movement but can never fully seal off a path.</li>
        <li>Whoever reaches their goal row first wins. The bot is easy — it just walks the shortest open path and never places walls of its own.</li>
      </ul>
    `
  },
  3: {
    icon: "♟️",
    title: "The Chess Table",
    body: `
      <p>You play White and move first.</p>
      <ul>
        <li>Click a piece to see its legal moves highlighted, then click a highlighted square to move there.</li>
        <li>The bot plays quite weakly (roughly 200 elo) — mostly random moves with an occasional free capture.</li>
        <li>You need an actual <strong>checkmate</strong> to clear the stage — a draw or stalemate doesn't count as a win.</li>
      </ul>
    `
  },
  4: {
    icon: "🧱",
    title: "Breakout Vault",
    body: `
      <p>A classic brick-breaker.</p>
      <ul>
        <li>Move your mouse (or drag your finger) to steer the paddle, then click or tap to launch the ball.</li>
        <li>There's a key drawn underneath the bricks — clearing bricks reveals more of it.</li>
        <li>Some bricks are secret power-ups: <strong>+1</strong> spawns an extra ball right where it broke, and <strong>x2</strong> doubles every ball currently in play.</li>
        <li>You've got <strong>3 lives</strong>. Every ball on screen dropping at once costs one life; lose all 3 and the stage is failed. Power-ups that add balls give you a buffer.</li>
      </ul>
    `
  }
};

function showLevelInstructions(n, onStart){
  const info = LEVEL_INSTRUCTIONS[n];
  document.getElementById("modalIcon").innerHTML = `<div style="font-size:44px; line-height:1;">${info.icon}</div>`;
  document.getElementById("modalTitle").textContent = info.title;
  document.getElementById("modalBody").innerHTML = info.body;
  const overlay = document.getElementById("instructionModal");
  overlay.classList.add("active");

  const startBtn = document.getElementById("modalStartBtn");
  startBtn.onclick = ()=>{
    overlay.classList.remove("active");
    onStart();
  };
}

function backToHub(){
  showScreen("hub");
  renderHub();
}

function showOutOfHeartsScreen(){
  const targetName = LEVEL_NAMES[STATE.currentLevel];
  document.getElementById("outOfHeartsMessage").textContent =
    `You ran out of hearts, so you've been sent back to Stage ${STATE.currentLevel} — ${targetName}. Your hearts are refilled to 3 — take another run at it!`;
  showScreen("outOfHearts");
}

// Shared helper: after a level attempt ends
function handleLevelResult(n, won){
  if(won){
    completeLevel(n);
    backToHub();
  }else{
    const result = loseHeart();
    if(result === "sentback"){
      backToHub();
    }
    // if "retry", the individual level module is responsible for restarting itself
    return result;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  injectStaticArt();
  initGate();
  document.getElementById("levelBack").addEventListener("click", backToHub);
  document.getElementById("goFinaleBtn").addEventListener("click", ()=>{
    showScreen("finale");
    initFinale();
  });
  document.getElementById("cutsceneContinueBtn").addEventListener("click", ()=>{
    showScreen("hub");
    renderHub();
  });
  document.getElementById("howToLink").addEventListener("click", ()=>{
    showScreen("cutscene");
  });
  document.getElementById("resetProgressLink").addEventListener("click", ()=>{
    const sure = confirm("Reset all hearts and cleared stages back to the very start?");
    if(sure){
      resetAllProgress();
      renderHub();
    }
  });
  document.getElementById("outOfHeartsContinueBtn").addEventListener("click", backToHub);
});
