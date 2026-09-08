import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import v4captcha from '../../src/modules/v4/captcha.js';
import { captcha } from '../../src/modules/v5.js';
import captchaChallenge, { verifyCaptcha } from '../../src/modules/v5/captcha.js';
import type { ChallengeStorage } from '../../src/types/storage.js';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const store = (): ChallengeStorage => ({ usedNonces: new Map() });

describe('captcha (v5 generator mode)', () => {
    test('v5 serves the very same renderer as v4', () => {
        assert.equal(captcha, v4captcha);
    });

    test('still returns a PNG with the provided text', () => {
        const result = captcha({ text: 'hello' });
        assert.equal(result.contentType, 'image/png');
        assert.ok(result.body.subarray(0, 4).equals(PNG_MAGIC));
        assert.equal(result.text, 'hello');
    });
});

describe('captcha challenge (v5)', () => {
    test('returns an image and a token, never the answer', () => {
        const challenge = captchaChallenge({ length: 6 });
        assert.equal(challenge.contentType, 'image/png');
        assert.ok(challenge.body.subarray(0, 4).equals(PNG_MAGIC));
        const decoded = JSON.parse(Buffer.from(challenge.token, 'base64url').toString('utf8')) as { type: string };
        assert.equal(decoded.type, 'img');
    });

    test('challenge images use the hardened renderer', () => {
        const challenge = captchaChallenge({ text: 'abcdef', width: 400, height: 120 });
        const plain = v4captcha({ text: 'abcdef', width: 400, height: 120 });
        assert.ok(!challenge.body.equals(plain.body));
    });

    test('keeps the v4 option bounds', () => {
        assert.throws(() => captchaChallenge({ length: 0 }), /length/);
        assert.throws(() => captchaChallenge({ length: 99 }), /length/);
        assert.throws(() => captchaChallenge({ text: 'AB', width: 10 }), /width/);
        assert.throws(() => captchaChallenge({ text: 'AB', height: 500 }), /height/);
        assert.throws(() => captchaChallenge({ text: 'AB', noise: 'extreme' as 'high' }), /Noise/);
    });

    test('accepts every noise level and a forced colour', () => {
        for (const noise of ['low', 'medium', 'high'] as const) {
            assert.ok(captchaChallenge({ text: 'test', noise }).body.length > 0);
        }
        assert.ok(captchaChallenge({ text: 'abc', color: '#ff0000' }).body.length > 0);
    });

    test('the answer is case-insensitive and trimmed', () => {
        const challenge = captchaChallenge({ text: 'AbCdEf' });
        assert.equal(verifyCaptcha(challenge.token, '  abcdef  ', store()).valid, true);
    });

    test('a wrong answer fails', () => {
        const challenge = captchaChallenge({ text: 'abcdef' });
        assert.equal(verifyCaptcha(challenge.token, 'zzzzzz', store()).reason, 'wrong');
    });

    test('a token is single use', () => {
        const storage = store();
        const challenge = captchaChallenge({ text: 'abcdef' });
        assert.equal(verifyCaptcha(challenge.token, 'abcdef', storage).valid, true);
        assert.equal(verifyCaptcha(challenge.token, 'abcdef', storage).reason, 'used');
    });

    test('a malformed token is invalid', () => {
        assert.equal(verifyCaptcha('garbage', 'abcdef', store()).reason, 'invalid');
    });
});
