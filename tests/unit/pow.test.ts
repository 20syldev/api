import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { describe, test } from 'node:test';

import pow, { verifyPow } from '../../src/modules/v5/pow.js';
import type { ChallengeStorage } from '../../src/types/storage.js';

const store = (): ChallengeStorage => ({ usedNonces: new Map() });

function solve(salt: string, difficulty: number): string {
    const target = '0'.repeat(difficulty);
    for (let i = 0; ; i++) {
        if (createHash('sha256').update(`${salt}${i}`).digest('hex').startsWith(target)) return String(i);
    }
}

describe('pow', () => {
    test('issues a complete challenge', () => {
        const challenge = pow();
        assert.equal(challenge.algorithm, 'sha256');
        assert.match(challenge.salt, /^[0-9a-f]{16}$/);
        assert.equal(challenge.difficulty, 4);
        assert.ok(challenge.expires > Date.now());
        assert.ok(challenge.token.length > 0);
        assert.match(challenge.instructions, /4 hex zeros/);
    });

    test('honours a custom difficulty', () => {
        assert.equal(pow(2).difficulty, 2);
    });

    test('throws on difficulty out of range', () => {
        assert.throws(() => pow(0), /between 1 and 6/);
        assert.throws(() => pow(7), /between 1 and 6/);
        assert.throws(() => pow(1.5), /between 1 and 6/);
    });

    test('throws on non-numeric difficulty', () => {
        assert.throws(() => pow(NaN), /number/);
    });

    test('a solved challenge verifies', () => {
        const challenge = pow(2);
        const result = verifyPow(challenge.token, solve(challenge.salt, 2), store());
        assert.deepEqual(result, { valid: true });
    });

    test('a wrong nonce fails', () => {
        // Difficulty 6: a stray nonce cannot solve this one by luck
        const challenge = pow(6);
        assert.equal(verifyPow(challenge.token, 'definitely-not-it', store()).reason, 'wrong');
    });

    test('replaying a solved challenge fails', () => {
        const storage = store();
        const challenge = pow(1);
        const nonce = solve(challenge.salt, 1);
        assert.equal(verifyPow(challenge.token, nonce, storage).valid, true);
        assert.equal(verifyPow(challenge.token, nonce, storage).reason, 'used');
    });

    test('a captcha token is not accepted as a pow token', () => {
        const { token } = pow(1);
        const swapped = Buffer.from(
            JSON.stringify({
                ...(JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as object),
                type: 'img',
            }),
        ).toString('base64url');
        assert.equal(verifyPow(swapped, '0', store()).reason, 'invalid');
    });

    test('malformed token is invalid', () => {
        assert.equal(verifyPow('garbage', '0', store()).reason, 'invalid');
    });
});
