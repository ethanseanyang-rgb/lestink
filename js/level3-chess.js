/* ============================================================
   LEVEL 3 — THE CHESS TABLE
   Player is always White. Bot plays mostly random legal moves
   with a mild bias toward free captures — this plays out
   around ~200 elo strength.
   ============================================================ */

const PIECE_UNICODE = {
  p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚"
};

let CHESS_GAME = null;
let chessSelected = null;
let chessStageRef = null;

function startChessLevel(stage){
  chessStageRef = stage;
  CHESS_GAME = new Chess();
  chessSelected = null;
  renderChessStage(stage);
}

function renderChessStage(stage){
  stage.innerHTML = `
    <div id="chessBoard"></div>
    <div id="chessStatus">Your move — you play White.</div>
    <button class="btn ghost" id="chessResignBtn">Resign Attempt</button>
  `;
  drawChessBoard(stage);
  stage.querySelector("#chessResignBtn").addEventListener("click", ()=>{
    chessAttemptEnded(stage, false, "Attempt abandoned.");
  });
}

function drawChessBoard(stage){
  const boardEl = stage.querySelector("#chessBoard");
  boardEl.innerHTML = "";
  const board = CHESS_GAME.board(); // board()[0] = rank 8 ... board()[7] = rank 1

  let legalTargets = [];
  if(chessSelected){
    const moves = CHESS_GAME.moves({square: chessSelected, verbose:true});
    legalTargets = moves.map(m=>m.to);
  }

  for(let rank=0; rank<8; rank++){
    for(let file=0; file<8; file++){
      const sq = document.createElement("div");
      const isLight = (rank+file) % 2 === 0;
      sq.className = "c-sq " + (isLight ? "light":"dark");
      const fileLetter = "abcdefgh"[file];
      const rankNumber = 8 - rank;
      const squareName = fileLetter + rankNumber;
      sq.dataset.square = squareName;

      const piece = board[rank][file];
      if(piece){
        const span = document.createElement("span");
        span.className = "piece " + (piece.color === "w" ? "c-white-piece" : "c-black-piece");
        span.textContent = PIECE_UNICODE[piece.type];
        sq.appendChild(span);
      }

      if(squareName === chessSelected) sq.classList.add("selected");
      if(legalTargets.includes(squareName)){
        sq.classList.add(piece ? "capturable" : "movable");
      }

      sq.addEventListener("click", ()=> onChessSquareClick(squareName, stage));
      boardEl.appendChild(sq);
    }
  }
}

function onChessSquareClick(squareName, stage){
  if(CHESS_GAME.game_over()) return;
  if(CHESS_GAME.turn() !== "w") return; // wait for bot

  const piece = CHESS_GAME.get(squareName);

  if(chessSelected){
    const moves = CHESS_GAME.moves({square: chessSelected, verbose:true});
    const match = moves.find(m=>m.to === squareName);
    if(match){
      CHESS_GAME.move({from: chessSelected, to: squareName, promotion:"q"});
      chessSelected = null;
      drawChessBoard(stage);
      afterChessPlayerMove(stage);
      return;
    }
    if(piece && piece.color === "w"){
      chessSelected = squareName;
      drawChessBoard(stage);
      return;
    }
    chessSelected = null;
    drawChessBoard(stage);
    return;
  }

  if(piece && piece.color === "w"){
    chessSelected = squareName;
    drawChessBoard(stage);
  }
}

function afterChessPlayerMove(stage){
  if(checkChessGameOver(stage)) return;
  stage.querySelector("#chessStatus").textContent = "Bot is thinking...";
  setTimeout(()=> chessBotMove(stage), 500);
}

function chessBotMove(stage){
  if(CHESS_GAME.game_over()) return;
  const moves = CHESS_GAME.moves({verbose:true});
  if(moves.length === 0) return;

  const captures = moves.filter(m => m.flags.includes("c") || m.flags.includes("e"));
  let chosen;
  if(captures.length > 0 && Math.random() < 0.35){
    chosen = captures[Math.floor(Math.random()*captures.length)];
  }else{
    chosen = moves[Math.floor(Math.random()*moves.length)];
  }
  CHESS_GAME.move({from: chosen.from, to: chosen.to, promotion: chosen.promotion || "q"});
  drawChessBoard(stage);

  if(checkChessGameOver(stage)) return;
  stage.querySelector("#chessStatus").textContent = "Your move — you play White.";
}

function checkChessGameOver(stage){
  if(!CHESS_GAME.game_over()) return false;

  if(CHESS_GAME.in_checkmate()){
    const winnerIsPlayer = CHESS_GAME.turn() === "b"; // black to move & mated => white (player) won
    chessAttemptEnded(stage, winnerIsPlayer, winnerIsPlayer ? "Checkmate — you win." : "Checkmate — the bot wins.");
  }else{
    chessAttemptEnded(stage, false, "Game drawn — a win is required to clear this stage.");
  }
  return true;
}

function chessAttemptEnded(stage, playerWon, message){
  const status = stage.querySelector("#chessStatus");
  if(status) status.textContent = message;

  let heartResult = null;
  if(!playerWon){
    heartResult = loseHeartAndAnimate("levelHearts");
  }

  const banner = document.createElement("div");
  banner.style.textAlign = "center";
  banner.innerHTML = `<button class="btn" id="chessContinueBtn">${playerWon ? "Continue" : (heartResult === "sentback" ? "Continue" : "Try Again")}</button>`;
  stage.appendChild(banner);
  if(playerWon) fireConfetti();
  stage.querySelector("#chessContinueBtn").addEventListener("click", ()=>{
    if(playerWon){
      completeLevel(3);
      backToHub();
    }else{
      if(heartResult === "sentback"){
        showOutOfHeartsScreen();
      }else{
        startChessLevel(stage);
      }
    }
  });
}
