import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import qrcode from '../../src/modules/v4/qrcode.js';

describe('qrcode', () => {
    test('returns data URL for valid url', async () => {
        const result = await qrcode('https://example.com');
        assert.match(result, /^data:image\/png;base64,/);
    });

    test('throws on missing url', async () => {
        await assert.rejects(() => qrcode(''));
    });
});
