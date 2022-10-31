import { initialBoard } from "./initial-state.js";

const saveGameBtn = document.getElementById('save-game-btn');

import { renderCapturedBlack, renderCapturedwhite } from "./render-utils.js";

const blackCapturedContainer = document.querySelector('.black-captured')
const whiteCapturedContainer = document.querySelector('.white-captured')
const music = document.getElementById('music');
const checkDisplay = document.getElementById('check');
const signOutLink = document.getElementById('sign-out-link');

let whiteCaptured = [];
let blackCaptured = [];
let whiteKingSideCastling = true;
let whiteQueenSideCastling = true;
let blackKingSideCastling = true;
let blackQueenSideCastling = true;
let check = false;
let game = true;
let checkDefense = [];
let currentPlayer = 'white';



music.volume = .12;


// const response = await getGameId();
// console.log(response);


// console.table(boardState);

let board = initialBoard;


const stringToFunction = {
    'pawn': pawn,
    'rook': rook,
    'knight': knight,
    'bishop': bishop,
    'queen': queen,
    'king': king
}






let kings = {
    white: 'e1',
    black: 'e8'
}

let pastMoves = ['ready', 'set'];

displayNewState();

function displayNewState() {
  if (game) {
    displayBoard();
    displayPrisoners();
  }
}

function displayBoard() {
  displayNewBoardState();
  styleBoard();
}

function styleBoard() {
  let isWhite = false;
  let counter = 0;
  for (const position in board) {
    const positionEl = document.getElementById(position);
    positionEl.classList.add('square');
    if (isWhite) {
      positionEl.classList.add('white');
    } else {
      positionEl.classList.add('black');
    }
    counter++;
    if (counter%8) {
      isWhite = !isWhite;
    }
  }    
}

function displayNewBoardState() {
  for (const position in board) {
    const getPosition = document.getElementById(position);
    const newPosition = document.createElement('button');
    newPosition.id = position;
    getPosition.replaceWith(newPosition);
    if (board[position]) {
      newPosition.textContent = `${board[position].image}`;
      renderPlayable(position);
    }
  }
}    

function displayPrisoners() {
  blackCapturedContainer.textContent = '';
  whiteCapturedContainer.textContent = '';
  displayBlackCaptured();
  displayWhiteCaptured();
}


function renderPlayable(position) {
  if (board[position].color === currentPlayer) {  
    const positionEl = document.getElementById(position);
          positionEl.addEventListener('click', () => {
              displayBoard();
              let moves = stringToFunction[board[position].piece](position);         
              if (board[position].piece === 'king') { 
                  let safeMoves = [];
                  for (let move of moves) {
                      const saveKing = board[position];
                      board[position] = false;
                      if (isSpaceThreatened(move.space)) {
                          safeMoves.push(move);
                      }
                      board[position] = saveKing;
                  }
                  moves = safeMoves;
                  console.log(moves);
              }
                  if (check && stringToFunction[board[position].piece] != king) {
                  moves = performIntersection(moves, checkDefense)
              }
              for (let move of moves) {
                  console.log(move)
                  if (move.condition === 'empty') {
                      moveButton(position, move.space);
                  }
                  if (move.condition === 'enemy') {
                      attackButton(position, move.space);
                  }
                  if (move.condition === 'en passant') {
                    enPassantButton(position, move.space)
                  }
              }
          });
      
    }  
}

function enPassantButton(currentPosition, targetPosition) {
  const targetPositionEl = document.getElementById(targetPosition);
  const findEnemy = {
    white: minusOne,
    black: plusOne
  }
  const enemyX = stringToCoords(targetPosition)[0];
  const enemyY = findEnemy[currentPlayer](stringToCoords(targetPosition)[1]);
  const enemyPosition = coordsToString([enemyX, enemyY]);
  const saveCurrentPiece = board[currentPosition];
  const saveEnemyPiece = board[enemyPosition];
  board[currentPosition] = false;
  board[targetPosition] = saveCurrentPiece;
  board[enemyPosition] = false;
  if (isKingSafe) {
    targetPositionEl.textContent = 'x';
    targetPositionEl.addEventListener('click', () => {
      takePieceSound();
      board[currentPosition] = false;
      board[targetPosition] = saveCurrentPiece;
      board[enemyPosition] = false;
      if (currentPlayer === 'white') {
        blackCaptured.push(saveEnemyPiece);
      } else {
        whiteCaptured.push(saveEnemyPiece);
      }
      changePlayer();
      displayNewState();
    })
  }
  board[currentPosition] = saveCurrentPiece;
  board[targetPosition] = false;
  board[enemyPosition] = saveEnemyPiece;
}

//promotion first, then castling

