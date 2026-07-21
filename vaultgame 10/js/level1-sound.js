/* ============================================================
   LEVEL 1 — FREQUENCY RECALL
   Listen to a tone, then drag a slider to reproduce the pitch
   from memory. 5 rounds, each scored 0-10. Must score > 8.5 on
   EVERY round to clear the stage.
   ============================================================ */

const SOUND_MIN_HZ = 80;
const SOUND_MAX_HZ = 1200;
const SOUND_TONE_DURATION_MS = 2200;
const SOUND_PASS_THRESHOLD = 8.5;

function hzToErb(f){
  return 21.4 * Math.log10(4.37 * (f/1000) + 1);
}
function erbToHz(erb){
  return 1000 * (Math.pow(10, erb/21.4) - 1) / 4.37;
}

let _soundCtx = null;
function getAudioCtx(){
  if(!_soundCtx) _soundCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _soundCtx;
}

function playTone(freq, durationMs){
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.28, ctx.currentTime + durationMs/1000 - 0.08);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs/1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs/1000 + 0.05);
}

function scoreFrequency(target, guess){
  const d = Math.abs(hzToErb(target) - hzToErb(guess));
  const tight = 10 * Math.exp(-0.5 * Math.pow(d/0.55, 2));
  const loose = 3 * Math.exp(-0.5 * Math.pow(d/2.4, 2));
  let score = Math.max(tight, loose);
  score = Math.min(10, score);
  return Math.round(score * 10) / 10;
}

let _previewOsc = null;
let _previewGain = null;

function startPreviewTone(freq){
  const ctx = getAudioCtx();
  if(ctx.state === "suspended") ctx.resume();
  stopPreviewTone(true);
  _previewOsc = ctx.createOscillator();
  _previewGain = ctx.createGain();
  _previewOsc.type = "sine";
  _previewOsc.frequency.value = freq;
  _previewGain.gain.setValueAtTime(0, ctx.currentTime);
  _previewGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.03);
  _previewOsc.connect(_previewGain).connect(ctx.destination);
  _previewOsc.start();
}

function updatePreviewTone(freq){
  if(_previewOsc){
    _previewOsc.frequency.setTargetAtTime(freq, getAudioCtx().currentTime, 0.01);
  }
}

function stopPreviewTone(immediate){
  if(!_previewOsc) return;
  const ctx = getAudioCtx();
  try{
    if(immediate){
      _previewGain.gain.cancelScheduledValues(ctx.currentTime);
      _previewGain.gain.setValueAtTime(0, ctx.currentTime);
      _previewOsc.stop();
    }else{
      _previewGain.gain.cancelScheduledValues(ctx.currentTime);
      _previewGain.gain.setValueAtTime(_previewGain.gain.value, ctx.currentTime);
      _previewGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      _previewOsc.stop(ctx.currentTime + 0.06);
    }
  }catch(e){ /* already stopped */ }
  _previewOsc = null;
  _previewGain = null;
}

let _soundRoundState = null;

function startSoundLevel(stage){
  _soundRoundState = {
    round: 0,
    scores: [],
    targets: []
  };
  for(let i=0;i<5;i++){
    _soundRoundState.targets.push(SOUND_MIN_HZ + Math.random() * (SOUND_MAX_HZ - SOUND_MIN_HZ));
  }
  renderSoundStage(stage);
  nextSoundRound(stage);
}

function renderSoundStage(stage){
  stage.innerHTML = `
    <div class="sound-round-dots" id="soundDots">
      ${[0,1,2,3,4].map(i=>`<div class="round-dot" data-i="${i}"></div>`).join("")}
    </div>
    <div class="tone-visual" id="toneVisual">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--pink)">
        <path d="M9 18V5l12-2v13" stroke-width="1.6"/>
        <circle cx="6" cy="18" r="3" stroke-width="1.6"/>
        <circle cx="18" cy="16" r="3" stroke-width="1.6"/>
      </svg>
    </div>
    <div id="soundInstruction" class="level-sub">Get ready...</div>
    <div class="freq-slider-wrap" id="sliderWrap" style="display:none;">
      <input type="range" id="freqSlider" min="0" max="1000" value="500">
      <div class="freq-readout" id="freqReadout">Drag to match the tone</div>
    </div>
    <button class="btn" id="lockInBtn" style="display:none;">Lock In Answer</button>
    <div class="score-banner" id="scoreBanner"></div>
  `;

  const slider = stage.querySelector("#freqSlider");
  const readout = stage.querySelector("#freqReadout");
  slider.addEventListener("input", ()=>{
    const hz = erbToHzFromSlider(slider.value);
    readout.textContent = "Current guess: " + Math.round(hz) + " Hz (drag, then lock in)";
    updatePreviewTone(hz);
  });
  const beginPreview = ()=> startPreviewTone(erbToHzFromSlider(slider.value));
  const endPreview = ()=> stopPreviewTone(false);
  slider.addEventListener("pointerdown", beginPreview);
  slider.addEventListener("pointerup", endPreview);
  slider.addEventListener("pointercancel", endPreview);
  window.addEventListener("blur", endPreview);
}

