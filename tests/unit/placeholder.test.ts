import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import placeholder from '../../src/modules/v4/placeholder.js';

describe('placeholder', () => {
    test('image returns SVG with text', () => {
        const result = placeholder('image', { width: '200', height: '100', text: 'Hello' });
        assert.equal(result.type, 'image');
        assert.equal(result.contentType, 'image/svg+xml');
        assert.match(result.body, /<svg/);
        assert.match(result.body, /Hello/);
    });

    test('skeleton returns SVG with animation', () => {
        const result = placeholder('skeleton', { width: '300', height: '200' });
        assert.equal(result.type, 'skeleton');
        assert.equal(result.contentType, 'image/svg+xml');
        assert.match(result.body, /<svg/);
    });

    test('default dimensions 800x600', () => {
        const result = placeholder('image', {});
        assert.match(result.body, /width="800"/);
        assert.match(result.body, /height="600"/);
    });

    test('skeleton with avatar', () => {
        const result = placeholder('skeleton', { avatar: 'circle' });
        assert.match(result.body, /<circle/);
    });

    test('skeleton with rows', () => {
        const result = placeholder('skeleton', { rows: '5' });
        assert.match(result.body, /<rect/);
    });

    test('animate none removes animation', () => {
        const result = placeholder('skeleton', { animate: 'none' });
        assert.ok(!result.body.includes('<animate'));
    });

    test('throws on invalid type', () => {
        assert.throws(() => placeholder('video', {}), /Type must be one of/);
    });

    test('throws on invalid width', () => {
        assert.throws(() => placeholder('image', { width: '5000' }), /width/);
    });

    test('throws on invalid avatar shape', () => {
        assert.throws(() => placeholder('skeleton', { avatar: 'hexagon' }), /avatar/);
    });

    test('throws on invalid speed', () => {
        assert.throws(() => placeholder('skeleton', { speed: '99' }), /speed/);
    });
});
