import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import jwt from '../../src/modules/v5/jwt.js';

// Helper: build a JWT from raw parts (no signature verification)
const makeToken = (header: object, payload: object, sig = 'fakesig'): string => {
    const enc = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return `${enc(header)}.${enc(payload)}.${sig}`;
};

describe('jwt', () => {
    test('valid token returns header, payload, signature', () => {
        const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '123', name: 'Alice' });
        const result = jwt(token);
        assert.deepEqual(result.header, { alg: 'HS256', typ: 'JWT' });
        assert.deepEqual(result.payload, { sub: '123', name: 'Alice' });
        assert.equal(result.signature, 'fakesig');
    });

    test('expired token → expired: true', () => {
        const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { exp: 1 });
        const result = jwt(token);
        assert.equal(result.expired, true);
    });

    test('non-expired token → expired: false', () => {
        const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { exp: 9_999_999_999 });
        const result = jwt(token);
        assert.equal(result.expired, false);
    });

    test('token without exp → no expired field', () => {
        const token = makeToken({ alg: 'HS256' }, { sub: '123' });
        const result = jwt(token);
        assert.equal('expired' in result, false);
    });

    test('missing token throws', () => {
        assert.throws(() => jwt(''), /Please provide a token/);
    });

    test('no dots (invalid format) throws', () => {
        assert.throws(() => jwt('notavalidtoken'), /3 parts/);
    });

    test('only 2 parts throws', () => {
        assert.throws(() => jwt('a.b'), /3 parts/);
    });

    test('invalid base64url header throws', () => {
        assert.throws(() => jwt('notjson.eyJzdWIiOiIxMjMifQ.sig'), /Invalid JWT header/);
    });

    test('token too long throws', () => {
        assert.throws(() => jwt('a'.repeat(8193)), /cannot exceed/);
    });
});
