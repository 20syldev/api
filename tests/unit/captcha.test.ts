import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import captcha from '../../src/modules/v4/captcha.js';

describe('captcha', () => {
    test('returns a Buffer for valid text', () => {
        const result = captcha('hello');
        assert.ok(Buffer.isBuffer(result));
        assert.ok(result.length > 0);
    });

    test('PNG starts with correct magic bytes', () => {
        const result = captcha('test');
        assert.equal(result[0], 0x89);
        assert.equal(result[1], 0x50); // P
        assert.equal(result[2], 0x4e); // N
        assert.equal(result[3], 0x47); // G
    });

    test('throws on missing text', () => {
        assert.throws(() => captcha(''));
    });
});
