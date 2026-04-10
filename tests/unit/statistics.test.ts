import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import statistics from '../../src/modules/v4/statistics.js';

describe('statistics', () => {
    test('basic computation on integers', () => {
        const result = statistics('1,2,3,4,5');
        assert.equal(result.count, 5);
        assert.equal(result.sum, 15);
        assert.equal(result.min, 1);
        assert.equal(result.max, 5);
        assert.equal(result.range, 4);
        assert.equal(result.mean, 3);
        assert.equal(result.median, 3);
    });

    test('median on even count', () => {
        const result = statistics('1,2,3,4');
        assert.equal(result.median, 2.5);
    });

    test('mode is empty when all values unique', () => {
        const result = statistics('1,2,3,4,5');
        assert.deepEqual(result.mode, []);
    });

    test('mode detects most frequent value', () => {
        const result = statistics('1,2,2,3,3,3');
        assert.deepEqual(result.mode, [3]);
    });

    test('multiple modes', () => {
        const result = statistics('1,1,2,2,3');
        assert.deepEqual(result.mode.sort(), [1, 2]);
    });

    test('stddev of identical values is 0', () => {
        const result = statistics('5,5,5,5');
        assert.equal(result.stddev, 0);
        assert.equal(result.variance, 0);
    });

    test('handles negative and decimal values', () => {
        const result = statistics('-1.5,0,1.5');
        assert.equal(result.mean, 0);
        assert.equal(result.min, -1.5);
        assert.equal(result.max, 1.5);
    });

    test('throws on non-numeric values', () => {
        assert.throws(() => statistics('1,abc,3'), /must contain only numbers/);
    });

    test('throws on missing values', () => {
        assert.throws(() => statistics(''), /required/);
    });
});
