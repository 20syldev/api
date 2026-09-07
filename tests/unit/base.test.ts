import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import base from '../../src/modules/v5/base.js';

describe('base', () => {
    test('decimal to hexadecimal', () => {
        const result = base('255', 10, 16);
        assert.equal(result.result, 'ff');
        assert.equal(result.value, '255');
        assert.equal(result.from, 10);
        assert.equal(result.to, 16);
    });

    test('hexadecimal to decimal', () => {
        assert.equal(base('ff', 16, 10).result, '255');
    });

    test('uppercase input is accepted', () => {
        assert.equal(base('FF', 16, 10).result, '255');
    });

    test('binary to decimal', () => {
        assert.equal(base('1010', 2, 10).result, '10');
    });

    test('decimal to binary', () => {
        assert.equal(base('42', 10, 2).result, '101010');
    });

    test('octal to hexadecimal', () => {
        assert.equal(base('377', 8, 16).result, 'ff');
    });

    test('base36 to decimal', () => {
        assert.equal(base('zz', 36, 10).result, '1295');
    });

    test('negative number is preserved', () => {
        assert.equal(base('-10', 10, 2).result, '-1010');
    });

    test('negative zero drops the sign', () => {
        assert.equal(base('-0', 10, 2).result, '0');
    });

    test('defaults to base 10 -> 16', () => {
        const result = base('255');
        assert.equal(result.from, 10);
        assert.equal(result.to, 16);
        assert.equal(result.result, 'ff');
    });

    test('keeps precision beyond Number.MAX_SAFE_INTEGER', () => {
        const big = '99999999999999999999999999';
        const hex = base(big, 10, 16).result;
        assert.equal(base(hex, 16, 10).result, big);
    });

    test('throws on missing value', () => {
        assert.throws(() => base(''), /value/);
    });

    test('throws on invalid value for the base', () => {
        assert.throws(() => base('zz', 10, 16), /Invalid value for base 10/);
        assert.throws(() => base('102', 2, 10), /Invalid value for base 2/);
    });

    test('throws on base below 2', () => {
        assert.throws(() => base('10', 1, 16), /between 2 and 36/);
    });

    test('throws on base above 36', () => {
        assert.throws(() => base('10', 10, 37), /between 2 and 36/);
    });

    test('throws on non-numeric base', () => {
        assert.throws(() => base('10', NaN, 16), /number/);
    });

    test('throws on value too long', () => {
        assert.throws(() => base('1'.repeat(101)), /100/);
    });
});
