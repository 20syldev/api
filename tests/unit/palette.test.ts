import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import palette from '../../src/modules/v4/palette.js';

describe('palette', () => {
    test('complementary returns 2 colors', () => {
        const result = palette('#ff6600', 'complementary');
        assert.equal(result.colors.length, 2);
        assert.equal(result.type, 'complementary');
    });

    test('triadic returns 3 colors', () => {
        const result = palette('#ff6600', 'triadic');
        assert.equal(result.colors.length, 3);
    });

    test('analogous returns 5 colors', () => {
        const result = palette('#ff6600', 'analogous');
        assert.equal(result.colors.length, 5);
    });

    test('tetradic returns 4 colors', () => {
        const result = palette('#0066ff', 'tetradic');
        assert.equal(result.colors.length, 4);
    });

    test('split-complementary returns 3 colors', () => {
        const result = palette('#0066ff', 'split-complementary');
        assert.equal(result.colors.length, 3);
    });

    test('each color has hex/rgb/hsl', () => {
        const result = palette('#ff6600', 'triadic');
        for (const c of result.colors) {
            assert.match(c.hex, /^#[0-9a-f]{6}$/);
            assert.match(c.rgb, /^rgb\(/);
            assert.match(c.hsl, /^hsl\(/);
        }
    });

    test('base color is included', () => {
        const result = palette('#ff6600', 'complementary');
        assert.equal(result.base.hex, '#ff6600');
    });

    test('throws on invalid hex', () => {
        assert.throws(() => palette('#zzz', 'triadic'), /Invalid HEX/);
    });

    test('throws on unknown type', () => {
        assert.throws(() => palette('#ff6600', 'rainbow'), /must be one of/);
    });
});
