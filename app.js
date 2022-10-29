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




const letterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];


let kings = {
    white: 'e1',
    black: 'e8'
}

let pastMoves = ['ready', 'set'];

displayNewState();

function displayNewState() {
  displayBoard();
  displayPrisoners();
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
      if (game) {
          positionEl.addEventListener('click', () => {
              displayBoard();
              let moves = stringToFunction[board[position].piece](position);         
              if (board[position].piece === 'king') {
                  if (currentPlayer === 'white' && whiteKingSideCastling === true && board.f1 === false && board.g1 === false && board.h1.piece === 'rook') {
                      moveButton('e1', 'g1')
                  }
                  // white castling queen side
                  if (currentPlayer === 'white' && whiteQueenSideCastling === true && board.a1.piece === 'rook' && board.b1 === false && board.c1 === false && board.d1 === false) {
                      moveButton('e1', 'c1')
                  }
                  // black castling king side
                  if (currentPlayer === 'black' && blackKingSideCastling === true && board.f8 === false && board.g8 === false && board.h8.piece === 'rook') {
                      moveButton('e8', 'g8')
                  }  
                  // black castling queen side
                  if (currentPlayer === 'black' && blackQueenSideCastling === true && board.a8.piece === 'rook' && board.b8 === false && board.c8 === false && board.d8 === false) {
                      moveButton('e8', 'c8')
                  } 
                  let safeMoves = [];
                  for (let move of moves) {
                      if (checkChecker(move.space)) {
                          safeMoves.push(move);
                      }
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
}

function enPassantButton(currentPosition, targetPosition) {
  const targetPositionEl = document.getElementById(targetPosition);
  targetPositionEl.textContent = 'x';
  const findEnemy = {
    white: minusOne,
    black: plusOne
  }
  const enemyX = stringToCoords(targetPosition)[0];
  const enemyY = findEnemy[currentPlayer](stringToCoords(targetPosition)[1]);
  const enemyPosition = coordsToString([enemyX, enemyY]);
  const saveCurrentPiece = board[currentPosition];
  const saveEnemyPiece = board[enemyPosition];
  
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

//promotion first, then castling

function moveButton(currentPosition, targetPosition) {
    const targetPositionEl = document.getElementById(targetPosition);
    targetPositionEl.textContent = 'o';
    const saveCurrentPiece = board[currentPosition];
    const saveTargetPiece = board[targetPosition];
    targetPositionEl.addEventListener('click', () => {
        saveGameBtn.classList.remove('game-saved');
        saveGameBtn.classList.add('save-game-btn');
        saveGameBtn.textContent = 'SAVE GAME';
        movePieceSound();
//complete check conditions for edge cases
        let spot7 = '';
        let spot8 = '';
        spot7 = stringToCoords(currentPosition);
        spot8 = stringToCoords(targetPosition);

        if (board[targetPosition].piece === 'king')  {
            if (currentPlayer === 'white') {
                if (targetPosition != 'g1') {
                    whiteKingSideCastling = false;
                    whiteQueenSideCastling = false;
                }
            }
        }
        if (board[targetPosition].piece === 'king')  {
            if (currentPlayer === 'black') {
                if (targetPosition != 'c8') {
                    blackKingSideCastling = false;
                    blackQueenSideCastling = false;
                }
            }
        }

    // make castling impossible if white or black rooks move
    // need to clarify which rook has moved, currently if any white rook moves white can no longer castle (vice versa)
        if (board[targetPosition].piece === 'rook')  {
            if (currentPlayer === 'white') {
                whiteKingSideCastling = false;
                whiteQueenSideCastling = false;
            }
        }
        if (board[targetPosition].piece === 'rook')  {
            if (currentPlayer === 'black') {
                blackKingSideCastling = false;
                blackQueenSideCastling = false;
            }
        }
        
        if (board[currentPosition].piece === 'pawn' && spot7[1] === 7 && spot8[1] === 8) {
            let test = [];
            if (currentPlayer === 'white') {
                test = { 
                    color: 'white',
                    piece: 'queen',
                    image: '♕'
                    } 
                    board[currentPosition] = false;
                    board[targetPosition] = test;
            }
        } 
        if (board[currentPosition].piece === 'pawn' && spot7[1] === 2 && spot8[1] === 1) {
            let test = [];
            if (currentPlayer === 'black') {
                test = { 
                    color: 'black',
                    piece: 'queen',
                    image: '♛'
                    } 
                    board[currentPosition] = false;
                    board[targetPosition] = test;
            }
        }
            // pastMoves.push([currentPosition, targetPosition]);  
            // const savePiece = board[currentPosition];
            // board[currentPosition] = false;
            // board[targetPosition] = savePiece;
            // console.log(board[targetPosition], savePiece)
        if (whiteKingSideCastling === true && currentPosition === 'e1' && targetPosition === 'g1') {
            board['f1'] = board['h1']
            board['h1'] = false;
            whiteKingSideCastling = false;
        }
        if (whiteQueenSideCastling === true && currentPosition === 'e1' && targetPosition === 'c1') {
            board['d1'] = board['a1']
            board['a1'] = false;
            whiteQueenSideCastling = false;
        }
        if (blackKingSideCastling === true && currentPosition === 'e8' && targetPosition === 'g8') {
            board['f8'] = board['h8']
            board['h8'] = false;
            blackKingSideCastling = false;
        }
        if (blackQueenSideCastling === true && currentPosition === 'e8' && targetPosition === 'c8') {
            board['d8'] = board['a8']
            board['a8'] = false;
            blackQueenSideCastling = false;
        }
        else {
        board[currentPosition] = false;
        board[targetPosition] = saveCurrentPiece;
        }
        // the  below should go after all edge conditions, maybe? Or not
        if (partialKingCheck()) {
            changePlayer();
            displayBoard();
            checkDefense = [];
            check = false;
            checkDisplay.textContent = '';
            fullCheck();
            pastMoves.push([currentPosition, targetPosition]); 

        } else {
            board[currentPosition] = saveCurrentPiece;
            board[targetPosition] = saveTargetPiece;
            displayBoard();
        }

    })
}

















function attackButton(currentPosition, targetPosition) {
    const saveCurrentPiece = board[currentPosition];
    const saveTargetPiece = board[targetPosition];
    const targetPositionEl = document.getElementById(targetPosition);
    targetPositionEl.textContent = `x${board[targetPosition].image}`;
    
    targetPositionEl.addEventListener('click', () => {
        saveGameBtn.classList.remove('game-saved');
        saveGameBtn.classList.add('save-game-btn');
        saveGameBtn.textContent = 'SAVE GAME';
        takePieceSound();

        let spot7 = '';
        let spot8 = '';
        spot7 = stringToCoords(currentPosition);
        spot8 = stringToCoords(targetPosition); 
        const savePiece = board[targetPosition];
        if (board[currentPosition].piece === 'pawn' && spot7[1] === 7 && spot8[1] === 8) {
            console.log(currentPlayer);
            let test = [];
            if (currentPlayer === 'white') {
                console.log('in if')
                test = { 
                    color: 'white',
                    piece: 'queen',
                    image: '♕'
                    } 
                // console.log(test);
                // console.log(currentPosition);
                // console.log(targetPosition);
                board[currentPosition] = false;
                board[targetPosition] = test;
            }
        } 
        else if (board[currentPosition].piece === 'pawn' && spot7[1] === 2 && spot8[1] === 1) {
            console.log('in if')
            let test = [];
            if (currentPlayer === 'black') {
                test = { 
                    color: 'black',
                    piece: 'queen',
                    image: '♛'
                    } 
                board[currentPosition] = false;
                board[targetPosition] = test;
            }
        } else {
            board[targetPosition] = board[currentPosition];
            board[currentPosition] = false;}   
        if (partialKingCheck()) {
            console.log(targetPosition)
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
        } else {
            board[currentPosition] = saveCurrentPiece;
            board[targetPosition] = saveTargetPiece;
        }
    })
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
    const splitString = string.split('');
    const coords = [letterArray.indexOf(splitString[0])+1, Number(splitString[1])]
    return coords;
}

function coordsToString(coords) {
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

function partialKingCheck() {
    const theKing = findKing(currentPlayer);
    return partialCheck(theKing).length === 0
}

function findKing(color) {
    for (let position in board) {


        if (stringToFunction[board[position].piece] === king

            && board[position].color === color) {
            
            return position;
        }

    }
}

function partialCheck(space) {
    let threatMoves = [];
    const savePiece = board[space];
    board[space] = {
        color: currentPlayer,
        piece: 'pawn',
        image: '♟'
        }
    const kingX = stringToCoords(space)[0];
    const kingY = stringToCoords(space)[1];

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
                            const deltaXFunction = polarityChecker(threatX-kingX);
                            const deltaYFunction = polarityChecker(threatY-kingY);
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


function checkChecker(position) {
    return partialCheck(position).length === 0;
}


function fullCheck() {
    let kingPosition = findKing(currentPlayer);
    let defenseMoves = [];
    let kingEvasionMoves = [];
    const threatMoves = partialCheck(kingPosition);
    if (threatMoves.length > 0) {
        check = true;
        
        checkDisplay.textContent = "You're in check";
        for (let position in board) {


            if (position === kingPosition) {
                const kingMoves = king(position);
                for (let move of kingMoves) {
                    if (checkChecker(move.space)) {
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