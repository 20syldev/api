import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import convert from '../../src/modules/v4/convert.js';

describe('convert', () => {
    test('celsius to fahrenheit', () => {
        const result = convert(0, 'celsius', 'fahrenheit');
        assert.equal(result.result, 32);
    });

    test('celsius to kelvin', () => {
        const result = convert(0, 'celsius', 'kelvin');
        assert.equal(result.result, 273.15);
    });

    test('fahrenheit to celsius', () => {
        const result = convert(32, 'fahrenheit', 'celsius');
        assert.equal(result.result, 0);
    });

    test('kelvin to celsius', () => {
        const result = convert(273.15, 'kelvin', 'celsius');
        assert.equal(result.result, 0);
    });

    test('case-insensitive units', () => {
        const result = convert(100, 'CELSIUS', 'Fahrenheit');
        assert.equal(result.result, 212);
    });

    test('throws on invalid unit', () => {
        assert.throws(() => convert(100, 'celsius', 'banana'), /Invalid conversion/);
    });

    test('throws on absolute zero violation', () => {
        assert.throws(() => convert(-300, 'celsius', 'kelvin'), /absolute zero/);
    });

    test('km to mi', () => {
        const result = convert(1, 'km', 'mi');
        assert.ok(Math.abs(result.result - 0.621371) < 0.001);
    });

    test('kg to lb', () => {
        const result = convert(1, 'kg', 'lb');
        assert.ok(Math.abs(result.result - 2.20462) < 0.001);
    });

    test('kb to mb', () => {
        const result = convert(1024, 'kb', 'mb');
        assert.equal(result.result, 1);
    });

    test('km/h to mph', () => {
        const result = convert(100, 'km/h', 'mph');
        assert.ok(Math.abs(result.result - 62.1371) < 0.01);
    });

    test('negative values allowed for non-temperature', () => {
        const result = convert(-5, 'km', 'mi');
        assert.ok(result.result < 0);
    });

    test('throws on non-numeric value', () => {
        assert.throws(() => convert(NaN, 'celsius', 'kelvin'), /must be a number/);
    });
});