function moveButton(currentPosition, targetPosition) {
    const targetPositionEl = document.getElementById(targetPosition);
    const saveCurrentPiece = board[currentPosition];
    const saveTargetPiece = board[targetPosition];
    board[currentPosition] = false;
    board[targetPosition] = saveCurrentPiece;
    if (isKingSafe()) {
      targetPositionEl.textContent = 'o';
      targetPositionEl.addEventListener('click', () => {
        saveGameBtn.classList.remove('game-saved');
        saveGameBtn.classList.add('save-game-btn');
        saveGameBtn.textContent = 'SAVE GAME';
        board[currentPosition] = false;
        board[targetPosition] = saveCurrentPiece;
          movePieceSound();
          changePlayer();
          displayBoard();
          checkDefense = [];
          check = false;
          checkDisplay.textContent = '';
          fullCheck();
          pastMoves.push([currentPosition, targetPosition]);
      })
    board[currentPosition] = saveCurrentPiece;
    board[targetPosition] = saveTargetPiece;
    } else {
      board[currentPosition] = saveCurrentPiece;
      board[targetPosition] = saveTargetPiece;
      displayBoard();
    }
}

function attackButton(currentPosition, targetPosition) {
    const saveCurrentPiece = board[currentPosition];
    const saveTargetPiece = board[targetPosition];
    const targetPositionEl = document.getElementById(targetPosition);
    board[currentPosition] = false;
    board[targetPosition] = saveCurrentPiece;
    if (isKingSafe()) {
      targetPositionEl.textContent = `x${board[targetPosition].image}`;
      targetPositionEl.addEventListener('click', () => {
        saveGameBtn.classList.remove('game-saved');
        saveGameBtn.classList.add('save-game-btn');
        saveGameBtn.textContent = 'SAVE GAME';
        board[currentPosition] = false;
        board[targetPosition] = saveCurrentPiece;
        takePieceSound();   
        if (saveTargetPiece.color === 'white') {
            whiteCaptured.push(saveTargetPiece);
        } else {
            blackCaptured.push(saveTargetPiece);
        }
        pastMoves.push([currentPosition, targetPosition]); 
        changePlayer();
        displayBoard();
        checkDefense = [];
        check = false;
        fullCheck();
      })
    board[currentPosition] = saveCurrentPiece;
    board[targetPosition] = saveTargetPiece;  
    } else {
            board[currentPosition] = saveCurrentPiece;
            board[targetPosition] = saveTargetPiece;
        }
}


    
function pawn(position) {
    let moves = [];
    let pawnSpecs = {
      white: {
        moveDirection: plusOne,
        startRank: 2,
        enPassantRank: 5
      },
      black: {
        moveDirection: minusOne,
        startRank: 7,
        enPassantRank: 4
      }
    }
    const coords = stringToCoords(position);
    let x = coords[0];
    let y = coords[1];
    function doubleMove(number) {
      return pawnSpecs[currentPlayer].moveDirection(pawnSpecs[currentPlayer].moveDirection(number));    
    } 
    
    if (y === pawnSpecs[currentPlayer].enPassantRank) {
      const prevMove = pastMoves.slice(-1)[0];
      const prevMovePiece = board[prevMove[1]].piece;
      const prevMoveX = stringToCoords(prevMove[1])[0];
      const prevMoveY = stringToCoords(prevMove[1])[1];
      const prevMoveDistance = Math.abs(prevMoveY - stringToCoords(prevMove[0])[1]);
      if (
        prevMovePiece === 'pawn' 
        && prevMoveDistance === 2
        && Math.abs(prevMoveX - x) === 1
        ) {
          const passantMoveTo = coordsToString([prevMoveX, pawnSpecs[currentPlayer].moveDirection(prevMoveY)]);
          moves.push({
            space: passantMoveTo,
            condition: 'en passant'
          })
      }
    }
    if (inRange(pawnSpecs[currentPlayer].moveDirection(y))) {
        if (inRange(x-1)) {

            const test = coordsToString([x-1, pawnSpecs[currentPlayer].moveDirection(y)]);

            if (inspectSpace(test) && inspectSpace(test).condition  === 'enemy') {
                moves.push(inspectSpace(test));
            } 
        }
        if (inRange(x+1)) {
            const test = coordsToString([x+1, pawnSpecs[currentPlayer].moveDirection(y)]);
            if (inspectSpace(test) && inspectSpace(test).condition  === 'enemy') {
                moves.push(inspectSpace(test));
            }
        }
        if (
          inspectSpace(coordsToString([x, pawnSpecs[currentPlayer].moveDirection(y)])) 
          && inspectSpace(coordsToString([x, pawnSpecs[currentPlayer].moveDirection(y)])).condition === 'empty'
        ) { 
          moves.push(inspectSpace(coordsToString([x, pawnSpecs[currentPlayer].moveDirection(y)])));
          if (
            y === pawnSpecs[currentPlayer].startRank 
            && inspectSpace(coordsToString([x, doubleMove(y)])) 
            && inspectSpace(coordsToString([x, inspectSpace(coordsToString([x, doubleMove(y)]))])).condition === 'empty'
            ) {moves.push(inspectSpace(coordsToString([x, doubleMove(y)])))}
          }
    }
    
    return moves;
    
}  

