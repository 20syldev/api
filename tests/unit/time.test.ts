import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

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

    describe('countdown', () => {
        test('future date returns direction future', () => {
            const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
            const r = time('countdown', undefined, undefined, undefined, undefined, future);
            assert.equal(r.direction, 'future');
        });

        test('past date returns direction past', () => {
            const past = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
            const r = time('countdown', undefined, undefined, undefined, undefined, past);
            assert.equal(r.direction, 'past');
        });

        test('remaining breakdown is correct', () => {
            const target = new Date(Date.now() + 2 * 86400 * 1000 + 3 * 3600 * 1000).toISOString();
            const r = time('countdown', undefined, undefined, undefined, undefined, target);
            const rem = r.remaining as { days: number; hours: number };
            assert.equal(rem.days, 2);
            assert.equal(rem.hours, 3);
        });

        test('human skips zero units', () => {
            const target = new Date(Date.now() + 3 * 86400 * 1000).toISOString();
            const r = time('countdown', undefined, undefined, undefined, undefined, target);
            assert.ok(!(r.human as string).includes('hour'));
            assert.ok(!(r.human as string).includes('minute'));
        });

        test('throws on missing target', () => {
            assert.throws(() => time('countdown'), /target date/);
        });

        test('throws on invalid target', () => {
            assert.throws(
                () => time('countdown', undefined, undefined, undefined, undefined, 'not-a-date'),
                /valid target date/,
            );
        });

        test('throws if target is more than 100 years away', () => {
            assert.throws(
                () => time('countdown', undefined, undefined, undefined, undefined, '2200-01-01'),
                /100 years/,
            );
        });
    });
});
