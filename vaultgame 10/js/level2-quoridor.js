/* ============================================================
   LEVEL 2 — QUORIDOR DUEL
   9x9 board. Reach the far row before the bot reaches yours.
   The bot only ever moves (never places walls) and just takes
   the shortest open path each turn, so it is easy to out-wall.
   ============================================================ */

const Q_SIZE = 9;
const Q_PLAYER_WALLS_START = 10;

let Q = null; // level state, re-created each attempt

function qNewState(){
  return {
    pawn: { p1: {r:8,c:4}, p2: {r:0,c:4} }, // p1 = human, goal row 0. p2 = bot, goal row 8
    wallsH: Array.from({length:8}, ()=>Array(8).fill(false)),
    wallsV: Array.from({length:8}, ()=>Array(8).fill(false)),
    wallsLeft: { p1: Q_PLAYER_WALLS_START, p2: 0 },
    turn: "p1",
    over: false
  };
}

function qGetWallH(walls,r,c){ return r>=0&&r<=7&&c>=0&&c<=7 && walls.wallsH[r][c]; }
function qGetWallV(walls,r,c){ return r>=0&&r<=7&&c>=0&&c<=7 && walls.wallsV[r][c]; }

function qBlocked(walls, r1,c1, r2,c2){
  if(r1 === r2){
    const c = Math.min(c1,c2);
    return qGetWallV(walls, r1, c) || qGetWallV(walls, r1-1, c);
  }
  if(c1 === c2){
    const r = Math.min(r1,r2);
    return qGetWallH(walls, r, c1) || qGetWallH(walls, r, c1-1);
  }
  return false;
}

function qPathExists(walls, startR, startC, goalRow){
  const visited = Array.from({length:Q_SIZE}, ()=>Array(Q_SIZE).fill(false));
  const queue = [[startR,startC]];
  visited[startR][startC] = true;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while(queue.length){
    const [r,c] = queue.shift();
    if(r === goalRow) return true;
    for(const [dr,dc] of dirs){
      const nr=r+dr, nc=c+dc;
      if(nr<0||nr>=Q_SIZE||nc<0||nc>=Q_SIZE) continue;
      if(visited[nr][nc]) continue;
      if(qBlocked(walls, r,c, nr,nc)) continue;
      visited[nr][nc] = true;
      queue.push([nr,nc]);
    }
  }
  return false;
}

function qBfsDistance(walls, startR, startC, goalRow, avoidR, avoidC){
  const visited = Array.from({length:Q_SIZE}, ()=>Array(Q_SIZE).fill(false));
  const queue = [[startR,startC,0]];
  visited[startR][startC] = true;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while(queue.length){
    const [r,c,d] = queue.shift();
    if(r === goalRow) return d;
    for(const [dr,dc] of dirs){
      const nr=r+dr, nc=c+dc;
      if(nr<0||nr>=Q_SIZE||nc<0||nc>=Q_SIZE) continue;
      if(visited[nr][nc]) continue;
      if(nr===avoidR && nc===avoidC) continue;
      if(qBlocked(walls, r,c, nr,nc)) continue;
      visited[nr][nc] = true;
      queue.push([nr,nc,d+1]);
    }
  }
  return Infinity;
}

// Valid moves for a pawn, including jump-over rules
function qValidMoves(walls, mover, opp){
  const {r,c} = mover;
  const moves = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for(const [dr,dc] of dirs){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=Q_SIZE||nc<0||nc>=Q_SIZE) continue;
    if(qBlocked(walls, r,c, nr,nc)) continue;
    if(nr === opp.r && nc === opp.c){
      const jr = r+2*dr, jc = c+2*dc;
      if(jr>=0 && jr<Q_SIZE && jc>=0 && jc<Q_SIZE && !qBlocked(walls, nr,nc, jr,jc)){
        moves.push({r:jr,c:jc});
      }else{
        // diagonal side-steps
        const perp = dr!==0 ? [[0,-1],[0,1]] : [[-1,0],[1,0]];
        for(const [pdr,pdc] of perp){
          const sr = nr+pdr, sc = nc+pdc;
          if(sr<0||sr>=Q_SIZE||sc<0||sc>=Q_SIZE) continue;
          if(qBlocked(walls, nr,nc, sr,sc)) continue;
          moves.push({r:sr,c:sc});
        }
      }
    }else{
      moves.push({r:nr,c:nc});
    }
  }
  return moves;
}

function startQuoridorLevel(stage){
  Q = qNewState();
  renderQuoridor(stage);
}