function king(position) {
    let moves = [];

    const coords = stringToCoords(position);
    let x = coords[0];
    let y = coords[1];

    if (testSpace(x, y+1) ) {
        moves.push(testSpace(x, y+1))
    }
    if (testSpace(x, y-1)) {
        moves.push(testSpace(x, y-1))
    }
    if (testSpace(x+1, y+1)) {
        moves.push(testSpace(x+1, y+1))
    }
    if (testSpace(x+1, y-1)) {
        moves.push(testSpace(x+1, y-1))
    }
    if (testSpace(x+1, y)) {
        moves.push(testSpace(x+1, y))
    }
    if (testSpace(x-1, y+1)) {
        moves.push(testSpace(x-1, y+1))
    }
    if (testSpace(x-1, y-1)) {
        moves.push(testSpace(x-1, y-1))
    }
    if (testSpace(x-1, y)) {
        moves.push(testSpace(x-1, y))
    }
    
    return moves;
}

function knight(position) {
    let moves = [];
    const coords = stringToCoords(position);
    let x = coords[0];
    let y = coords[1];

    if (testSpace(x+1, y+2)) {
        moves.push(testSpace(x+1, y+2))
    }
    if (testSpace(x+1, y-2)) {
        moves.push(testSpace(x+1, y-2))
    }
    if (testSpace(x+2, y+1)) {
        moves.push(testSpace(x+2, y+1))
    }
    if (testSpace(x+2, y-1)) {
        moves.push(testSpace(x+2, y-1))
    }
    if (testSpace(x-1, y+2)) {
        moves.push(testSpace(x-1, y+2))
    }
    if (testSpace(x-1, y-2)) {
        moves.push(testSpace(x-1, y-2))
    }
    if (testSpace(x-2, y+1)) {
        moves.push(testSpace(x-2, y+1))
    }
    if (testSpace(x-2, y-1)) {
        moves.push(testSpace(x-2, y-1))
    }

    return moves;
}

function bishop(position) {
    let moves = [];
    moves = moves.concat(continueMove(position, minusOne, plusOne));
    moves = moves.concat(continueMove(position, plusOne, plusOne));
    moves = moves.concat(continueMove(position, minusOne, minusOne));
    moves = moves.concat(continueMove(position, plusOne, minusOne));
    return moves;
}

function rook(position) {
    let moves = [];

    moves = moves.concat(continueMove(position, constantFunction, plusOne));
    moves = moves.concat(continueMove(position, constantFunction, minusOne));
    moves = moves.concat(continueMove(position, plusOne, constantFunction));
    moves = moves.concat(continueMove(position, minusOne, constantFunction));
    
    return moves;
}

function queen(position) {
    let moves = bishop(position).concat(rook(position));
    return moves;
}

function testSpace(x, y) {
    if (inRange(x) && inRange(y)) {
        const test = coordsToString([x, y]);
        if (inspectSpace(test)) {
            return inspectSpace(test)
        }
    }
}


function continueMove(position, deltaXFunction, deltaYFunction) {
    let newMoves = [];
    const coords = stringToCoords(position);
    let x = coords[0];
    let y = coords[1];
    let open = true;
    let testX = deltaXFunction(x);
    let testY = deltaYFunction(y);
    while (open === true) {
        if (inRange(testX) && inRange(testY)) {
            const test = coordsToString([testX, testY]);
            if (inspectSpace(test)) {
                newMoves.push(inspectSpace(test));
                if (inspectSpace(test).condition === 'empty') {
                    testX = deltaXFunction(testX);
                    testY = deltaYFunction(testY);
                } else {
                    open = false;
                }
            } else {
                open = false;
            }
        } else {
            open = false;
        }
    }
    return newMoves;
}

function plusOne(a) {
    return a+1;
}

function minusOne(a) {
    return a-1;
}

function constantFunction(a) {
    return a;
}

function inRange(number) {
    if (0 < number && number <= 8) {
        return true;
    } else {
        return false;
    }
}


function stringToCoords(string) {
    const letterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const splitString = string.split('');
    const coords = [letterArray.indexOf(splitString[0])+1, Number(splitString[1])]
    return coords;
}

function coordsToString(coords) {
    const letterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    coords[0] = letterArray[coords[0]-1];
    return coords.join('');
}

