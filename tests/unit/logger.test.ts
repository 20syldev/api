import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import { redactPath, redactQuery } from '../../src/middleware/logger.js';

describe('redactQuery', () => {
    test('drops the values and keeps the parameter names', () => {
        assert.equal(redactQuery('/v5/encode?text=SUPERSECRET&method=base64'), '/v5/encode?text&method');
    });

    test('keeps a path without a query string untouched', () => {
        assert.equal(redactQuery('/v5/color'), '/v5/color');
    });

    test('drops an empty query string', () => {
        assert.equal(redactQuery('/v5/color?'), '/v5/color');
    });

    test('deduplicates repeated parameter names', () => {
        assert.equal(redactQuery('/v5/url?a=1&a=2&b=3'), '/v5/url?a&b');
    });

    test('keeps a valueless parameter', () => {
        assert.equal(redactQuery('/v5/color?raw'), '/v5/color?raw');
    });

    test('keeps names after a second question mark, value still dropped', () => {
        assert.equal(redactQuery('/v5/url?url=x?y&b=2'), '/v5/url?url&b');
    });

    test('does not leak a value hidden behind an empty name', () => {
        assert.equal(redactQuery('/v5/color?=secret'), '/v5/color');
    });

    test('leaves percent-encoded control characters encoded', () => {
        assert.equal(redactQuery('/v5/color?%0A%1b%5B31mFAKE=1'), '/v5/color?%0A%1b%5B31mFAKE');
    });

    test('leaves an encoded theme placeholder encoded', () => {
        assert.equal(redactQuery('/v5/color?%7Bstatus%7D=1'), '/v5/color?%7Bstatus%7D');
    });
});

describe('redactPath', () => {
    test('masks the private chat token', () => {
        assert.equal(redactPath('/v5/chat/abc123'), '/v5/chat/[redacted]');
    });

    test('masks the tic-tac-toe game id', () => {
        assert.equal(redactPath('/v4/tic-tac-toe/game-42'), '/v4/tic-tac-toe/[redacted]');
    });

    test('leaves the collection endpoint alone', () => {
        assert.equal(redactPath('/v5/chat'), '/v5/chat');
    });

    test('leaves an unrelated endpoint alone', () => {
        assert.equal(redactPath('/v5/color'), '/v5/color');
    });

    test('applies through redactQuery, alongside the query names', () => {
        assert.equal(redactQuery('/v5/chat/abc123?user=bob'), '/v5/chat/[redacted]?user');
    });
});

describe('redactPath sub-routes', () => {
    test('named sub-routes stay readable', () => {
        for (const route of ['clear', 'fetch', 'forfeit', 'list', 'play', 'private']) {
            const path = `/v6/tic-tac-toe/${route}`;
            assert.equal(redactPath(path), path, `${route} should not be redacted`);
        }
        assert.equal(redactPath('/v5/chat/private'), '/v5/chat/private');
    });

    test('identifiers are still masked', () => {
        assert.equal(redactPath('/v5/chat/9f2c8ab1'), '/v5/chat/[redacted]');
        assert.equal(redactPath('/v5/tic-tac-toe/NOPE42'), '/v5/tic-tac-toe/[redacted]');
    });
});
