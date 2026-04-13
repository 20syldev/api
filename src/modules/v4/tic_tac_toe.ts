import { randomBytes } from 'crypto';
import { SESSION_TTL, GAME_CLEANUP_TTL, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../../constants.js';
import type { TicTacToeStorage, TicTacToeMove, TicTacToeGame } from '../../types/storage.js';

interface TicTacToeParams {
    username?: string;
    move?: string;
    session?: string;
    game?: string;
    private?: boolean;
    storage: TicTacToeStorage;
}

interface GameResult {
    winner?: string | null;
    loser?: string | null;
    tie?: boolean;
}

export default function tic_tac_toe(action: string, params: TicTacToeParams): Record<string, unknown> {
    const storage = params.storage;

    storage.games ??= {};
    storage.sessions ??= {};
    storage.rateLimits ??= {};

    const { games, sessions, rateLimits } = storage;

    if (action === 'list') return listGames(games);

    if (!params.username) throw new Error('Please provide a username');

    const u = params.username.toLowerCase();
    const now = Date.now();

    rateLimits[u] = (rateLimits[u] ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW);
    if (rateLimits[u]!.length > RATE_LIMIT_MAX) {
        const remainingTime = Math.ceil((rateLimits[u]![0]! + RATE_LIMIT_WINDOW - now) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${remainingTime} seconds.`);
    }
    rateLimits[u]!.push(now);

    if (action === 'play') {
        return playMove(params, games, sessions, u, now);
    } else if (action === 'fetch') {
        return fetchGame(params, games, u);
    } else if (action === 'forfeit') {
        return forfeitGame(params, games, sessions);
    } else {
        throw new Error('Invalid action. Use "play", "fetch", "list", or "forfeit"');
    }
}

function forfeitGame(
    params: TicTacToeParams,
    games: Record<string, TicTacToeGame>,
    sessions: Record<string, { user: string; last: number }>,
): Record<string, unknown> {
    const { game, session } = params;

    if (!game) throw new Error('Please provide a valid game ID');
    if (!session) throw new Error('Please provide a valid session ID');
    if (!games[game]) throw new Error('Game not found');

    const u = params.username!.toLowerCase();
    if (sessions[u] && sessions[u].user !== session) {
        throw new Error('Session ID mismatch');
    }

    const players = games[game]!.players;
    if (!players.includes(u)) throw new Error('You are not a player in this game');

    const winner = players.find((p) => p !== u) ?? null;
    delete games[game];
    delete sessions[u];

    return {
        message: `${params.username} forfeited the game.${winner ? ` ${winner} wins.` : ''}`,
        winner,
        loser: params.username,
    };
}

function playMove(
    params: TicTacToeParams,
    games: Record<string, TicTacToeGame>,
    sessions: Record<string, { user: string; last: number }>,
    u: string,
    now: number,
): Record<string, unknown> {
    const { move, session, game } = params;
    const validMoves = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3'];

    if (!move) throw new Error('Please provide a valid move');
    if (!session) throw new Error('Please provide a valid session ID');
    if (!game) throw new Error('Please provide a valid game ID');
    if (!validMoves.includes(move)) throw new Error('Invalid move. Please provide a valid move (e.g., 1-1, 2-2, 3-3).');

    if (sessions[u] && sessions[u].user !== session) {
        throw new Error('Session ID mismatch');
    }

    games[game] = games[game] ?? {
        moves: [],
        players: [],
        private: params.private || false,
        creation: Date.now(),
    };
    const moves = games[game]!.moves;

    const players = [...new Set(moves.map((play) => play.username))];
    if (players.length >= 2 && !players.includes(params.username!)) {
        throw new Error('Game is full, you can only watch.');
    }

    if (moves.length > 0 && moves[moves.length - 1]!.username === params.username) {
        throw new Error('Please wait for the other player to make a move.');
    }

    if (moves.some((play) => play.move === move)) {
        throw new Error('Move already made. Please choose a different move.');
    }

    const play: TicTacToeMove = { username: params.username!, move, session };
    moves.push(play);

    const result = checkGame(moves);
    if (result.winner || result.tie) {
        setTimeout(() => delete games[game!], GAME_CLEANUP_TTL);
        return {
            message: `Move sent successfully. ${result.winner ? result.winner + ' wins. ' + result.loser + ' loses.' : "It's a tie."}`,
            ...result,
        };
    }

    setTimeout(() => delete games[game!], SESSION_TTL);

    sessions[u] = sessions[u] ?? { user: session, last: now };
    sessions[u]!.last = now;
    setTimeout(() => {
        if (sessions[u] && now - sessions[u].last >= SESSION_TTL) delete sessions[u];
    }, SESSION_TTL);

    return { message: 'Move sent successfully' };
}

function fetchGame(params: TicTacToeParams, games: Record<string, TicTacToeGame>, u: string): Record<string, unknown> {
    const id = params.game || generateGameId();
    if (!games[id]) {
        games[id] = {
            moves: [],
            players: [],
            private: params.private || false,
            creation: Date.now(),
        };
    }
    if (!games[id]!.players.includes(u)) {
        games[id]!.players.push(u);
    }

    const moves = games[id]!.moves;
    const players = games[id]!.players;
    const privateGame = games[id]!.private;
    const lastPlayer = moves.length ? moves[moves.length - 1]!.username : null;
    const turn = players.find((p) => p !== lastPlayer) || players[0];
    const status = players.length >= 2 ? 'ready' : 'waiting';
    const result = moves.length ? checkGame(moves) : {};

    return {
        id,
        moves,
        players,
        turn,
        status,
        private: privateGame,
        ...result,
    };
}

function listGames(games: Record<string, TicTacToeGame>): Record<string, unknown> {
    const publicGames: Record<string, unknown>[] = [];
    const now = Date.now();

    for (const [gameId, game] of Object.entries(games)) {
        if (!game.private) {
            const result = game.moves.length ? checkGame(game.moves) : {};
            const isFinished = result.winner || result.tie;

            if (!isFinished) {
                const lastPlayer = game.moves.length ? game.moves[game.moves.length - 1]!.username : null;
                const turn = game.players.find((p) => p !== lastPlayer) || game.players[0];
                const status = game.players.length >= 2 ? 'ready' : 'waiting';

                publicGames.push({
                    id: gameId,
                    players: game.players,
                    playersCount: game.players.length,
                    moves: game.moves.length,
                    turn,
                    status,
                    creation: game.creation || now,
                });
            }
        }
    }

    publicGames.sort((a, b) => (b.creation as number) - (a.creation as number));

    return {
        message: 'Public games available',
        count: publicGames.length,
        games: publicGames,
    };
}

function generateGameId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(randomBytes(5))
        .map((b) => chars[b % chars.length])
        .join('');
}

function checkGame(moves: TicTacToeMove[]): GameResult {
    const board: (string | null)[][] = Array(3)
        .fill(null)
        .map(() => Array(3).fill(null) as (string | null)[]);
    const playerSymbols: Record<string, string> = {};
    const playersOrder: string[] = [];

    moves.forEach(({ username, move }) => {
        if (!playerSymbols[username]) {
            playersOrder.push(username);
            playerSymbols[username] = playersOrder.length === 1 ? 'X' : 'O';
        }
        const [row, col] = move.split('-').map(Number) as [number, number];
        board[row - 1]![col - 1] = playerSymbols[username]!;
    });

    const checkWinner = (symbol: string): boolean => {
        for (let i = 0; i < 3; i++) {
            if (board[i]![0] === symbol && board[i]![1] === symbol && board[i]![2] === symbol) return true;
            if (board[0]![i] === symbol && board[1]![i] === symbol && board[2]![i] === symbol) return true;
        }
        if (board[0]![0] === symbol && board[1]![1] === symbol && board[2]![2] === symbol) return true;
        if (board[0]![2] === symbol && board[1]![1] === symbol && board[2]![0] === symbol) return true;
        return false;
    };

    const winner = Object.keys(playerSymbols).find((player) => checkWinner(playerSymbols[player]!)) ?? null;
    const isTie = !winner && moves.length === 9;
    const loser =
        winner && playersOrder.length === 2 ? (playersOrder.find((player) => player !== winner) ?? null) : null;

    return { winner, loser, tie: isTie };
}
