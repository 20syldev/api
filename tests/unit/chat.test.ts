import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import chat from '../../src/modules/v4/chat.js';
import chatV5 from '../../src/modules/v5/chat.js';
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
        assert.throws(
            () => chat('message', { username: '', message: 'hi', session: 's', storage: makeStorage() }),
            /username/,
        );
    });

    test('throws on invalid action', () => {
        assert.throws(() => chat('delete', { username: 'alice', storage: makeStorage() }), /Invalid action/);
    });

    test('throws on fetch with no messages', () => {
        assert.throws(() => chat('fetch', { username: 'alice', storage: makeStorage() }), /No messages/);
    });
});

describe('chat v5 (5.4.0 fixes)', () => {
    test('expired session is evicted so the username can start a new session', (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const storage = makeStorage();
        chatV5('message', { username: 'eve', message: 'a', session: 's1', storage });
        t.mock.timers.tick(3_600_001);
        const result = chatV5('message', { username: 'eve', message: 'b', session: 's2', storage });
        assert.ok((result as { message: string }).message.includes('sent'));
    });

    test('old private message expiry does not wipe newer messages', (t) => {
        t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
        const storage = makeStorage();
        chatV5('message', { username: 'eve', message: 'm1', session: 's1', token: 'tok', storage });
        t.mock.timers.tick(3_599_000);
        chatV5('message', { username: 'eve', message: 'm2', session: 's1', token: 'tok', storage });
        t.mock.timers.tick(2_000);
        const msgs = chatV5('private', { username: 'eve', token: 'tok', storage }) as { message: string }[];
        assert.equal(msgs.length, 1);
        assert.equal(msgs[0]!.message, 'm2');
    });
});
