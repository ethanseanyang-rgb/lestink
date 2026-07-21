/* ============================================================
   CONFETTI — a quick celebratory burst, used on every stage win
   ============================================================ */

const CONFETTI_COLORS = ["#ff6fa5", "#ffc94d", "#35c98c", "#b18cff", "#ff9776", "#ffffff"];

function fireConfetti(count){
  count = count || 90;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "999";
  container.style.overflow = "hidden";
  document.body.appendChild(container);

  for(let i=0;i<count;i++){
    const piece = document.createElement("div");
    const size = 6 + Math.random()*7;
    const color = CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)];
    const isCircle = Math.random() < 0.4;
    piece.style.position = "absolute";
    piece.style.left = (Math.random()*100) + "vw";
    piece.style.top = "-20px";
    piece.style.width = size + "px";
    piece.style.height = (isCircle ? size : size*1.5) + "px";
    piece.style.background = color;
    piece.style.borderRadius = isCircle ? "50%" : "2px";
    piece.style.opacity = "0.95";

    const duration = 2.2 + Math.random()*1.6;
    const delay = Math.random()*0.5;
    const drift = (Math.random()*160 - 80);
    const spin = 360 + Math.random()*540;

    piece.animate([
      { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${drift}px, 105vh) rotate(${spin}deg)`, opacity: 0.9 }
    ], {
      duration: duration*1000,
      delay: delay*1000,
      easing: "cubic-bezier(.25,.46,.45,.94)",
      fill: "forwards"
    });

    container.appendChild(piece);
  }

  setTimeout(()=> container.remove(), 4200);
}
