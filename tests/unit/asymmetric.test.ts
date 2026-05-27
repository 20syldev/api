import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import asymmetric from '../../src/modules/v5/asymmetric.js';

// Generate a key pair once to reuse across tests
const { publicKey: testPublicKey, privateKey: testPrivateKey } = asymmetric('keygen', {}) as {
    publicKey: string;
    privateKey: string;
};

describe('asymmetric - keygen', () => {
    test('returns publicKey and privateKey PEM with default 2048 bits', () => {
        const result = asymmetric('keygen', {}) as {
            action: string;
            algorithm: string;
            modulusLength: number;
            publicKey: string;
            privateKey: string;
        };
        assert.equal(result.action, 'keygen');
        assert.equal(result.algorithm, 'rsa-oaep-sha256');
        assert.equal(result.modulusLength, 2048);
        assert.ok(result.publicKey.startsWith('-----BEGIN PUBLIC KEY-----'));
        assert.ok(result.privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
    });

    test('default algorithm is rsa-oaep-sha256', () => {
        const result = asymmetric('keygen', {}) as { algorithm: string };
        assert.equal(result.algorithm, 'rsa-oaep-sha256');
    });

    test('keygen with rsa-oaep-sha1', () => {
        const result = asymmetric('keygen', { algorithm: 'rsa-oaep-sha1' }) as { algorithm: string };
        assert.equal(result.algorithm, 'rsa-oaep-sha1');
    });

    test('two keygen calls produce different keys', () => {
        const a = asymmetric('keygen', {}) as { publicKey: string };
        const b = asymmetric('keygen', {}) as { publicKey: string };
        assert.notEqual(a.publicKey, b.publicKey);
    });
});

describe('asymmetric - encrypt/decrypt', () => {
    test('encrypt then decrypt returns original text', () => {
        const enc = asymmetric('encrypt', { text: 'hello RSA', publicKey: testPublicKey }) as { result: string };
        const dec = asymmetric('decrypt', { text: enc.result, privateKey: testPrivateKey }) as { result: string };
        assert.equal(dec.result, 'hello RSA');
    });

    test('two encrypts of same text produce different results (OAEP padding)', () => {
        const a = asymmetric('encrypt', { text: 'same text', publicKey: testPublicKey }) as { result: string };
        const b = asymmetric('encrypt', { text: 'same text', publicKey: testPublicKey }) as { result: string };
        assert.notEqual(a.result, b.result);
    });

    test('encrypt result is base64 string', () => {
        const enc = asymmetric('encrypt', { text: 'hello', publicKey: testPublicKey }) as { result: string };
        assert.match(enc.result, /^[A-Za-z0-9+/]+=*$/);
    });

    test('encrypt result has correct action and algorithm fields', () => {
        const result = asymmetric('encrypt', { text: 'test', publicKey: testPublicKey }) as {
            action: string;
            algorithm: string;
        };
        assert.equal(result.action, 'encrypt');
        assert.equal(result.algorithm, 'rsa-oaep-sha256');
    });

    test('decrypt result has correct action and algorithm fields', () => {
        const enc = asymmetric('encrypt', { text: 'test', publicKey: testPublicKey }) as { result: string };
        const result = asymmetric('decrypt', { text: enc.result, privateKey: testPrivateKey }) as {
            action: string;
            algorithm: string;
        };
        assert.equal(result.action, 'decrypt');
        assert.equal(result.algorithm, 'rsa-oaep-sha256');
    });

    test('round-trip with rsa-oaep-sha1', () => {
        const { publicKey, privateKey } = asymmetric('keygen', { algorithm: 'rsa-oaep-sha1' }) as {
            publicKey: string;
            privateKey: string;
        };
        const enc = asymmetric('encrypt', { text: 'sha1 test', publicKey, algorithm: 'rsa-oaep-sha1' }) as {
            result: string;
        };
        const dec = asymmetric('decrypt', { text: enc.result, privateKey, algorithm: 'rsa-oaep-sha1' }) as {
            result: string;
        };
        assert.equal(dec.result, 'sha1 test');
    });

    test('decrypt with wrong private key throws', () => {
        const { privateKey: wrongKey } = asymmetric('keygen', {}) as { privateKey: string };
        const enc = asymmetric('encrypt', { text: 'secret', publicKey: testPublicKey }) as { result: string };
        assert.throws(() => asymmetric('decrypt', { text: enc.result, privateKey: wrongKey }), /Invalid key/);
    });
});

describe('asymmetric - validation', () => {
    test('invalid action throws', () => {
        assert.throws(() => asymmetric('hash', {}), /Action must be/);
    });

    test('empty action throws', () => {
        assert.throws(() => asymmetric('', {}), /Action must be/);
    });

    test('unsupported algorithm throws', () => {
        assert.throws(() => asymmetric('keygen', { algorithm: 'rsa-pkcs1v15' }), /Unsupported algorithm/);
    });

    test('invalid modulusLength throws', () => {
        assert.throws(() => asymmetric('keygen', { modulusLength: 1024 }), /Modulus length/);
    });

    test('encrypt without publicKey throws', () => {
        assert.throws(() => asymmetric('encrypt', { text: 'hello' }), /Public key is required/);
    });

    test('encrypt with invalid publicKey format throws', () => {
        assert.throws(() => asymmetric('encrypt', { text: 'hello', publicKey: 'not-a-key' }), /Invalid public key/);
    });

    test('encrypt without text throws', () => {
        assert.throws(() => asymmetric('encrypt', { publicKey: testPublicKey }), /Text is required/);
    });

    test('decrypt without privateKey throws', () => {
        assert.throws(() => asymmetric('decrypt', { text: 'abc' }), /Private key is required/);
    });

    test('decrypt with invalid privateKey format throws', () => {
        assert.throws(() => asymmetric('decrypt', { text: 'abc', privateKey: 'not-a-key' }), /Invalid private key/);
    });

    test('decrypt without text throws', () => {
        assert.throws(() => asymmetric('decrypt', { privateKey: testPrivateKey }), /Encrypted data is required/);
    });

    test('text too long for key size throws', () => {
        // RSA-2048 OAEP-SHA256 max = 190 bytes
        const longText = 'a'.repeat(191);
        assert.throws(() => asymmetric('encrypt', { text: longText, publicKey: testPublicKey }), /exceeds maximum/);
    });
});
