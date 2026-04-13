import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import tic_tac_toe from '../../src/modules/v4/tic_tac_toe.js';
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
        assert.throws(() => tic_tac_toe('play', { move: '1-1', session: 's', game: 'G', storage: makeStorage() }), /username/);
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
