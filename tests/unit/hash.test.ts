import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import hash from '../../src/modules/v4/hash.js';

describe('hash', () => {
    test('sha256 of "hello"', () => {
        const result = hash('hello', 'sha256');
        assert.deepEqual(result, {
            method: 'sha256',
            hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        });
    });

    test('md5 of "hello"', () => {
        const result = hash('hello', 'md5');
        assert.deepEqual(result, {
            method: 'md5',
            hash: '5d41402abc4b2a76b9719d911017c592',
        });
    });

    test('sha1 of empty string', () => {
        const result = hash('', 'sha1');
        assert.equal((result as { hash: string }).hash, 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
    });

    test('returns error object on unsupported method', () => {
        const result = hash('hello', 'fakehash');
        assert.ok('error' in result);
    });

    test('same input + method = same hash (deterministic)', () => {
        const a = hash('test', 'sha256');
        const b = hash('test', 'sha256');
        assert.deepEqual(a, b);
    });
});
