import { initialBoard, initialCastling } from './initial-state.js';
import {
	plusOne,
	minusOne,
	constantFunction,
	inRange,
	signChecker,
} from './math-stuff.js';

const saveGameBtn = document.getElementById('save-game-btn');

import { renderPiece } from './render-utils.js';

const blackCapturedContainer = document.querySelector('.black-captured');
const whiteCapturedContainer = document.querySelector('.white-captured');
const music = document.getElementById('music');
const checkDisplay = document.getElementById('check');
const signOutLink = document.getElementById('sign-out-link');
music.volume = 0.12;

let isGameOn = true;
let currentPlayer = 'white';
const board = initialBoard;
let check = false;
let checkDefense = [];
const castling = initialCastling;
const capturedPieces = {
	white: [],
	black: [],
};
const pieceStringToFunction = {
	pawn: pawn,
	rook: rook,
	knight: knight,
	bishop: bishop,
	queen: queen,
	king: king,
};
const pastMoves = [];

refreshDisplay();

function refreshDisplay() {
	if (isGameOn) {
		displayBoard();
		displayCapturedPieces();
	}
}

function displayBoard() {
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
	styleBoard();
}

function renderPlayable(position) {
	if (board[position].color === currentPlayer) {
		const positionEl = document.getElementById(position);
		positionEl.addEventListener('click', () => {
			refreshDisplay();
			let moves = pieceStringToFunction[board[position].piece](position);
			if (check) {
				moves = performIntersection(moves, checkDefense);
			}
			for (let move of moves) {
				if (move.condition === 'empty') {
					setMoveButton(position, move.space, 'move');
				}
				if (move.condition === 'enemy') {
					setMoveButton(position, move.space, 'attack');
				}
				if (move.condition === 'en passant') {
					setMoveButton(position, move.space, 'enPassant');
				}
				if (move.condition === 'castling') {
					setCastlingButton(position, move.space);
				}
			}
		});
	}
}

function setMoveButton(currentPosition, targetPosition, moveType) {
	const targetPositionEl = document.getElementById(targetPosition);
	const saveCurrentPiece = board[currentPosition];
	const saveTargetPiece = board[targetPosition];
	let saveEnemyPiece;
	board[currentPosition] = false;
	board[targetPosition] = saveCurrentPiece;
	let enemyPosition;

	const moveOptions = {
		move: {
			display: 'o',
			sound: movePieceSound,
		},
		attack: {
			display: `x${saveTargetPiece.image}`,
			sound: takePieceSound,
		},
		enPassant: {
			display: 'x',
			sound: takePieceSound,
		},
	};

	if (moveType === 'enPassant') {
		const findEnemy = {
			white: minusOne,
			black: plusOne,
		};
		const enemyX = stringToCoords(targetPosition)[0];
		const enemyY = findEnemy[currentPlayer](
			stringToCoords(targetPosition)[1]
		);
		enemyPosition = coordsToString([enemyX, enemyY]);
		saveEnemyPiece = board[enemyPosition];
		board[enemyPosition] = false;
	}

	if (isKingSafe()) {
		targetPositionEl.textContent = moveOptions[moveType].display;
		targetPositionEl.addEventListener('click', () => {
			saveGameBtn.classList.remove('game-saved');
			saveGameBtn.classList.add('save-game-btn');
			saveGameBtn.textContent = 'SAVE GAME';
			board[currentPosition] = false;
			board[targetPosition] = saveCurrentPiece;
			if (moveType === 'enPassant') board[enemyPosition] = false;
			if (saveCurrentPiece.piece === 'king') {
				for (let rook in castling[currentPlayer]) {
					castling[currentPlayer][rook].isActive = false;
				}
			}
			if (saveCurrentPiece.piece === 'rook') {
				for (let rook in castling[currentPlayer]) {
					if (currentPosition === rook) {
						castling[currentPlayer][rook].isActive = false;
					}
				}
			}
			if (moveType === 'attack') {
				capturedPieces[saveTargetPiece.color].push(saveTargetPiece);
			}
			if (moveType === 'enPassant') {
				capturedPieces[saveEnemyPiece.color].push(saveEnemyPiece);
			}
			pastMoves.push([currentPosition, targetPosition, moveType]);
			moveOptions[moveType].sound();
			changePlayer();
			refreshDisplay();
			checkDefense = [];
			check = false;
			checkDisplay.textContent = '';
			checkChecker();
		});
	}
	board[currentPosition] = saveCurrentPiece;
	board[targetPosition] = saveTargetPiece;
	if (moveType === 'enPassant') board[enemyPosition] = saveEnemyPiece;
}

