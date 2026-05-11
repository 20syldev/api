import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import avatar from '../../src/modules/v4/avatar.js';

describe('avatar', () => {
    describe('determinism', () => {
        test('same seed returns identical PNG buffer', () => {
            const a = avatar({ seed: 'test-seed' });
            const b = avatar({ seed: 'test-seed' });
            assert.deepEqual(a.body, b.body);
        });

        test('different seeds return different buffers', () => {
            const a = avatar({ seed: 'seed-a' });
            const b = avatar({ seed: 'seed-b' });
            assert.notDeepEqual(a.body, b.body);
        });
    });

    describe('PNG format', () => {
        test('PNG buffer starts with PNG magic bytes', () => {
            const { body } = avatar({ seed: 'test', format: 'png' });
            assert.ok(Buffer.isBuffer(body));
            // PNG magic bytes: 89 50 4E 47
            const buf = body as Buffer;
            assert.equal(buf[0], 0x89);
            assert.equal(buf[1], 0x50);
            assert.equal(buf[2], 0x4e);
            assert.equal(buf[3], 0x47);
        });

        test('contentType is image/png', () => {
            const { contentType } = avatar({ seed: 'test', format: 'png' });
            assert.equal(contentType, 'image/png');
        });
    });

    describe('SVG format', () => {
        test('SVG output contains <svg', () => {
            const { body } = avatar({ seed: 'test', format: 'svg' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('contentType is image/svg+xml', () => {
            const { contentType } = avatar({ seed: 'test', format: 'svg' });
            assert.equal(contentType, 'image/svg+xml');
        });
    });

    describe('types', () => {
        test('identicon and pixel produce different outputs for same seed', () => {
            const a = avatar({ seed: 'test', type: 'identicon', format: 'svg' });
            const b = avatar({ seed: 'test', type: 'pixel', format: 'svg' });
            assert.notEqual(a.body, b.body);
        });

        test('no seed still returns valid output', () => {
            const { body, contentType } = avatar({ format: 'png' });
            assert.ok(Buffer.isBuffer(body));
            assert.equal(contentType, 'image/png');
        });
    });

    describe('errors', () => {
        test('invalid type throws', () => {
            assert.throws(() => avatar({ seed: 'test', type: 'geometric' }), /Type must be/);
        });

        test('invalid format throws', () => {
            assert.throws(() => avatar({ seed: 'test', format: 'gif' }), /Format must be/);
        });

        test('size below 50 throws', () => {
            assert.throws(() => avatar({ seed: 'test', size: 49 }), /Size must be/);
        });

        test('size above 2000 throws', () => {
            assert.throws(() => avatar({ seed: 'test', size: 2001 }), /Size must be/);
        });
    });
});
