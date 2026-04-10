import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import time from '../../src/modules/v4/time.js';

describe('time', () => {
    test('live returns full set of formats', () => {
        const result = time('live');
        const fields = [
            'iso',
            'utc',
            'timestamp',
            'locale',
            'date',
            'time',
            'year',
            'month',
            'day',
            'hour',
            'minute',
            'second',
            'ms',
            'dayOfWeek',
            'dayOfYear',
            'weekNumber',
            'timezone',
            'timezoneOffset',
        ];
        for (const f of fields) {
            assert.ok(f in result, `missing field: ${f}`);
        }
    });

    test('iso is parseable', () => {
        const result = time('live');
        assert.ok(!isNaN(Date.parse(result.iso as string)));
    });

    test('format=year returns only date', () => {
        const result = time('live', undefined, undefined, 'year');
        assert.ok('date' in result);
        assert.equal(typeof result.date, 'number');
    });

    test('random within range', () => {
        const result = time('random', '2020-01-01', '2020-12-31');
        const ts = result.timestamp as number;
        assert.ok(ts >= new Date('2020-01-01').getTime());
        assert.ok(ts <= new Date('2020-12-31').getTime());
    });

    test('throws on invalid type', () => {
        assert.throws(() => time('foo'), /valid type/);
    });

    test('throws on invalid format', () => {
        assert.throws(() => time('live', undefined, undefined, 'fakeformat'), /valid format/);
    });

    test('throws on invalid timezone', () => {
        assert.throws(() => time('live', undefined, undefined, undefined, 'Mars/Olympus'), /valid timezone/);
    });

    test('Europe/Paris timezone', () => {
        const result = time('live', undefined, undefined, undefined, 'Europe/Paris');
        assert.equal(result.timezone, 'Europe/Paris');
    });
});
