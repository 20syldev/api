import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import tic_tac_toe from '../../src/modules/v4/tic_tac_toe.js';
import ticTacToeV5 from '../../src/modules/v5/tic_tac_toe.js';
import type { TicTacToeStorage } from '../../src/types/storage.js';

function makeStorage(): TicTacToeStorage {
    return { games: {}, sessions: {}, rateLimits: {} };
}

describe('tic_tac_toe', () => {
    test('list returns empty games array', () => {
        const result = tic_tac_toe('list', { storage: makeStorage() });
        assert.ok(Array.isArray(result.games));
    });

    test('play creates a game and makes a move', () => {
        const storage = makeStorage();
        const result = tic_tac_toe('play', { username: 'alice', move: '1-1', session: 'a1', game: 'TEST1', storage });
        assert.ok((result.message as string).includes('Move sent'));
    });

    test('fetch returns game state', () => {
        const storage = makeStorage();
        tic_tac_toe('play', { username: 'alice', move: '1-1', session: 'a1', game: 'TEST2', storage });
        const result = tic_tac_toe('fetch', { username: 'alice', game: 'TEST2', storage });
        assert.equal(result.id, 'TEST2');
    });

    test('forfeit throws on non-player', () => {
        const storage = makeStorage();
        tic_tac_toe('play', { username: 'alice', move: '1-1', session: 'a1', game: 'TEST3', storage });
        assert.throws(
            () => tic_tac_toe('forfeit', { username: 'charlie', session: 'c1', game: 'TEST3', storage }),
            /not a player/,
        );
    });

    test('throws on missing username', () => {
        assert.throws(
            () => tic_tac_toe('play', { move: '1-1', session: 's', game: 'G', storage: makeStorage() }),
            /username/,
        );
    });

    test('throws on missing move', () => {
        assert.throws(
            () => tic_tac_toe('play', { username: 'alice', session: 's', game: 'G', storage: makeStorage() }),
            /move/i,
        );
    });

    test('throws on invalid action', () => {
        assert.throws(() => tic_tac_toe('reset', { username: 'alice', storage: makeStorage() }), /Invalid action/);
    });
});

describe('tic_tac_toe v5 (5.4.0 fixes)', () => {
    test('a player can forfeit without fetching first', () => {
        const storage = makeStorage();
        ticTacToeV5('play', { username: 'zoe', move: '1-1', session: 'z1', game: 'G1', storage });
        const result = ticTacToeV5('forfeit', { username: 'zoe', session: 'z1', game: 'G1', storage });
        assert.ok((result as { message: string }).message.includes('forfeited'));
    });

    test('username casing cannot be used to play both sides', () => {
        const storage = makeStorage();
        ticTacToeV5('play', { username: 'Alice', move: '1-1', session: 'a1', game: 'G2', storage });
        assert.throws(
            () => ticTacToeV5('play', { username: 'ALICE', move: '2-2', session: 'a1', game: 'G2', storage }),
            /wait for the other player/,
        );
    });

    test('an active game is not deleted by the idle cleanup timer', (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const storage = makeStorage();
        ticTacToeV5('play', { username: 'ann', move: '1-1', session: 'a1', game: 'G3', storage });
        t.mock.timers.tick(3_599_000);
        ticTacToeV5('play', { username: 'ben', move: '2-2', session: 'b1', game: 'G3', storage });
        t.mock.timers.tick(2_000);
        assert.ok(storage.games['G3']);
    });

    test('an idle game is deleted after the TTL', (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const storage = makeStorage();
        ticTacToeV5('play', { username: 'ann', move: '1-1', session: 'a1', game: 'G4', storage });
        t.mock.timers.tick(3_600_001);
        assert.equal(storage.games['G4'], undefined);
    });
});
