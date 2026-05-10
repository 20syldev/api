import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import captcha from '../../src/modules/v4/captcha.js';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe('captcha', () => {
    test('returns PNG buffer with provided text', () => {
        const result = captcha({ text: 'hello' });
        assert.equal(result.contentType, 'image/png');
        assert.ok(Buffer.isBuffer(result.body));
        assert.ok(result.body.subarray(0, 4).equals(PNG_MAGIC));
        assert.equal(result.text, 'hello');
    });

    test('auto-generates text when none provided', () => {
        const result = captcha({});
        assert.equal(result.text.length, 6);
        assert.ok(Buffer.isBuffer(result.body));
    });

    test('respects custom length', () => {
        const result = captcha({ length: 10 });
        assert.equal(result.text.length, 10);
    });

    test('throws on invalid length', () => {
        assert.throws(() => captcha({ length: 0 }), /length/);
        assert.throws(() => captcha({ length: 99 }), /length/);
    });

    test('accepts custom dimensions', () => {
        const result = captcha({ text: 'AB', width: 200, height: 80 });
        assert.ok(Buffer.isBuffer(result.body));
    });

    test('throws on invalid dimensions', () => {
        assert.throws(() => captcha({ text: 'AB', width: 10 }), /width/);
        assert.throws(() => captcha({ text: 'AB', height: 500 }), /height/);
    });

    test('accepts noise levels', () => {
        for (const noise of ['low', 'medium', 'high'] as const) {
            const result = captcha({ text: 'test', noise });
            assert.ok(Buffer.isBuffer(result.body));
        }
    });

    test('throws on invalid noise', () => {
        assert.throws(() => captcha({ text: 'test', noise: 'extreme' as 'low' }), /noise/);
    });

    test('accepts custom colors', () => {
        const result = captcha({ text: 'test', bg: 'f0f0f0', color: '333333' });
        assert.ok(Buffer.isBuffer(result.body));
    });

    test('throws on invalid color', () => {
        assert.throws(() => captcha({ text: 'test', bg: 'xyz' }), /color/i);
    });
});