function inspectSpace(space) {
    if (!board[space]) {
        return {'space': space, condition: 'empty'}
    } else if (board[space].color !== currentPlayer) {
        return {'space': space, condition: 'enemy'}
    } 
}

function changePlayer() {
    if (currentPlayer === 'white') {
        currentPlayer = 'black';
    } else {
        currentPlayer = 'white';
    }
    
}

function polarityChecker(number) {
    if (number < 0) {
        return minusOne;
    }
    if (number > 0) {
        return plusOne;
    } 
    else {
        return constantFunction;
    }
}

function isKingSafe() {
    const theKing = findKing(currentPlayer);
    return threatsToSpace(theKing).length === 0
}

function findKing(color) {
    for (let position in board) {


        if (stringToFunction[board[position].piece] === king

            && board[position].color === color) {
            
            return position;
        }

    }
}

function threatsToSpace(space) {
    let threatMoves = [];
    const savePiece = board[space];
    board[space] = {
        color: currentPlayer
        }
    const spaceX = stringToCoords(space)[0];
    const spaceY = stringToCoords(space)[1];

    changePlayer();
    for (let position in board) {
        if (board[position].color === currentPlayer) {
            const checkArray = stringToFunction[board[position].piece](position);

            for (let move of checkArray) {
                    if (move.space === space) {

                        if (board[position].piece === 'pawn' || board[position].piece === 'knight') {
                            threatMoves.push({space: position, condition: 'enemy'})
                        }
                        else if (board[position].piece != 'king') {


                            const threatX = stringToCoords(position)[0];
                            const threatY = stringToCoords(position)[1];
                            const deltaXFunction = polarityChecker(threatX-spaceX);
                            const deltaYFunction = polarityChecker(threatY-spaceY);
                            changePlayer();
                            const newThreatMoves = threatMoves.concat(continueMove(space, deltaXFunction, deltaYFunction)) 
                            threatMoves = newThreatMoves;
                            changePlayer();
                        }
                    }

            }
        }
    }
    changePlayer();
    board[space] = savePiece;
    return threatMoves;
    
}



function isSpaceThreatened(position) {
    return threatsToSpace(position).length === 0;
}


function fullCheck() {
    let kingPosition = findKing(currentPlayer);
    let defenseMoves = [];
    let kingEvasionMoves = [];
    const threatMoves = threatsToSpace(kingPosition);
    if (threatMoves.length > 0) {
        check = true;
        
        checkDisplay.textContent = "You're in check";
        for (let position in board) {


            if (position === kingPosition) {
                const kingMoves = king(position);
                for (let move of kingMoves) {
                    if (isSpaceThreatened(move.space)) {
                        kingEvasionMoves.push(move);
                    }
                }
            } else if (board[position].color === currentPlayer) {
                const newDefenseMoves = stringToFunction[board[position].piece](position);

                const solutionForCheck = performIntersection(threatMoves, newDefenseMoves);
                const sendDefenseMoves = defenseMoves.concat(solutionForCheck);
                defenseMoves = sendDefenseMoves;
            }
        }
        checkDefense = defenseMoves;
        const allDefense = kingEvasionMoves.concat(checkDefense);
        if (allDefense.length === 0 && threatMoves.length > 0) {
            checkDisplay.textContent = "Checkmate";
            game = false;
        } 
        else {
            displayBoard();
        } 
    }
}






function performIntersection(arr1, arr2) {

    const set = new Set();

    for(const move of arr1) {
        set.add(move.space + move.condition);
    }
    
    const results = [];
    
    for(const move of arr2) {
        if(set.has(move.space + move.condition)) {
            results.push(move);
        }
    }
    
    return results;
    

}





function displayBlackCaptured() {
    blackCapturedContainer.textContent = '';
        if (blackCaptured !== null) {
            for (let piece of blackCaptured) {
                const renderedBlack = renderCapturedBlack(piece);
                blackCapturedContainer.append(renderedBlack);
            }
        }
        
    }
    


function displayWhiteCaptured() {
    whiteCapturedContainer.textContent = '';
        if (whiteCaptured !== null) {
            for (let piece of whiteCaptured) {
                const renderedWhite = renderCapturedwhite(piece);
                whiteCapturedContainer.append(renderedWhite);
            }
        }
        
    }
    









saveGameBtn.addEventListener('click', async () => {
    const response = await saveGame(id, board, blackCaptured, whiteCaptured);
    saveGameBtn.textContent = 'GAME SAVED';
    saveGameBtn.classList.remove('save-game-btn');
    saveGameBtn.classList.add('game-saved');
    
    console.log(response);
});

function movePieceSound(){
    var audio = new Audio('./assets/chess-move.wav');
    audio.play();
}

function takePieceSound() {
    var audio = new Audio('./assets/take-piece.mp3');
    audio.play();
}