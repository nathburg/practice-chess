import { getGameById, onSave, saveGame } from './fetch-utils.js';
import { initialBoard, initialCastling } from './initial-state.js';
import {
	plusOne,
	minusOne,
	constantFunction,
	inRange,
	signChecker,
} from './math-stuff.js';
import { renderPiece } from './render-utils.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const stateResp = await getGameById(id);

onSave(id, (payload) => {
	isGameOn = payload.new.game_state.isGameOn;
	currentPlayer = payload.new.game_state.currentPlayer;
	board = payload.new.game_state.board;
	castling = payload.new.game_state.castling;
	capturedPieces = payload.new.game_state.capturedPieces;
	pastMoves = payload.new.game_state.pastMoves;
	checkChecker();
	refreshDisplay();
});

//some unimportant stuff for supabase and other things
const blackCapturedContainer = document.querySelector('.black-captured');
const whiteCapturedContainer = document.querySelector('.white-captured');
const music = document.getElementById('music');
const checkDisplay = document.getElementById('check');
const signOutLink = document.getElementById('sign-out-link');
music.volume = 0.12;

//initial game state
let isGameOn = stateResp.game_state.isGameOn;
let currentPlayer = stateResp.game_state.currentPlayer;
let board = stateResp.game_state.board;
let castling = stateResp.game_state.castling;
let capturedPieces = stateResp.game_state.capturedPieces;
let pastMoves = stateResp.game_state.pastMoves;
let check = false;
let checkDefense = [];

let state = {
	currentPlayer,
	board,
	castling,
	capturedPieces,
	pastMoves,
};

function setState() {
	state.isGameOn = isGameOn;
	state.currentPlayer = currentPlayer;
	state.board = board;
	state.castling = castling;
	state.capturedPieces = capturedPieces;
	state.pastMoves = pastMoves;
}

const pieceStringToFunction = {
	pawn: pawn,
	rook: rook,
	knight: knight,
	bishop: bishop,
	queen: queen,
	king: king,
};

//starts things off
refreshDisplay();

/////// the following are for properly displaying board state and user functionality ///////

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
			// next line gives the moves that whatever piece is in this position can make here
			let moves = pieceStringToFunction[board[position].piece](position);
			if (check) {
				// this returns only moves that will get your king out of check
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
	// change board state and see if it puts your king in check
	// if king is safe, set button that will enact the move
	board[currentPosition] = false;
	board[targetPosition] = saveCurrentPiece;
	if (isKingSafe()) {
		targetPositionEl.textContent = moveOptions[moveType].display;
		targetPositionEl.addEventListener('click', async () => {
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
			setState();
			await saveGame(id, state);
			refreshDisplay();
			checkDefense = [];
			check = false;
			checkDisplay.textContent = '';
			checkChecker();
		});
	}
	// board state is reset
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

	const castlingSpaces =
		castling[currentPlayer][targetPosition].spacesBetween;
	const castlingSpacesArr = castlingSpaces.map((position) => position.space);
	const areSpacesSafe = castlingSpacesArr.reduce(
		(prev, current) => isSpaceSafe(current) && prev,
		true
	);
	if (!check && areSpacesSafe) {
		const rookSpot = castlingOptions[targetPosition].rook;
		const kingSpot = castlingOptions[targetPosition].king;
		const kingSpotEl = document.getElementById(kingSpot);
		kingSpotEl.textContent = 'o';
		kingSpotEl.addEventListener('click', async () => {
			for (let rook in castling[currentPlayer]) {
				castling[currentPlayer][rook].isActive = false;
			}
			board[currentPosition] = false;
			board[targetPosition] = false;
			board[rookSpot] = rookPiece[currentPlayer];
			board[kingSpot] = kingPiece[currentPlayer];
			movePieceSound();
			changePlayer();
			setState();
			await saveGame(id, state);
			refreshDisplay();
			checkChecker();
			pastMoves.push([currentPosition, targetPosition, 'castling']);
		});
	}
}

/////// game piece functions that return the piece's possible moves based on its position and the game state ///////

function bishop(position) {
	let moves = [];
	const moveArr = [
		[minusOne, plusOne],
		[plusOne, plusOne],
		[minusOne, minusOne],
		[plusOne, minusOne],
	];
	for (const move of moveArr) {
		moves = moves.concat(continueMove(position, move[0], move[1]));
	}
	return moves;
}

function rook(position) {
	let moves = [];
	const moveArr = [
		[constantFunction, plusOne],
		[constantFunction, minusOne],
		[plusOne, constantFunction],
		[minusOne, constantFunction],
	];
	for (const move of moveArr) {
		moves = moves.concat(continueMove(position, move[0], move[1]));
	}
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
	const moveArr = [
		[x + 1, y + 2],
		[x + 1, y - 2],
		[x + 2, y + 1],
		[x + 2, y - 1],
		[x - 1, y + 2],
		[x - 1, y - 2],
		[x - 2, y + 1],
		[x - 2, y - 1],
	];

	for (const move of moveArr) {
		if (inspectCoords(move[0], move[1])) {
			moves.push(inspectCoords(move[0], move[1]));
		}
	}
	return moves;
}

