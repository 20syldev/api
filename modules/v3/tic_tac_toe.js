import { randomBytes } from 'crypto';

/**
 * Manages a Tic-Tac-Toe game session
 *
 * @param {string} action - The action to perform ('play' or 'fetch')
 * @param {Object} params - The parameters for the action
 * @returns {Object} - The result of the action
 * @throws {Error} - If parameters are invalid
 */
export default function tic_tac_toe(action, params = {}) {
    // In-memory storage
    const storage = params.storage || {};

    // Initialize storage
    storage.games ??= {};
    storage.sessions ??= {};
    storage.rateLimits ??= {};

    // Reference the storage properties
    const { games, sessions, rateLimits } = storage;

    // Input validation for common parameters
    if (!params.username) throw new Error('Please provide a username');

    const u = params.username.toLowerCase();
    const now = Date.now();

    // Rate limiting
    rateLimits[u] = (rateLimits[u] || []).filter(ts => now - ts < 10000);
    if (rateLimits[u].length > 50) {
        const remainingTime = Math.ceil((rateLimits[u][0] + 10000 - now) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${remainingTime} seconds.`);
    }
    rateLimits[u].push(now);

    // Handle different actions
    if (action === 'play') {
        return playMove(params, games, sessions, u, now);
    } else if (action === 'fetch') {
        return fetchGame(params, games, u);
    } else {
        throw new Error('Invalid action. Use "play" or "fetch"');
    }
}

/**
 * Process a player's move
 */
function playMove(params, games, sessions, u, now) {
    const { move, session, game } = params;
    const validMoves = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3'];

    // Input validation for play action
    if (!move) throw new Error('Please provide a valid move');
    if (!session) throw new Error('Please provide a valid session ID');
    if (!game) throw new Error('Please provide a valid game ID');
    if (!validMoves.includes(move)) throw new Error('Invalid move. Please provide a valid move (e.g., 1-1, 2-2, 3-3).');

    // Session validation
    if (sessions[u] && sessions[u].user !== session) {
        throw new Error('Session ID mismatch');
    }

    // Initialize game if needed
    games[game] = games[game] || { moves: [], players: [] };
    const moves = games[game].moves;

    // Check if game is full
    const players = [...new Set(moves.map(play => play.username))];
    if (players.length >= 2 && !players.includes(params.username)) {
        throw new Error('Game is full, you can only watch.');
    }

    // Check if it's player's turn
    if (moves.length > 0 && moves[moves.length - 1].username === params.username) {
        throw new Error('Please wait for the other player to make a move.');
    }

    // Check if move is already made
    if (moves.some(play => play.move === move)) {
        throw new Error('Move already made. Please choose a different move.');
    }

    // Add move to game
    const play = { username: params.username, move, session };
    moves.push(play);

    // Check game result
    const result = checkGame(moves);
    if (result.winner || result.tie) {
        setTimeout(() => delete games[game], 600000);
        return {
            message: `Move sent successfully. ${result.winner ? result.winner + ' wins. ' + result.loser + ' loses.' : 'It\'s a tie.'}`,
            ...result
        };
    }

    // Set cleanup timeout
    setTimeout(() => delete games[game], 3600000);

    // Update session
    sessions[u] = sessions[u] || { user: session, last: now };
    sessions[u].last = now;
    setTimeout(() => { if (now - sessions[u].last >= 3600000) delete sessions[u]; }, 3600000);

    return { message: 'Move sent successfully' };
}

/**
 * Fetch a game state
 */
function fetchGame(params, games, u) {
    const id = params.game || generateGameId();

    if (!games[id]) {
        games[id] = {
            moves: [],
            players: []
        };
    }
    if (!games[id].players.includes(u)) {
        games[id].players.push(u);
    }

    const moves = games[id].moves;
    const players = games[id].players;
    const lastPlayer = moves.length ? moves[moves.length - 1].username : null;
    const turn = players.find(p => p !== lastPlayer) || players[0];
    const status = players.length >= 2 ? 'ready' : 'waiting';
    const result = moves.length ? checkGame(moves) : {};

    return {
        id,
        moves,
        players,
        turn,
        status,
        ...result
    };
}

/**
 * Generate a random game ID
 */
function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(randomBytes(5)).map(b => chars[b % chars.length]).join('');
}

/**
 * Check the game result
 */
function checkGame(moves) {
    let board = Array(3).fill().map(() => Array(3).fill(null));
    let playerSymbols = {};
    let playersOrder = [];

    moves.forEach(({ username, move }) => {
        if (!playerSymbols[username]) {
            playersOrder.push(username);
            playerSymbols[username] = playersOrder.length === 1 ? 'X' : 'O';
        }
        let [row, col] = move.split('-').map(Number);
        board[row - 1][col - 1] = playerSymbols[username];
    });

    const checkWinner = (symbol) => {
        for (let i = 0; i < 3; i++) {
            if (board[i][0] === symbol && board[i][1] === symbol && board[i][2] === symbol) return true;
            if (board[0][i] === symbol && board[1][i] === symbol && board[2][i] === symbol) return true;
        }
        if (board[0][0] === symbol && board[1][1] === symbol && board[2][2] === symbol) return true;
        if (board[0][2] === symbol && board[1][1] === symbol && board[2][0] === symbol) return true;
        return false;
    };

    let winner = Object.keys(playerSymbols).find(player => checkWinner(playerSymbols[player]));
    let isTie = !winner && moves.length === 9;
    let loser = winner && playersOrder.length === 2 ? playersOrder.find(player => player !== winner) : null;

    return { winner, loser, tie: isTie };
}