function renderQuoridor(stage){
  const CELL = window.innerWidth < 640 ? 38 : 52;
  const GAP = 10;
  const total = Q_SIZE*CELL + (Q_SIZE-1)*GAP;

  stage.innerHTML = `
    <div class="q-controls">
      <div class="q-walls-left" id="qWallsLeft"></div>
      <div class="level-sub" id="qTurnLabel"></div>
    </div>
    <div id="quoridorBoard" style="width:${total}px; height:${total}px;"></div>
    <div class="level-sub">You (mint) start at the bottom, aiming for the top row. The bot (pink) starts at the top, aiming for the bottom. Click a highlighted square to move, or click a gap between squares to drop a wall there.</div>
  `;

  const board = stage.querySelector("#quoridorBoard");
  board.style.position = "relative";

  // cells
  for(let r=0;r<Q_SIZE;r++){
    for(let c=0;c<Q_SIZE;c++){
      const cell = document.createElement("div");
      cell.className = "q-cell";
      if(r===0) cell.classList.add("goal-p1");
      if(r===Q_SIZE-1) cell.classList.add("goal-p2");
      cell.style.position = "absolute";
      cell.style.left = (c*(CELL+GAP)) + "px";
      cell.style.top = (r*(CELL+GAP)) + "px";
      cell.style.width = CELL+"px";
      cell.style.height = CELL+"px";
      cell.dataset.r = r; cell.dataset.c = c;
      cell.addEventListener("click", ()=> onQuoridorCellClick(r,c,stage,CELL,GAP));
      board.appendChild(cell);
    }
  }

  // horizontal wall slots (between row r/r+1, columns c,c+1) r,c in 0..7
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const slot = document.createElement("div");
      slot.className = "q-slot hoverable h-slot";
      slot.style.position = "absolute";
      slot.style.left = (c*(CELL+GAP)) + "px";
      slot.style.top = (r*(CELL+GAP)+CELL) + "px";
      slot.style.width = (2*CELL+GAP) + "px";
      slot.style.height = GAP + "px";
      slot.dataset.r = r; slot.dataset.c = c;
      slot.addEventListener("click", ()=> onQuoridorWallClick("H", r,c,stage,CELL,GAP));
      board.appendChild(slot);
    }
  }
  // vertical wall slots
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const slot = document.createElement("div");
      slot.className = "q-slot hoverable v-slot";
      slot.style.position = "absolute";
      slot.style.left = (c*(CELL+GAP)+CELL) + "px";
      slot.style.top = (r*(CELL+GAP)) + "px";
      slot.style.width = GAP + "px";
      slot.style.height = (2*CELL+GAP) + "px";
      slot.dataset.r = r; slot.dataset.c = c;
      slot.addEventListener("click", ()=> onQuoridorWallClick("V", r,c,stage,CELL,GAP));
      board.appendChild(slot);
    }
  }

  drawQuoridorPawnsAndWalls(stage, CELL, GAP);
  updateQuoridorUI(stage);
}

function updateQuoridorUI(stage){
  stage.querySelector("#qWallsLeft").textContent = "Your walls left: " + Q.wallsLeft.p1;
  stage.querySelector("#qTurnLabel").textContent = Q.over ? "" : (Q.turn === "p1" ? "Your move" : "Bot is thinking...");

  // highlight valid move cells
  stage.querySelectorAll(".q-cell").forEach(cell=>{
    cell.classList.remove("movable-highlight");
    cell.style.boxShadow = "";
  });
  if(!Q.over && Q.turn === "p1"){
    const moves = qValidMoves(Q, Q.pawn.p1, Q.pawn.p2);
    moves.forEach(m=>{
      const cell = stage.querySelector(`.q-cell[data-r="${m.r}"][data-c="${m.c}"]`);
      if(cell) cell.style.boxShadow = "inset 0 0 0 3px var(--brass-bright)";
    });
  }
}

function drawQuoridorPawnsAndWalls(stage, CELL, GAP){
  stage.querySelectorAll(".pawn").forEach(p=>p.remove());
  const board = stage.querySelector("#quoridorBoard");

  const p1 = document.createElement("div");
  p1.className = "pawn p1";
  p1.style.position="absolute";
  p1.style.left = (Q.pawn.p1.c*(CELL+GAP)) + "px";
  p1.style.top = (Q.pawn.p1.r*(CELL+GAP)) + "px";
  p1.style.width = CELL+"px"; p1.style.height = CELL+"px";
  p1.textContent = "YOU";
  board.appendChild(p1);

  const p2 = document.createElement("div");
  p2.className = "pawn p2";
  p2.style.position="absolute";
  p2.style.left = (Q.pawn.p2.c*(CELL+GAP)) + "px";
  p2.style.top = (Q.pawn.p2.r*(CELL+GAP)) + "px";
  p2.style.width = CELL+"px"; p2.style.height = CELL+"px";
  p2.textContent = "BOT";
  board.appendChild(p2);

  stage.querySelectorAll(".h-slot").forEach(slot=>{
    const r = +slot.dataset.r, c = +slot.dataset.c;
    slot.classList.toggle("wall", Q.wallsH[r][c]);
  });
  stage.querySelectorAll(".v-slot").forEach(slot=>{
    const r = +slot.dataset.r, c = +slot.dataset.c;
    slot.classList.toggle("wall", Q.wallsV[r][c]);
  });
}