function king(position) {
	let moves = [];
	const coords = stringToCoords(position);
	let x = coords[0];
	let y = coords[1];
	const moveArr = [
		[x, y + 1],
		[x, y - 1],
		[x + 1, y + 1],
		[x + 1, y - 1],
		[x + 1, y],
		[x - 1, y + 1],
		[x - 1, y - 1],
		[x - 1, y],
	];

	for (const move of moveArr) {
		if (inspectCoords(move[0], move[1])) {
			moves.push(inspectCoords(move[0], move[1]));
		}
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
			// this checks that all spaces between king and rook are empty
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
	// en passant condition
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
		// attack conditions
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
		// move condition
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
			// double move condition
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

// tells if space is empty or has an enemy
// returns nothing if space has an ally piece
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

// generates moves in a straight line until it hits the edge of the board or another piece
function continueMove(position, deltaXFunction, deltaYFunction) {
	let newMoves = [];
	const coords = stringToCoords(position);
	let x = coords[0];
	let y = coords[1];
	let isOpen = true;
	let testX = deltaXFunction(x);
	let testY = deltaYFunction(y);
	while (isOpen === true) {
		if (inRange(testX) && inRange(testY)) {
			const test = coordsToString([testX, testY]);
			if (inspectSpace(test)) {
				newMoves.push(inspectSpace(test));
				if (inspectSpace(test).condition === 'empty') {
					testX = deltaXFunction(testX);
					testY = deltaYFunction(testY);
				} else {
					isOpen = false;
				}
			} else {
				isOpen = false;
			}
		} else {
			isOpen = false;
		}
	}
	return newMoves;
}

/////// functions for check conditions and ending game ///////

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
	let kingPosition = findKing();
	const threatMoves = threatsToSpace(kingPosition);
	for (let position in board) {
		if (position === kingPosition) {
			const kingMoves = king(position);
			const saveKing = board[position];
			// change state to simulate king move
			board[position] = false;
			for (let move of kingMoves) {
				if (isSpaceSafe(move.space) && move.condition != 'castling') {
					checkDefense.push(move);
				}
			}
			// reset state
			board[position] = saveKing;
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

// threatsToSpace is the trickiest function. It calls changePlayer four times to strategically
// change 'perspective' of what is an enemy. The goal is to see which enemy pieces threaten
// a space, meaning, if currentPlayer were the enemy's color, do any enemy pieces make
// a move on the space that inspectSpace would give the condition as 'enemy'? Then, if an enemy
// piece does threaten the space, that enemy's position is stored in threat moves as an enemy.
// This means threatMoves are actually stored from the 'perspective' of the defense (so that
// setCheckDefense can generate moves from the defense perspective and simply intersect those
// moves with threatMoves to see if there is any possible defense). For pawn and knight this is
// done manually, but for bishop, rook, and queen which invoke continueMove, to use continueMove
// correctly changePlayer is called again to change currentPlayer to the defender's color.

function threatsToSpace(space) {
	let threatMoves = [];
	const savePiece = board[space];
	// set a dummy piece at the space so even an empty space can be perceived as threatened
	board[space] = {
		color: currentPlayer,
	};
	const spaceX = stringToCoords(space)[0];
	const spaceY = stringToCoords(space)[1];
	changePlayer();
	for (let position in board) {
		if (board[position].color === currentPlayer) {
			// all the moves this enemy piece can make
			const checkArray =
				pieceStringToFunction[board[position].piece](position);
			for (let move of checkArray) {
				// if this move threatens the space
				if (move.space === space) {
					if (
						board[position].piece === 'pawn' ||
						board[position].piece === 'knight'
					) {
						// then store as an enemy the position of the piece making the threat
						threatMoves.push({
							space: position,
							condition: 'enemy',
						});
						// the following makes it so the enemy king can threaten spaces between
						// the other king and rook and stop them from castling, without being stored
						// as simply an 'enemy' that can be taken out by a defense move
					} else if (board[position].piece === 'king') {
						threatMoves.push({
							space: position,
							condition: 'king',
						});
					} else {
						// If a bishop, rook, or queen threatens the space from a distance, the threat
						// can be defended by taking the piece or blocking its path. We use something
						// like echolocation, using the inversion of the attacking continueMove from the
						// threatened space and from the defense perspective, which generates all
						// intermediate spaces for blocking as well as the attacking piece's position
						// stored as an 'enemy'.
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
	const theKing = findKing();
	return threatsToSpace(theKing).length === 0;
}

function findKing() {
	for (let position in board) {
		if (
			board[position].piece === 'king' &&
			board[position].color === currentPlayer
		) {
			return position;
		}
	}
}

function isSpaceSafe(position) {
	return threatsToSpace(position).length === 0;
}

/////// minor supporting functions ///////

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
	for (const position in initialBoard) {
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

function movePieceSound() {
	var audio = new Audio('./assets/chess-move.wav');
	audio.play();
}

function takePieceSound() {
	var audio = new Audio('./assets/take-piece.mp3');
	audio.play();
}
