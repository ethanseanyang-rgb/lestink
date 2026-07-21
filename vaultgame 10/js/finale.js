/* ============================================================
   FINALE — assemble the lock, drop the key on it, reveal 3 3 7
   ============================================================ */

function lockSVGMarkup(){
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 45V32a18 18 0 0136 0v13" stroke="#ff6fa5" stroke-width="8" fill="none"/>
    <rect x="20" y="45" width="60" height="45" rx="10" fill="#ff6fa5"/>
    <circle cx="50" cy="65" r="7" fill="#fff"/>
    <rect x="46" y="65" width="8" height="16" rx="3" fill="#fff"/>
  </svg>`;
}

function keySVGMarkup(){
  return `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="30" r="16" stroke="#ffc94d" stroke-width="8" fill="none"/>
    <rect x="34" y="26" width="50" height="8" fill="#ffc94d"/>
    <rect x="70" y="34" width="8" height="14" fill="#ffc94d"/>
    <rect x="82" y="34" width="8" height="20" fill="#ffc94d"/>
  </svg>`;
}

function injectStaticArt(){
  ["lockSeg1","lockSeg2","lockSeg3"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerHTML = lockSVGMarkup();
  });
}

function initFinale(){
  const key = document.getElementById("finalKey");
  const lock = document.getElementById("finalLock");
  const hint = document.getElementById("dropHint");
  const codeEl = document.getElementById("codeReveal");

  lock.innerHTML = lockSVGMarkup();
  key.innerHTML = keySVGMarkup();
  codeEl.classList.remove("shown");
  codeEl.textContent = "";
  key.classList.remove("locked-away");
  key.style.position = "relative";
  key.style.left = "0px";
  key.style.top = "0px";
  key.style.zIndex = 1;
  hint.textContent = "Drag the key onto the lock";

  let dragging = false, startX, startY, origLeft = 0, origTop = 0;

  key.onpointerdown = (e)=>{
    dragging = true;
    key.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY;
    origLeft = parseFloat(key.style.left) || 0;
    origTop = parseFloat(key.style.top) || 0;
    key.style.zIndex = 10;
  };
  key.onpointermove = (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    key.style.left = (origLeft + dx) + "px";
    key.style.top = (origTop + dy) + "px";
  };
  key.onpointerup = (e)=>{
    if(!dragging) return;
    dragging = false;
    const keyRect = key.getBoundingClientRect();
    const lockRect = lock.getBoundingClientRect();
    const overlap = !(
      keyRect.right < lockRect.left ||
      keyRect.left > lockRect.right ||
      keyRect.bottom < lockRect.top ||
      keyRect.top > lockRect.bottom
    );
    if(overlap){
      key.classList.add("locked-away");
      hint.textContent = "Unlocked.";
      codeEl.textContent = "3 3 7";
      requestAnimationFrame(()=> codeEl.classList.add("shown"));
      fireConfetti(160);
    }else{
      key.style.left = "0px";
      key.style.top = "0px";
    }
  };
}
