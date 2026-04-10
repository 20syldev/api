import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import token from '../../src/modules/v4/token.js';

describe('token', () => {
    test('alpha length', () => {
        const t = token(24, 'alpha');
        assert.equal(t.length, 24);
        assert.match(t, /^[a-zA-Z]+$/);
    });

    test('alphanum length', () => {
        const t = token(32, 'alphanum');
        assert.equal(t.length, 32);
        assert.match(t, /^[a-zA-Z0-9]+$/);
    });

    test('hex contains only hex chars', () => {
        const t = token(16, 'hex');
        assert.equal(t.length, 16);
        assert.match(t, /^[0-9a-f]+$/);
    });

    test('num contains only digits', () => {
        const t = token(20, 'num');
        assert.match(t, /^\d+$/);
    });

    test('urlsafe chars only', () => {
        const t = token(40, 'urlsafe');
        assert.match(t, /^[a-zA-Z0-9_-]+$/);
    });

    test('uuid type produces hex', () => {
        const t = token(32, 'uuid');
        assert.equal(t.length, 32);
    });

    test('default type alphanum', () => {
        const t = token(20);
        assert.match(t, /^[a-zA-Z0-9]+$/);
    });

    test('throws below minimum length', () => {
        assert.throws(() => token(5, 'alpha'), /greater than or equal to 12/);
    });

    test('throws above maximum length', () => {
        assert.throws(() => token(5000, 'alpha'), /4096/);
    });

    test('throws on invalid type', () => {
        assert.throws(() => token(20, 'martian'), /Invalid token type/);
    });

    test('two tokens are different (entropy check)', () => {
        const a = token(32, 'alphanum');
        const b = token(32, 'alphanum');
        assert.notEqual(a, b);
    });
});
