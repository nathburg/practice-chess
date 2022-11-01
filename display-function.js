import { 
  board, whiteCaptured, blackCaptured, whiteKingSideCastling,
  whiteQueenSideCastling, blackKingSideCastling, blackQueenSideCastling,
  check, game, checkDefense, currentPlayer
} from "./initial-state.js";

export function displayNewState() {
  displayBoard();
  displayPrisoners();
}

export function displayBoard() {
    let white = false;
    let counter = 0;

    for (const position in board) {
        const getPosition = document.getElementById(position);
        const newPosition = document.createElement('button');
        newPosition.id = position;
        newPosition.classList.add('square');
        if (white) {
            newPosition.classList.add('white');
        } else {
            newPosition.classList.add('black');
        }
        getPosition.replaceWith(newPosition);
        if (board[position]) {
            newPosition.textContent = `${board[position].image}`;
            if (board[position].color === currentPlayer) {
                renderPlayable(position);
            }
        }
        counter++;
        if (counter%8) {
          white = !white;
        }
    } 
}

export function displayPrisoners() {
  blackCapturedContainer.textContent = '';
  whiteCapturedContainer.textContent = '';
  displayBlackCaptured();
  displayWhiteCaptured();
}