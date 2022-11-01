export function renderGame(game, user) {
    const gamesDiv = document.createElement('div');
    const playerOneNameEl = document.createElement('p');
    const playerTwoNameEl = document.createElement('p');
    const gameEl = document.createElement('p');
    const resumeGameBtn = document.createElement('a');
    const viewGameBtn = document.createElement('a');
    
    playerOneNameEl.textContent = `Player 1: ${game.player_one_name}`;
    playerTwoNameEl.textContent = `Player 2: ${game.player_two_name}`;
    gameEl.textContent = ''; 
    resumeGameBtn.textContent = 'Resume Game';
    viewGameBtn.textContent = 'View Game';
    resumeGameBtn.href = `../?id=${game.id}`;
    resumeGameBtn.classList.add('link-button')
    viewGameBtn.href = `../?id=${game.id}`;
    viewGameBtn.classList.add('link-button');

    if (user.id === game.user_id) {
        gamesDiv.append(playerOneNameEl, playerTwoNameEl, gameEl, resumeGameBtn);
    } else {
        gamesDiv.append(playerOneNameEl, playerTwoNameEl, gameEl, viewGameBtn);
    }
    
    return gamesDiv;
}

export function renderPlayerNames(game, user) {

}

export function renderCapturedBlack(piece) {
    
    const pieceEl = document.createElement('p');

    pieceEl.textContent = piece.image;

    

    return pieceEl;
}

export function renderCapturedwhite(piece) {
    
    const pieceEl = document.createElement('p');

    pieceEl.textContent = piece.image;

    return pieceEl;
}


