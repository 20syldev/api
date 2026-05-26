import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import encrypt from '../../src/modules/v5/symmetric.js';

describe('encrypt', () => {
    test('encrypt then decrypt returns original text (aes-256-gcm)', () => {
        const { result: blob } = encrypt('encrypt', 'hello world', 'mypassword');
        const { result } = encrypt('decrypt', blob, 'mypassword');
        assert.equal(result, 'hello world');
    });

    test('encrypt then decrypt with aes-256-cbc', () => {
        const { result: blob } = encrypt('encrypt', 'test text', 'strongkey1', 'aes-256-cbc');
        const { result } = encrypt('decrypt', blob, 'strongkey1', 'aes-256-cbc');
        assert.equal(result, 'test text');
    });

    test('encrypt then decrypt with aes-128-gcm', () => {
        const { result: blob } = encrypt('encrypt', 'secret', 'pass1234', 'aes-128-gcm');
        const { result } = encrypt('decrypt', blob, 'pass1234', 'aes-128-gcm');
        assert.equal(result, 'secret');
    });

    test('two encrypts of same text produce different blobs (random IV/salt)', () => {
        const a = encrypt('encrypt', 'hello', 'mypassword');
        const b = encrypt('encrypt', 'hello', 'mypassword');
        assert.notEqual(a.result, b.result);
    });

    test('result object contains correct action and algorithm', () => {
        const res = encrypt('encrypt', 'hello', 'mypassword');
        assert.equal(res.action, 'encrypt');
        assert.equal(res.algorithm, 'aes-256-gcm');
    });

    test('decrypt with wrong key throws', () => {
        const { result: blob } = encrypt('encrypt', 'hello', 'correctkey');
        assert.throws(() => encrypt('decrypt', blob, 'wrongkey'), /Invalid key or corrupted data/);
    });

    test('unknown algorithm throws', () => {
        assert.throws(() => encrypt('encrypt', 'hello', 'mypassword', 'aes-999-xyz'), /Unsupported algorithm/);
    });

    test('invalid action throws', () => {
        assert.throws(() => encrypt('hash', 'hello', 'mypassword'), /Action must be/);
    });

    test('missing text throws', () => {
        assert.throws(() => encrypt('encrypt', '', 'mypassword'), /Text is required/);
    });

    test('key shorter than 8 chars throws', () => {
        assert.throws(() => encrypt('encrypt', 'hello', 'short'), /at least 8/);
    });

    test('missing key throws', () => {
        assert.throws(() => encrypt('encrypt', 'hello', ''), /Key is required/);
    });
});
