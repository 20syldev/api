import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import type { ChallengeStorage } from '../../src/types/storage.js';
import { readToken, signToken, verifyToken } from '../../src/utils/challenge.js';

const store = (): ChallengeStorage => ({ usedNonces: new Map() });

const decode = (token: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Record<string, unknown>;

describe('challenge tokens', () => {
    test('token carries type, nonce, expiry and signature', () => {
        const body = decode(signToken('img', 'secret'));
        assert.equal(body.type, 'img');
        assert.match(body.nonce as string, /^[0-9a-f]{32}$/);
        assert.ok((body.exp as number) > Date.now());
        assert.match(body.sig as string, /^[0-9a-f]{64}$/);
    });

    test('payload never appears in the token', () => {
        const token = signToken('img', 'a1b2c3');
        assert.ok(!Buffer.from(token, 'base64url').toString('utf8').includes('a1b2c3'));
    });

    test('extra fields are carried along', () => {
        const body = decode(signToken('pow', 'salt.4', { salt: 'salt', difficulty: 4 }));
        assert.equal(body.salt, 'salt');
        assert.equal(body.difficulty, 4);
    });

    test('matching payload verifies', () => {
        assert.deepEqual(verifyToken(signToken('img', 'abc'), 'abc', store()), { valid: true });
    });

    test('wrong payload fails', () => {
        const result = verifyToken(signToken('img', 'abc'), 'xyz', store());
        assert.equal(result.valid, false);
        assert.equal(result.reason, 'wrong');
    });

    test('replaying a consumed token fails', () => {
        const storage = store();
        const token = signToken('img', 'abc');
        assert.equal(verifyToken(token, 'abc', storage).valid, true);
        assert.equal(verifyToken(token, 'abc', storage).reason, 'used');
    });

    test('a failed attempt does not consume the token', () => {
        const storage = store();
        const token = signToken('img', 'abc');
        assert.equal(verifyToken(token, 'nope', storage).reason, 'wrong');
        assert.equal(verifyToken(token, 'abc', storage).valid, true);
    });

    test('expired token fails', () => {
        const body = decode(signToken('img', 'abc'));
        body.exp = Date.now() - 1;
        const expired = Buffer.from(JSON.stringify(body)).toString('base64url');
        assert.equal(verifyToken(expired, 'abc', store()).reason, 'expired');
    });

    test('expired nonces are pruned from the store', () => {
        const storage = store();
        storage.usedNonces.set('stale', Date.now() - 1000);
        verifyToken(signToken('img', 'abc'), 'abc', storage);
        assert.equal(storage.usedNonces.has('stale'), false);
    });

    test('tampered signature fails', () => {
        const body = decode(signToken('img', 'abc'));
        body.sig = 'f'.repeat(64);
        const tampered = Buffer.from(JSON.stringify(body)).toString('base64url');
        assert.equal(verifyToken(tampered, 'abc', store()).reason, 'wrong');
    });

    test('malformed token is invalid', () => {
        assert.equal(verifyToken('not-a-token', 'abc', store()).reason, 'invalid');
        assert.equal(verifyToken(Buffer.from('{}').toString('base64url'), 'abc', store()).reason, 'invalid');
    });

    test('readToken exposes public fields without verifying', () => {
        const token = signToken('pow', 'salt.4', { salt: 'salt', difficulty: 4 });
        assert.equal(readToken(token)?.salt, 'salt');
        assert.equal(readToken('garbage'), null);
    });
});
