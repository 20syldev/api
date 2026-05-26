import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import otp from '../../src/modules/v5/otp.js';

describe('otp - secret', () => {
    test('generates a base32 secret of length 32', () => {
        const result = otp('secret') as { secret: string; uri: string };
        assert.ok(typeof result.secret === 'string');
        assert.equal(result.secret.length, 32);
        assert.match(result.secret, /^[A-Z2-7]+$/);
    });

    test('generates a valid otpauth URI', () => {
        const result = otp('secret', { label: 'alice', issuer: 'MyApp' }) as { secret: string; uri: string };
        assert.ok(result.uri.startsWith('otpauth://totp/'));
        assert.ok(result.uri.includes(result.secret));
        assert.ok(result.uri.includes('MyApp'));
    });

    test('two secrets are different', () => {
        const a = otp('secret') as { secret: string };
        const b = otp('secret') as { secret: string };
        assert.notEqual(a.secret, b.secret);
    });
});

describe('otp - generate', () => {
    test('generates a 6-digit code by default', () => {
        const { secret } = otp('secret') as { secret: string };
        const result = otp('generate', { secret }) as { code: string; remaining: number; period: number };
        assert.match(result.code, /^\d{6}$/);
    });

    test('generates an 8-digit code when digits=8', () => {
        const { secret } = otp('secret', { digits: 8 }) as { secret: string };
        const result = otp('generate', { secret, digits: 8 }) as { code: string };
        assert.match(result.code, /^\d{8}$/);
    });

    test('HOTP with fixed counter is deterministic', () => {
        const { secret } = otp('secret') as { secret: string };
        const a = otp('generate', { secret, counter: 42 }) as { code: string };
        const b = otp('generate', { secret, counter: 42 }) as { code: string };
        assert.equal(a.code, b.code);
    });

    test('HOTP with same counter is deterministic (RFC 4226 property)', () => {
        const { secret } = otp('secret') as { secret: string };
        const r0 = otp('generate', { secret, counter: 0 }) as { code: string };
        const r1 = otp('generate', { secret, counter: 0 }) as { code: string };
        assert.equal(r0.code, r1.code);
    });

    test('period is returned in result', () => {
        const { secret } = otp('secret') as { secret: string };
        const result = otp('generate', { secret, period: 60 }) as { period: number };
        assert.equal(result.period, 60);
    });
});

describe('otp - verify', () => {
    test('verify freshly generated code returns valid=true, drift=0', () => {
        const { secret } = otp('secret') as { secret: string };
        const { code } = otp('generate', { secret }) as { code: string };
        const result = otp('verify', { secret, code }) as { valid: boolean; drift: number };
        assert.equal(result.valid, true);
        assert.equal(result.drift, 0);
    });

    test('verify wrong code returns valid=false', () => {
        const { secret } = otp('secret') as { secret: string };
        const result2 = otp('verify', { secret, code: 'xxxxxx' }) as { valid: boolean };
        assert.equal(result2.valid, false);
    });

    test('verify with fixed HOTP counter is deterministic', () => {
        const { secret } = otp('secret') as { secret: string };
        const { code } = otp('generate', { secret, counter: 5 }) as { code: string };
        const result = otp('verify', { secret, code, counter: 5 }) as { valid: boolean; drift: number };
        assert.equal(result.valid, true);
    });
});

describe('otp - validation', () => {
    test('invalid action throws', () => {
        assert.throws(() => otp('unknown'), /Action must be/);
    });

    test('invalid digits throws', () => {
        assert.throws(() => otp('generate', { secret: 'JBSWY3DPEHPK3PXP', digits: 7 }), /Digits must be/);
    });

    test('invalid period throws', () => {
        assert.throws(() => otp('generate', { secret: 'JBSWY3DPEHPK3PXP', period: 45 }), /Period must be/);
    });

    test('invalid algorithm throws', () => {
        assert.throws(() => otp('generate', { secret: 'JBSWY3DPEHPK3PXP', algorithm: 'md5' }), /Algorithm must be/);
    });

    test('missing secret for generate throws', () => {
        assert.throws(() => otp('generate', {}), /Secret is required/);
    });

    test('missing code for verify throws', () => {
        assert.throws(() => otp('verify', { secret: 'JBSWY3DPEHPK3PXP' }), /Code is required/);
    });
});