function setCastlingButton(currentPosition, targetPosition) {
	const castlingOptions = {
		a1: {
			rook: 'c1',
			king: 'b1',
		},
		h1: {
			rook: 'f1',
			king: 'g1',
		},
		a8: {
			rook: 'c8',
			king: 'b8',
		},
		h8: {
			rook: 'f8',
			king: 'g8',
		},
	};

	const kingPiece = {
		white: {
			color: 'white',
			piece: 'king',
			image: '♔',
		},
		black: {
			color: 'black',
			piece: 'king',
			image: '♚',
		},
	};

	const rookPiece = {
		white: {
			color: 'white',
			piece: 'rook',
			image: '♖',
		},
		black: {
			color: 'black',
			piece: 'rook',
			image: '♜',
		},
	};
	const saveKingPosition = findKing();
	const rookSpot = castlingOptions[targetPosition].rook;
	const kingSpot = castlingOptions[targetPosition].king;
	board[saveKingPosition] = false;
	board[targetPosition] = false;
	board[rookSpot] = rookPiece[currentPlayer];
	board[kingSpot] = kingPiece[currentPlayer];
	const castlingSpaces =
		castling[currentPlayer][targetPosition].spacesBetween;
	const castlingSpacesArr = castlingSpaces.map((position) => position.space);
	const areSpacesSafe = castlingSpacesArr.reduce(
		(prev, current) => isSpaceSafe(current) && prev,
		true
	);
	if (!check && areSpacesSafe) {
		const kingSpotEl = document.getElementById(kingSpot);
		kingSpotEl.textContent = 'o';
		kingSpotEl.addEventListener('click', () => {
			saveGameBtn.classList.remove('game-saved');
			saveGameBtn.classList.add('save-game-btn');
			saveGameBtn.textContent = 'SAVE GAME';
			for (let rook in castling[currentPlayer]) {
				castling[currentPlayer][rook].isActive = false;
			}
			board[saveKingPosition] = false;
			board[targetPosition] = false;
			board[rookSpot] = rookPiece[currentPlayer];
			board[kingSpot] = kingPiece[currentPlayer];
			movePieceSound();
			changePlayer();
			refreshDisplay();
			checkChecker();
			pastMoves.push([currentPosition, targetPosition, 'castling']);
		});
	}
	board[saveKingPosition] = kingPiece[currentPlayer];
	board[targetPosition] = rookPiece[currentPlayer];
	board[rookSpot] = false;
	board[kingSpot] = false;
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

function knight(position) {
	let moves = [];
	const coords = stringToCoords(position);
	let x = coords[0];
	let y = coords[1];

	if (inspectCoords(x + 1, y + 2)) {
		moves.push(inspectCoords(x + 1, y + 2));
	}
	if (inspectCoords(x + 1, y - 2)) {
		moves.push(inspectCoords(x + 1, y - 2));
	}
	if (inspectCoords(x + 2, y + 1)) {
		moves.push(inspectCoords(x + 2, y + 1));
	}
	if (inspectCoords(x + 2, y - 1)) {
		moves.push(inspectCoords(x + 2, y - 1));
	}
	if (inspectCoords(x - 1, y + 2)) {
		moves.push(inspectCoords(x - 1, y + 2));
	}
	if (inspectCoords(x - 1, y - 2)) {
		moves.push(inspectCoords(x - 1, y - 2));
	}
	if (inspectCoords(x - 2, y + 1)) {
		moves.push(inspectCoords(x - 2, y + 1));
	}
	if (inspectCoords(x - 2, y - 1)) {
		moves.push(inspectCoords(x - 2, y - 1));
	}
	return moves;
}

function king(position) {
	let moves = [];

	const coords = stringToCoords(position);
	let x = coords[0];
	let y = coords[1];

	if (inspectCoords(x, y + 1)) {
		moves.push(inspectCoords(x, y + 1));
	}
	if (inspectCoords(x, y - 1)) {
		moves.push(inspectCoords(x, y - 1));
	}
	if (inspectCoords(x + 1, y + 1)) {
		moves.push(inspectCoords(x + 1, y + 1));
	}
	if (inspectCoords(x + 1, y - 1)) {
		moves.push(inspectCoords(x + 1, y - 1));
	}
	if (inspectCoords(x + 1, y)) {
		moves.push(inspectCoords(x + 1, y));
	}
	if (inspectCoords(x - 1, y + 1)) {
		moves.push(inspectCoords(x - 1, y + 1));
	}
	if (inspectCoords(x - 1, y - 1)) {
		moves.push(inspectCoords(x - 1, y - 1));
	}
	if (inspectCoords(x - 1, y)) {
		moves.push(inspectCoords(x - 1, y));
	}
	for (let rookPosition in castling[currentPlayer]) {
		if (
			castling[currentPlayer][rookPosition].isActive &&
			board[rookPosition].piece === 'rook'
		) {
			const castlingSpaces = performIntersection(
				rook(rookPosition),
				castling[currentPlayer][rookPosition].spacesBetween
			);
			if (
				JSON.stringify(castlingSpaces) ===
				JSON.stringify(
					castling[currentPlayer][rookPosition].spacesBetween
				)
			) {
				moves.push({ space: rookPosition, condition: 'castling' });
			}
		}
	}
	return moves;
}

function pawn(position) {
	let moves = [];
	const coords = stringToCoords(position);
	let x = coords[0];
	let y = coords[1];
	let pawnSpecs = {
		white: {
			moveDirection: plusOne,
			startRank: 2,
			enPassantRank: 5,
		},
		black: {
			moveDirection: minusOne,
			startRank: 7,
			enPassantRank: 4,
		},
	};
	function doubleMove(number) {
		return pawnSpecs[currentPlayer].moveDirection(
			pawnSpecs[currentPlayer].moveDirection(number)
		);
	}

	if (y === pawnSpecs[currentPlayer].enPassantRank) {
		const prevMove = pastMoves.slice(-1)[0];
		const prevMovePiece = board[prevMove[1]].piece;
		const prevMoveX = stringToCoords(prevMove[1])[0];
		const prevMoveY = stringToCoords(prevMove[1])[1];
		const prevMoveDistance = Math.abs(
			prevMoveY - stringToCoords(prevMove[0])[1]
		);
		if (
			prevMovePiece === 'pawn' &&
			prevMoveDistance === 2 &&
			Math.abs(prevMoveX - x) === 1
		) {
			const passantMoveTo = coordsToString([
				prevMoveX,
				pawnSpecs[currentPlayer].moveDirection(prevMoveY),
			]);
			moves.push({
				space: passantMoveTo,
				condition: 'en passant',
			});
		}
	}
	if (inRange(pawnSpecs[currentPlayer].moveDirection(y))) {
		if (inRange(x - 1)) {
			const test = coordsToString([
				x - 1,
				pawnSpecs[currentPlayer].moveDirection(y),
			]);

			if (
				inspectSpace(test) &&
				inspectSpace(test).condition === 'enemy'
			) {
				moves.push(inspectSpace(test));
			}
		}
		if (inRange(x + 1)) {
			const test = coordsToString([
				x + 1,
				pawnSpecs[currentPlayer].moveDirection(y),
			]);
			if (
				inspectSpace(test) &&
				inspectSpace(test).condition === 'enemy'
			) {
				moves.push(inspectSpace(test));
			}
		}
		if (
			inspectSpace(
				coordsToString([x, pawnSpecs[currentPlayer].moveDirection(y)])
			) &&
			inspectSpace(
				coordsToString([x, pawnSpecs[currentPlayer].moveDirection(y)])
			).condition === 'empty'
		) {
			moves.push(
				inspectSpace(
					coordsToString([
						x,
						pawnSpecs[currentPlayer].moveDirection(y),
					])
				)
			);
			if (
				y === pawnSpecs[currentPlayer].startRank &&
				inspectSpace(coordsToString([x, doubleMove(y)])) &&
				inspectSpace(coordsToString([x, doubleMove(y)])).condition ===
					'empty'
			) {
				moves.push(inspectSpace(coordsToString([x, doubleMove(y)])));
			}
		}
	}
	return moves;
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

function checkChecker() {
	if (!isKingSafe()) {
		check = true;
		checkDisplay.textContent = "You're in check";
		setCheckDefense();
		if (checkDefense.length === 0) {
			checkDisplay.textContent = 'Checkmate';
			isGameOn = false;
		}
	}
}

function setCheckDefense() {
	let kingPosition = findKing(currentPlayer);
	const threatMoves = threatsToSpace(kingPosition);
	for (let position in board) {
		if (position === kingPosition) {
			const kingMoves = king(position);
			const saveKing = board[position];
			board[position] = false;
			for (let move of kingMoves) {
				if (isSpaceSafe(move.space)) {
					checkDefense.push(move);
				}
				board[position] = saveKing;
			}
		} else if (board[position].color === currentPlayer) {
			const potentialDefenseMoves =
				pieceStringToFunction[board[position].piece](position);
			const effectiveDefenseMoves = performIntersection(
				threatMoves,
				potentialDefenseMoves
			);
			const defenseMoves = checkDefense.concat(effectiveDefenseMoves);
			checkDefense = defenseMoves;
		}
	}
}

function threatsToSpace(space) {
	let threatMoves = [];
	const savePiece = board[space];
	board[space] = {
		color: currentPlayer,
	};
	const spaceX = stringToCoords(space)[0];
	const spaceY = stringToCoords(space)[1];
	changePlayer();
	for (let position in board) {
		if (board[position].color === currentPlayer) {
			const checkArray =
				pieceStringToFunction[board[position].piece](position);
			for (let move of checkArray) {
				if (move.space === space) {
					if (
						board[position].piece === 'pawn' ||
						board[position].piece === 'knight'
					) {
						threatMoves.push({
							space: position,
							condition: 'enemy',
						});
						// the following is give this function generality outside of just check
						// I'd like to use it for castling to see if the spaces between king and
						// rook are threatened by anything, including a king
					} else if (board[position].piece === 'king') {
						threatMoves.push({
							space: position,
							condition: 'king',
						});
					} else {
						const threatX = stringToCoords(position)[0];
						const threatY = stringToCoords(position)[1];
						const deltaXFunction = signChecker(threatX - spaceX);
						const deltaYFunction = signChecker(threatY - spaceY);
						changePlayer();
						const newThreatMoves = threatMoves.concat(
							continueMove(space, deltaXFunction, deltaYFunction)
						);
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

function isKingSafe() {
	const theKing = findKing(currentPlayer);
	return threatsToSpace(theKing).length === 0;
}

function findKing() {
	for (let position in board) {
		if (
			pieceStringToFunction[board[position].piece] === king &&
			board[position].color === currentPlayer
		) {
			return position;
		}
	}
}

function isSpaceSafe(position) {
	return threatsToSpace(position).length === 0;
}

function stringToCoords(string) {
	const letterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	const splitString = string.split('');
	const coords = [
		letterArray.indexOf(splitString[0]) + 1,
		Number(splitString[1]),
	];
	return coords;
}

function coordsToString(coords) {
	const letterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	coords[0] = letterArray[coords[0] - 1];
	return coords.join('');
}

function inspectSpace(space) {
	if (!board[space]) {
		return { space: space, condition: 'empty' };
	} else if (board[space].color !== currentPlayer) {
		return { space: space, condition: 'enemy' };
	}
}

function inspectCoords(x, y) {
	if (inRange(x) && inRange(y)) {
		const test = coordsToString([x, y]);
		if (inspectSpace(test)) {
			return inspectSpace(test);
		}
	}
}

function changePlayer() {
	if (currentPlayer === 'white') {
		currentPlayer = 'black';
	} else {
		currentPlayer = 'white';
	}
}

function performIntersection(arr1, arr2) {
	const set = new Set();

	for (const move of arr1) {
		set.add(move.space + move.condition);
	}

	const results = [];

	for (const move of arr2) {
		if (set.has(move.space + move.condition)) {
			results.push(move);
		}
	}

	return results;
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
		if (counter % 8) {
			isWhite = !isWhite;
		}
	}
}

function displayCapturedPieces() {
	whiteCapturedContainer.textContent = '';
	blackCapturedContainer.textContent = '';
	for (let piece of capturedPieces.white) {
		const renderedPiece = renderPiece(piece);
		whiteCapturedContainer.append(renderedPiece);
	}
	for (let piece of capturedPieces.black) {
		const renderedPiece = renderPiece(piece);
		blackCapturedContainer.append(renderedPiece);
	}
}

saveGameBtn.addEventListener('click', async () => {
	const response = await saveGame(
		id,
		board,
		capturedPieces.black,
		capturedPieces.white
	);
	saveGameBtn.textContent = 'GAME SAVED';
	saveGameBtn.classList.remove('save-game-btn');
	saveGameBtn.classList.add('game-saved');
});

function movePieceSound() {
	var audio = new Audio('./assets/chess-move.wav');
	audio.play();
}

function takePieceSound() {
	var audio = new Audio('./assets/take-piece.mp3');
	audio.play();
}
