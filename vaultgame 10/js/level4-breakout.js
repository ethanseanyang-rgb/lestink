/* ============================================================
   LEVEL 4 — BREAKOUT VAULT
   Classic breakout, restyled to match the cheery theme. A key is
   drawn underneath the brick wall and revealed as bricks clear.
   A rare few bricks are power-ups: one spawns an extra ball where
   it broke, another doubles every ball currently in play.
   Click/tap to launch the ball each time it's waiting on the paddle.
   ============================================================ */

let BRK = null;
let brkRAF = null;

const BRK_POWERUP_CHANCE = 0.16; // ~16% of bricks are power-ups
const BRK_MAX_BALLS = 8;
const BRK_BRICK_PALETTE = ["#ff9fc2", "#ffd166", "#9fe6c6", "#c4aeff", "#ffb199"];

function startBreakoutLevel(stage){
  cancelAnimationFrame(brkRAF);

  const CANVAS_W = Math.min(640, window.innerWidth - 60);
  const CANVAS_H = 480;

  stage.innerHTML = `
    <div class="breakout-hud">
      <div id="brkLives">Lives: 3</div>
      <div id="brkBallCount">Balls in play: 1</div>
      <div id="brkBricks">Bricks left: --</div>
    </div>
    <canvas id="breakoutCanvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
    <div class="level-sub">Move your mouse (or drag your finger) to steer the paddle. Click to launch the ball. Losing every ball on screen at once costs a life; lose all 3 and the stage is failed.</div>
  `;

  const canvas = stage.querySelector("#breakoutCanvas");
  const ctx = canvas.getContext("2d");

  const cols = 10, rows = 6;
  const pad = 20;
  const brickAreaW = CANVAS_W - pad*2;
  const brickW = brickAreaW / cols;
  const brickH = 24;
  const brickGap = 4;
  const brickTop = 40;

  const bricks = [];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let power = null;
      if(Math.random() < BRK_POWERUP_CHANCE){
        power = Math.random() < 0.5 ? "extra" : "double";
      }
      bricks.push({
        r,c,
        x: pad + c*brickW,
        y: brickTop + r*(brickH+brickGap),
        w: brickW - brickGap,
        h: brickH,
        color: BRK_BRICK_PALETTE[r % BRK_BRICK_PALETTE.length],
        power,
        alive: true
      });
    }
  }

  BRK = {
    ctx, canvas,
    bricks,
    CANVAS_W, CANVAS_H,
    paddle: { w:90, h:12, x: CANVAS_W/2 - 45, y: CANVAS_H - 30 },
    balls: [],
    lives: 3,
    over: false,
    waiting: true,
    banner: null,
    stage
  };
  BRK.balls.push(makeBrkBall(BRK));

  canvas.addEventListener("mousemove", (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    movePaddleTo(x);
  });
  canvas.addEventListener("touchmove", (e)=>{
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    movePaddleTo(x);
  }, {passive:false});

  canvas.addEventListener("click", launchWaitingBall);
  canvas.addEventListener("touchstart", (e)=>{
    if(BRK.waiting){
      e.preventDefault();
      launchWaitingBall();
    }
  }, {passive:false});

  updateBrkHud();
  brkRAF = requestAnimationFrame(brkLoop);
}

function launchWaitingBall(){
  if(!BRK || !BRK.waiting || BRK.over) return;
  BRK.waiting = false;
  const ball = BRK.balls[0];
  const angle = (-90 + (Math.random()*50 - 25)) * Math.PI/180; // mostly upward, slight random spread
  const speed = 4.2;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
}

function movePaddleTo(x){
  BRK.paddle.x = Math.max(0, Math.min(BRK.CANVAS_W - BRK.paddle.w, x - BRK.paddle.w/2));
}

function makeBrkBall(brk, x, y){
  const startX = x !== undefined ? x : brk.paddle.x + brk.paddle.w/2;
  const startY = y !== undefined ? y : brk.paddle.y - 12;
  return { x:startX, y:startY, r:7, vx:0, vy:0 };
}

function drawKeyBackground(ctx, CANVAS_W){
  const accent = "#c9aef0";
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 10;

  const cx = 90, cy = 100, ringR = 34;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI*2);
  ctx.stroke();

  ctx.fillRect(cx + ringR - 6, cy - 9, CANVAS_W - (cx+ringR) - 40, 18);

  const bitX = CANVAS_W - 70;
  ctx.fillRect(bitX, cy - 20, 40, 40);
  ctx.fillRect(bitX + 6, cy + 20, 10, 18);
  ctx.fillRect(bitX + 24, cy + 20, 10, 26);
  ctx.restore();
}

function updateBrkHud(){
  document.getElementById("brkLives").textContent = "Lives: " + BRK.lives;
  document.getElementById("brkBallCount").textContent = "Balls in play: " + BRK.balls.length;
  const left = BRK.bricks.filter(b=>b.alive).length;
  document.getElementById("brkBricks").textContent = "Bricks left: " + left;
}

function brkSpawnBall(x,y){
  BRK.banner = { text: "+1 Ball!", until: Date.now() + 900 };
  if(BRK.balls.length >= BRK_MAX_BALLS) return;
  const b = makeBrkBall(BRK, x, y);
  const angle = (-90 + (Math.random()*70 - 35)) * Math.PI/180;
  const speed = 4.2;
  b.vx = Math.cos(angle) * speed;
  b.vy = Math.sin(angle) * speed;
  BRK.balls.push(b);
}

