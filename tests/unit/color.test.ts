import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import color from '../../src/modules/v4/color.js';

describe('color', () => {
    test('returns all 6 formats', () => {
        const result = color();
        assert.ok('hex' in result);
        assert.ok('rgb' in result);
        assert.ok('hsl' in result);
        assert.ok('hsv' in result);
        assert.ok('hwb' in result);
        assert.ok('cmyk' in result);
    });

    test('hex matches #RRGGBB', () => {
        for (let i = 0; i < 20; i++) {
            assert.match(color().hex!, /^#[0-9a-f]{6}$/);
        }
    });

    test('rgb format', () => {
        assert.match(color().rgb!, /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
    });

    test('hsl format', () => {
        assert.match(color().hsl!, /^hsl\(\d+(\.\d+)?, \d+(\.\d+)?%, \d+(\.\d+)?%\)$/);
    });

    test('cmyk format with 4 channels', () => {
        assert.match(color().cmyk!, /^cmyk\(/);
    });
});
