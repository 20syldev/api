import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import geo from '../../src/modules/v4/geo.js';

describe('geo', () => {
    test('Paris to NYC distance ~5837 km', () => {
        const result = geo('48.8566', '2.3522', '40.7128', '-74.006');
        assert.ok(Math.abs(result.distance.km - 5837) < 50, `expected ~5837, got ${result.distance.km}`);
    });

    test('same point returns 0 km', () => {
        const result = geo('48.8566', '2.3522', '48.8566', '2.3522');
        assert.equal(result.distance.km, 0);
    });

    test('miles and nautical miles match km conversion', () => {
        const result = geo('0', '0', '0', '90');
        assert.ok(Math.abs(result.distance.miles - result.distance.km * 0.621371) < 0.01);
        assert.ok(Math.abs(result.distance.nauticalMiles - result.distance.km * 0.539957) < 0.01);
    });

    test('bearing N for due north', () => {
        const result = geo('0', '0', '10', '0');
        assert.equal(result.bearing.degrees, 0);
        assert.equal(result.bearing.cardinal, 'N');
    });

    test('bearing E for due east', () => {
        const result = geo('0', '0', '0', '10');
        assert.equal(result.bearing.degrees, 90);
        assert.equal(result.bearing.cardinal, 'E');
    });

    test('throws on invalid latitude', () => {
        assert.throws(() => geo('100', '0', '0', '0'), /lat1 must be between/);
    });

    test('throws on invalid longitude', () => {
        assert.throws(() => geo('0', '200', '0', '0'), /lon1 must be between/);
    });

    test('throws on non-numeric coords', () => {
        assert.throws(() => geo('abc', '0', '0', '0'), /must be a number/);
    });
});
