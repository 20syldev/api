import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import dice from '../../src/modules/v4/dice.js';

describe('dice', () => {
    test('parses 2d6+3 notation', () => {
        const result = dice('2d6+3');
        assert.equal(result.count, 2);
        assert.equal(result.sides, 6);
        assert.equal(result.modifier, 3);
        assert.equal(result.results.length, 2);
    });

    test('total includes positive modifier', () => {
        const result = dice('1d2+10');
        assert.equal(result.modifier, 10);
        assert.ok(result.total === 11 || result.total === 12);
    });

    test('negative modifier', () => {
        const result = dice('1d2-5');
        assert.equal(result.modifier, -5);
        assert.ok(result.total === -4 || result.total === -3);
    });

    test('default count of 1 when omitted', () => {
        const result = dice('d20');
        assert.equal(result.count, 1);
        assert.equal(result.sides, 20);
    });

    test('all results are within 1..sides', () => {
        for (let i = 0; i < 50; i++) {
            const result = dice('5d10');
            for (const r of result.results) {
                assert.ok(r >= 1 && r <= 10, `result ${r} out of range`);
            }
        }
    });

    test('handles space instead of +', () => {
        const result = dice('2d6 3');
        assert.equal(result.modifier, 3);
    });

    test('throws on invalid notation', () => {
        assert.throws(() => dice('2x6'), /Invalid notation/);
    });

    test('throws on too many dice', () => {
        assert.throws(() => dice('200d6'), /between 1 and 100/);
    });

    test('throws on invalid sides', () => {
        assert.throws(() => dice('2d1'), /between 2 and 1000/);
    });
});
