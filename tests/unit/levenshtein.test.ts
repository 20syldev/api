import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import levenshtein from '../../src/modules/v4/levenshtein.js';

describe('levenshtein', () => {
    test('identical strings: distance 0', () => {
        const result = levenshtein('hello', 'hello');
        assert.equal(result.distance, 0);
    });

    test('kitten / sitting: distance 3', () => {
        const result = levenshtein('kitten', 'sitting');
        assert.equal(result.distance, 3);
    });

    test('saturday / sunday: distance 3', () => {
        const result = levenshtein('saturday', 'sunday');
        assert.equal(result.distance, 3);
    });

    test('empty vs string: distance = string length', () => {
        const result = levenshtein('a', 'abc');
        assert.equal(result.distance, 2);
    });

    test('throws on missing first string', () => {
        assert.throws(() => levenshtein('', 'abc'), /first string/);
    });

    test('throws on string > 1000 chars', () => {
        const big = 'a'.repeat(1001);
        assert.throws(() => levenshtein(big, 'b'), /1000/);
    });
});
