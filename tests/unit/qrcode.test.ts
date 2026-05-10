import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import qrcode from '../../src/modules/v4/qrcode.js';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe('qrcode', () => {
    test('returns PNG buffer by default', async () => {
        const result = await qrcode({ url: 'https://example.com' });
        assert.equal(result.contentType, 'image/png');
        assert.ok(Buffer.isBuffer(result.body));
        assert.ok((result.body as Buffer).subarray(0, 4).equals(PNG_MAGIC));
    });

    test('returns data URL with format=base64', async () => {
        const result = await qrcode({ url: 'https://example.com', format: 'base64' });
        assert.equal(result.contentType, 'application/json');
        assert.match(result.body as string, /^data:image\/png;base64,/);
    });

    test('throws on invalid format', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', format: 'jpg' as 'png' }), /format/);
    });

    test('throws on missing url', async () => {
        await assert.rejects(() => qrcode({ url: '' }));
    });

    test('accepts custom size', async () => {
        const result = await qrcode({ url: 'https://example.com', size: 400 });
        assert.equal(result.contentType, 'image/png');
    });

    test('throws on invalid size', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', size: 9999 }), /size/);
    });

    test('accepts custom colors', async () => {
        const result = await qrcode({ url: 'https://example.com', dark: 'ff0000', light: 'ffffff' });
        assert.equal(result.contentType, 'image/png');
    });

    test('throws on invalid dark color', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', dark: 'xyz' }), /color/i);
    });

    test('throws on invalid light color', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', light: 'nope' }), /color/i);
    });

    test('accepts correction level', async () => {
        const result = await qrcode({ url: 'https://example.com', correction: 'H' });
        assert.equal(result.contentType, 'image/png');
    });

    test('throws on invalid correction level', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', correction: 'X' as 'L' }), /correction/);
    });

    test('accepts custom margin', async () => {
        const result = await qrcode({ url: 'https://example.com', margin: 0 });
        assert.equal(result.contentType, 'image/png');
    });

    test('throws on invalid margin', async () => {
        await assert.rejects(() => qrcode({ url: 'https://example.com', margin: 99 }), /margin/);
    });

    test('throws on non-HTTPS icon URL', async () => {
        await assert.rejects(
            () => qrcode({ url: 'https://example.com', icon: 'http://example.com/icon.png' }),
            /HTTPS/,
        );
    });

    test('throws on unreachable icon URL', async () => {
        await assert.rejects(
            () => qrcode({ url: 'https://example.com', icon: 'https://localhost:1/nope.png' }),
            /Failed to fetch icon|fetch/i,
        );
    });
});