function onQuoridorCellClick(r,c, stage, CELL, GAP){
  if(Q.over || Q.turn !== "p1") return;
  const moves = qValidMoves(Q, Q.pawn.p1, Q.pawn.p2);
  if(!moves.some(m=>m.r===r && m.c===c)) return;
  Q.pawn.p1 = {r,c};
  drawQuoridorPawnsAndWalls(stage, CELL, GAP);

  if(r === 0){
    endQuoridorLevel(stage, true);
    return;
  }
  Q.turn = "bot";
  updateQuoridorUI(stage);
  setTimeout(()=> quoridorBotTurn(stage, CELL, GAP), 550);
}

function onQuoridorWallClick(orientation, r,c, stage, CELL, GAP){
  if(Q.over || Q.turn !== "p1") return;
  if(Q.wallsLeft.p1 <= 0) return;

  const wallsH = Q.wallsH, wallsV = Q.wallsV;
  if(orientation === "H"){
    if(wallsH[r][c]) return;
    if(qGetWallH(Q,r,c-1) || qGetWallH(Q,r,c+1)) return;
    if(qGetWallV(Q,r,c)) return;
    wallsH[r][c] = true;
    const ok = qPathExists(Q, Q.pawn.p1.r, Q.pawn.p1.c, 0) && qPathExists(Q, Q.pawn.p2.r, Q.pawn.p2.c, 8);
    if(!ok){ wallsH[r][c] = false; return; }
  }else{
    if(wallsV[r][c]) return;
    if(qGetWallV(Q,r-1,c) || qGetWallV(Q,r+1,c)) return;
    if(qGetWallH(Q,r,c)) return;
    wallsV[r][c] = true;
    const ok = qPathExists(Q, Q.pawn.p1.r, Q.pawn.p1.c, 0) && qPathExists(Q, Q.pawn.p2.r, Q.pawn.p2.c, 8);
    if(!ok){ wallsV[r][c] = false; return; }
  }

  Q.wallsLeft.p1 -= 1;
  drawQuoridorPawnsAndWalls(stage, CELL, GAP);
  Q.turn = "bot";
  updateQuoridorUI(stage);
  setTimeout(()=> quoridorBotTurn(stage, CELL, GAP), 550);
}

function quoridorBotTurn(stage, CELL, GAP){
  if(Q.over) return;
  const moves = qValidMoves(Q, Q.pawn.p2, Q.pawn.p1);
  let best = null, bestDist = Infinity;
  for(const m of moves){
    const d = qBfsDistance(Q, m.r, m.c, 8, Q.pawn.p1.r, Q.pawn.p1.c);
    if(d < bestDist){ bestDist = d; best = m; }
  }
  if(best) Q.pawn.p2 = best;
  drawQuoridorPawnsAndWalls(stage, CELL, GAP);

  if(best && best.r === 8){
    endQuoridorLevel(stage, false);
    return;
  }
  Q.turn = "p1";
  updateQuoridorUI(stage);
}

function endQuoridorLevel(stage, playerWon){
  Q.over = true;

  let heartResult = null;
  if(!playerWon){
    heartResult = loseHeartAndAnimate("levelHearts");
  }

  const banner = document.createElement("div");
  banner.style.textAlign = "center";
  banner.innerHTML = `
    <h2>${playerWon ? "You Reached The Wall" : "The Bot Got There First"}</h2>
    <button class="btn" id="qContinueBtn">${playerWon ? "Continue" : (heartResult === "sentback" ? "Continue" : "Try Again")}</button>
  `;
  stage.appendChild(banner);
  if(playerWon) fireConfetti();
  stage.querySelector("#qContinueBtn").addEventListener("click", ()=>{
    if(playerWon){
      completeLevel(2);
      backToHub();
    }else{
      if(heartResult === "sentback"){
        showOutOfHeartsScreen();
      }else{
        startQuoridorLevel(stage);
      }
    }
  });
}