function erbToHzFromSlider(sliderVal){
  const erbMin = hzToErb(SOUND_MIN_HZ);
  const erbMax = hzToErb(SOUND_MAX_HZ);
  const erb = erbMin + (sliderVal/1000) * (erbMax - erbMin);
  return erbToHz(erb);
}

function nextSoundRound(stage){
  stopPreviewTone(true);
  const st = _soundRoundState;
  if(st.round >= 5){
    finishSoundLevel(stage);
    return;
  }
  const dots = stage.querySelectorAll(".round-dot");
  dots.forEach((d,i)=>{
    d.classList.remove("active");
    if(i === st.round) d.classList.add("active");
  });

  const toneVisual = stage.querySelector("#toneVisual");
  const instruction = stage.querySelector("#soundInstruction");
  const sliderWrap = stage.querySelector("#sliderWrap");
  const lockInBtn = stage.querySelector("#lockInBtn");
  const scoreBanner = stage.querySelector("#scoreBanner");
  const slider = stage.querySelector("#freqSlider");
  const readout = stage.querySelector("#freqReadout");

  scoreBanner.innerHTML = "";
  sliderWrap.style.display = "none";
  lockInBtn.style.display = "none";
  slider.value = 500;
  readout.textContent = "Listen carefully...";
  instruction.textContent = `Round ${st.round+1} of 5 — Listen...`;
  toneVisual.classList.add("playing");

  const target = st.targets[st.round];
  playTone(target, SOUND_TONE_DURATION_MS);

  setTimeout(()=>{
    toneVisual.classList.remove("playing");
    instruction.textContent = `Round ${st.round+1} of 5 — Now recreate the pitch from memory`;
    sliderWrap.style.display = "block";
    lockInBtn.style.display = "inline-block";
    readout.textContent = "Drag to match the tone";
  }, SOUND_TONE_DURATION_MS + 150);

  lockInBtn.onclick = ()=>{
    stopPreviewTone(true);
    const guessHz = erbToHzFromSlider(slider.value);
    const score = scoreFrequency(target, guessHz);
    st.scores.push(score);

    dots[st.round].classList.remove("active");
    dots[st.round].classList.add(score > SOUND_PASS_THRESHOLD ? "pass" : "fail");

    sliderWrap.style.display = "none";
    lockInBtn.style.display = "none";
    scoreBanner.innerHTML = `Target: ${Math.round(target)} Hz &nbsp;·&nbsp; Your guess: ${Math.round(guessHz)} Hz<br><span class="big">${score.toFixed(1)} / 10</span>`;

    st.round += 1;
    setTimeout(()=> nextSoundRound(stage), 1600);
  };
}

function finishSoundLevel(stage){
  const st = _soundRoundState;
  const allPassed = st.scores.every(s => s > SOUND_PASS_THRESHOLD);
  const total = st.scores.reduce((a,b)=>a+b,0);

  let heartResult = null;
  if(!allPassed){
    heartResult = loseHeartAndAnimate("levelHearts");
  }

  stage.innerHTML = `
    <h2>${allPassed ? "Stage Cleared" : "Attempt Failed"}</h2>
    <p class="level-sub">Total score: ${total.toFixed(1)} / 50 &nbsp;·&nbsp; Rounds passed: ${st.scores.filter(s=>s>SOUND_PASS_THRESHOLD).length}/5</p>
    <div style="display:flex; gap:10px;">
      <div id="soundContinueSlot"></div>
    </div>
  `;

  const slot = stage.querySelector("#soundContinueSlot");
  const btn = document.createElement("button");
  btn.className = "btn";
  if(allPassed){
    btn.textContent = "Continue";
    fireConfetti();
    btn.onclick = ()=>{ completeLevel(1); backToHub(); };
  }else{
    btn.textContent = heartResult === "sentback" ? "Continue" : "Try Again";
    btn.onclick = ()=>{
      if(heartResult === "sentback"){
        showOutOfHeartsScreen();
      }else{
        startSoundLevel(stage);
      }
    };
  }
  slot.appendChild(btn);
}
