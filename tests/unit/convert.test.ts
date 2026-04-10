import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
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

    test('throws on non-numeric value', () => {
        assert.throws(() => convert('abc', 'celsius', 'kelvin'), /must be a number/);
    });
});
