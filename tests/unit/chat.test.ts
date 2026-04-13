import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import chat from '../../src/modules/v4/chat.js';
import type { ChatStorage } from '../../src/types/storage.js';

function makeStorage(): ChatStorage {
    return { messages: [], privateChats: {}, sessions: {}, rateLimits: {} };
}

describe('chat', () => {
    test('sends a public message', () => {
        const storage = makeStorage();
        const result = chat('message', { username: 'alice', message: 'hello', session: 'a1', storage });
        assert.ok((result as { message: string }).message.includes('sent'));
    });

    test('fetches public messages', () => {
        const storage = makeStorage();
        chat('message', { username: 'alice', message: 'test', session: 'a1', storage });
        const result = chat('fetch', { username: 'bob', storage });
        assert.ok(Array.isArray(result));
        assert.equal((result as { message: string }[])[0]!.message, 'test');
    });

    test('sends and retrieves private messages', () => {
        const storage = makeStorage();
        chat('message', { username: 'alice', message: 'secret', session: 'a1', token: 'tok1', storage });
        const result = chat('private', { username: 'bob', token: 'tok1', storage });
        assert.ok(Array.isArray(result));
    });

    test('clears a private chat', () => {
        const storage = makeStorage();
        chat('message', { username: 'alice', message: 'secret', session: 'a1', token: 'tok2', storage });
        const result = chat('clear', { username: 'alice', session: 'a1', token: 'tok2', storage });
        assert.ok((result as { message: string }).message.includes('cleared'));
    });

    test('throws on missing username', () => {
        assert.throws(() => chat('message', { username: '', message: 'hi', session: 's', storage: makeStorage() }), /username/);
    });

    test('throws on invalid action', () => {
        assert.throws(() => chat('delete', { username: 'alice', storage: makeStorage() }), /Invalid action/);
    });

    test('throws on fetch with no messages', () => {
        assert.throws(() => chat('fetch', { username: 'alice', storage: makeStorage() }), /No messages/);
    });
});
