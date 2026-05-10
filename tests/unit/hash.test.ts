import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import hash from '../../src/modules/v4/hash.js';

describe('hash', () => {
    test('sha256 of "hello"', () => {
        const result = hash('hello', 'sha256');
        assert.deepEqual(result, {
            method: 'sha256',
            hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
            encoding: 'hex',
        });
    });

    test('md5 of "hello"', () => {
        const result = hash('hello', 'md5');
        assert.equal(result.hash, '5d41402abc4b2a76b9719d911017c592');
        assert.equal(result.encoding, 'hex');
    });

    test('base64 encoding', () => {
        const result = hash('hello', 'sha256', 'base64');
        assert.equal(result.encoding, 'base64');
        assert.ok(result.hash.length > 0);
    });

    test('throws on empty text', () => {
        assert.throws(() => hash('', 'sha256'), /Text is required/);
    });

    test('throws on unsupported method', () => {
        assert.throws(() => hash('hello', 'fakehash'), /Unsupported method/);
    });

    test('throws on invalid encoding', () => {
        assert.throws(() => hash('hello', 'sha256', 'utf8'), /Encoding must be/);
    });

    test('same input + method = same hash (deterministic)', () => {
        const a = hash('test', 'sha256');
        const b = hash('test', 'sha256');
        assert.deepEqual(a, b);
    });
});