function brkDoubleBalls(){
  BRK.banner = { text: "Balls Doubled!", until: Date.now() + 900 };
  const current = BRK.balls.slice();
  for(const b of current){
    if(BRK.balls.length >= BRK_MAX_BALLS) break;
    BRK.balls.push({ x:b.x, y:b.y, r:b.r, vx:-b.vx, vy:b.vy });
  }
}

function brkLoop(){
  if(!BRK || BRK.over) return;
  const { ctx, canvas, paddle, bricks, CANVAS_W, CANVAS_H } = BRK;

  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  drawKeyBackground(ctx, CANVAS_W);

  // bricks
  bricks.forEach(b=>{
    if(!b.alive) return;
    ctx.fillStyle = b.color;
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(b.x,b.y,b.w,b.h,4); else ctx.rect(b.x,b.y,b.w,b.h);
    ctx.fill();
    ctx.stroke();
    if(b.power){
      ctx.fillStyle = "rgba(74,46,85,.75)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.power === "extra" ? "+1" : "x2", b.x + b.w/2, b.y + b.h/2 + 1);
    }
  });

  // paddle
  const paddleGrad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
  paddleGrad.addColorStop(0, "#ff6fa5");
  paddleGrad.addColorStop(1, "#ffc94d");
  ctx.fillStyle = paddleGrad;
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); else ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fill();

  if(BRK.waiting){
    const b = BRK.balls[0];
    b.x = paddle.x + paddle.w/2;
    b.y = paddle.y - b.r - 2;

    ctx.fillStyle = "rgba(74,46,85,.7)";
    ctx.font = "600 14px 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click / tap to launch", CANVAS_W/2, 24);
  }

  if(BRK.banner && Date.now() < BRK.banner.until){
    ctx.fillStyle = BRK.banner.text.startsWith("Ball Lost") ? "#ff5d8f" : "#ff6fa5";
    ctx.font = "700 22px 'Baloo 2', 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(BRK.banner.text, CANVAS_W/2, CANVAS_H/2 - 60);
  }

  // move + collide each ball
  for(let i = BRK.balls.length - 1; i >= 0; i--){
    const ball = BRK.balls[i];

    if(!BRK.waiting){
      ball.x += ball.vx;
      ball.y += ball.vy;

      if(ball.x - ball.r < 0){ ball.x = ball.r; ball.vx *= -1; }
      if(ball.x + ball.r > CANVAS_W){ ball.x = CANVAS_W - ball.r; ball.vx *= -1; }
      if(ball.y - ball.r < 0){ ball.y = ball.r; ball.vy *= -1; }

      if(ball.y + ball.r >= paddle.y &&
         ball.y + ball.r <= paddle.y + paddle.h + 8 &&
         ball.x >= paddle.x && ball.x <= paddle.x + paddle.w &&
         ball.vy > 0){
        const hitPos = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
        ball.vy = -Math.abs(ball.vy);
        ball.vx = hitPos * 4.2;
      }

      for(const b of bricks){
        if(!b.alive) continue;
        if(ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
           ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h){
          b.alive = false;
          ball.vy *= -1;
          if(b.power === "extra") brkSpawnBall(b.x + b.w/2, b.y + b.h/2);
          if(b.power === "double") brkDoubleBalls();
          updateBrkHud();
          break;
        }
      }
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = "#4a2e55";
    ctx.fill();

    if(!BRK.waiting && ball.y - ball.r > CANVAS_H){
      BRK.balls.splice(i,1);
    }
  }

  if(!BRK.waiting && BRK.balls.length === 0){
    BRK.lives -= 1;
    updateBrkHud();
    if(BRK.lives <= 0){
      endBreakoutLevel(false);
      return;
    }else{
      BRK.banner = { text: "Ball Lost — " + BRK.lives + " " + (BRK.lives === 1 ? "life" : "lives") + " left", until: Date.now() + 1400 };
      BRK.balls.push(makeBrkBall(BRK));
      BRK.waiting = true;
    }
  }

  if(bricks.every(b=>!b.alive)){
    endBreakoutLevel(true);
    return;
  }

  brkRAF = requestAnimationFrame(brkLoop);
}

function endBreakoutLevel(playerWon){
  BRK.over = true;
  cancelAnimationFrame(brkRAF);

  let heartResult = null;
  if(!playerWon){
    heartResult = loseHeartAndAnimate("levelHearts");
  }

  const stage = BRK.stage;
  const banner = document.createElement("div");
  banner.style.textAlign = "center";
  banner.innerHTML = `
    <h2>${playerWon ? "The Key Is Revealed" : "Out Of Balls"}</h2>
    <button class="btn" id="brkContinueBtn">${playerWon ? "Continue" : (heartResult === "sentback" ? "Continue" : "Try Again")}</button>
  `;
  stage.appendChild(banner);
  if(playerWon) fireConfetti();
  stage.querySelector("#brkContinueBtn").addEventListener("click", ()=>{
    if(playerWon){
      completeLevel(4);
      backToHub();
    }else{
      if(heartResult === "sentback"){
        showOutOfHeartsScreen();
      }else{
        startBreakoutLevel(stage);
      }
    }
  });
}
