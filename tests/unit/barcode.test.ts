import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import barcode from '../../src/modules/v4/barcode.js';

describe('barcode', () => {
    describe('Code 128', () => {
        test('returns SVG with <rect elements', () => {
            const { body, contentType } = barcode({ data: 'Hello123' });
            assert.equal(contentType, 'image/svg+xml');
            assert.ok(typeof body === 'string' && body.includes('<rect'));
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('invalid ASCII char throws', () => {
            assert.throws(() => barcode({ data: 'Héllo' }), /ASCII 32-126/);
        });
    });

    describe('EAN-13', () => {
        test('12 digits: check digit auto-calculated', () => {
            // 978030640615 → check digit 7 → 9780306406157
            const { body } = barcode({ data: '978030640615', type: 'ean13' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('13 valid digits: accepted', () => {
            const { body } = barcode({ data: '9780306406157', type: 'ean13' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('wrong check digit throws', () => {
            assert.throws(() => barcode({ data: '9780306406150', type: 'ean13' }), /check digit/);
        });

        test('non-digits throws', () => {
            assert.throws(() => barcode({ data: 'abcdefghijklm', type: 'ean13' }), /12 or 13 digits/);
        });
    });

    describe('EAN-8', () => {
        test('7 digits: check digit auto-calculated', () => {
            const { body } = barcode({ data: '1234567', type: 'ean8' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('wrong length throws', () => {
            assert.throws(() => barcode({ data: '12345', type: 'ean8' }), /7 or 8 digits/);
        });
    });

    describe('UPC-A', () => {
        test('11 digits: check digit auto-calculated', () => {
            const { body } = barcode({ data: '01234567890', type: 'upca' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });
    });

    describe('Code 39', () => {
        test('valid string encodes to SVG', () => {
            const { body } = barcode({ data: 'HELLO-39', type: 'code39' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('lowercase is accepted (auto-uppercased)', () => {
            const { body } = barcode({ data: 'hello', type: 'code39' });
            assert.ok(typeof body === 'string' && body.includes('<svg'));
        });

        test('invalid character throws', () => {
            assert.throws(() => barcode({ data: 'HÉLLO', type: 'code39' }), /invalid character/i);
        });
    });

    describe('PNG format', () => {
        test('returns PNG buffer', () => {
            const { body, contentType } = barcode({ data: 'TEST', format: 'png' });
            assert.equal(contentType, 'image/png');
            assert.ok(Buffer.isBuffer(body));
            const buf = body as Buffer;
            assert.equal(buf[0], 0x89);
            assert.equal(buf[1], 0x50);
        });
    });

    describe('colors', () => {
        test('custom color appears in SVG', () => {
            const { body } = barcode({ data: 'TEST', color: '#ff0000' });
            assert.ok(typeof body === 'string' && body.includes('#ff0000'));
        });

        test('custom bg appears in SVG', () => {
            const { body } = barcode({ data: 'TEST', bg: '#ffff00' });
            assert.ok(typeof body === 'string' && body.includes('#ffff00'));
        });
    });

    describe('errors', () => {
        test('missing data throws', () => {
            assert.throws(() => barcode({ data: '' }), /data/i);
        });

        test('unknown type throws', () => {
            assert.throws(() => barcode({ data: 'TEST', type: 'qr' }), /Type must be/);
        });

        test('invalid format throws', () => {
            assert.throws(() => barcode({ data: 'TEST', format: 'jpg' }), /Format must be/);
        });

        test('width out of range throws', () => {
            assert.throws(() => barcode({ data: 'TEST', width: 6 }), /Width must be/);
        });

        test('height out of range throws', () => {
            assert.throws(() => barcode({ data: 'TEST', height: 49 }), /Height must be/);
        });
    });
});
