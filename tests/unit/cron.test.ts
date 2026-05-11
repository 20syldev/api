import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import cron from '../../src/modules/v4/cron.js';

// Fixed reference point: a known Monday at 08:45 UTC
const FROM = '2026-01-05T08:45:00Z'; // Monday

describe('cron', () => {
    describe('every minute', () => {
        test('* * * * * returns 5 consecutive minutes', () => {
            const r = cron('* * * * *', 5, FROM);
            assert.equal(r.next.length, 5);
            // First result should be the next minute after FROM
            assert.ok(r.next[0]!.startsWith('2026-01-05T08:46'));
        });

        test('description is "Every minute"', () => {
            const r = cron('* * * * *', 1, FROM);
            assert.equal(r.description, 'Every minute');
        });
    });

    describe('every N minutes', () => {
        test('*/15 * * * * returns results 15 minutes apart', () => {
            const r = cron('*/15 * * * *', 3, FROM);
            assert.equal(r.next.length, 3);
            assert.ok(r.next[0]!.includes('T09:00'));
            assert.ok(r.next[1]!.includes('T09:15'));
            assert.ok(r.next[2]!.includes('T09:30'));
        });

        test('description mentions every 15 minutes', () => {
            const r = cron('*/15 * * * *', 1, FROM);
            assert.match(r.description, /Every 15 minutes/);
        });
    });

    describe('at fixed time', () => {
        test('0 9 * * 1-5 fires at 09:00 on weekdays', () => {
            const r = cron('0 9 * * 1-5', 3, FROM);
            // Next Monday 09:00 is same day
            assert.ok(r.next[0]!.includes('T09:00'));
            // All results should be on weekdays (Mon–Fri)
            for (const date of r.next) {
                const d = new Date(date);
                const dow = d.getUTCDay();
                assert.ok(dow >= 1 && dow <= 5, `Expected weekday, got ${dow}`);
            }
        });

        test('description includes Monday through Friday', () => {
            const r = cron('0 9 * * 1-5', 1, FROM);
            assert.match(r.description, /Monday through Friday/);
        });
    });

    describe('plan example', () => {
        test('*/15 9-17 * * 1-5 fires between 09:00 and 17:45 on weekdays', () => {
            const r = cron('*/15 9-17 * * 1-5', 5, FROM);
            assert.equal(r.next.length, 5);
            for (const date of r.next) {
                const d = new Date(date);
                const hour = d.getUTCHours();
                assert.ok(hour >= 9 && hour <= 17);
                const dow = d.getUTCDay();
                assert.ok(dow >= 1 && dow <= 5);
            }
        });

        test('description includes "Every 15 minutes"', () => {
            const r = cron('*/15 9-17 * * 1-5', 1, FROM);
            assert.match(r.description, /Every 15 minutes/);
        });
    });

    describe('count', () => {
        test('count=10 returns 10 results', () => {
            const r = cron('* * * * *', 10, FROM);
            assert.equal(r.next.length, 10);
        });

        test('count=1 returns 1 result', () => {
            const r = cron('*/30 * * * *', 1, FROM);
            assert.equal(r.next.length, 1);
        });
    });

    describe('errors', () => {
        test('missing expr throws', () => {
            assert.throws(() => cron(''), /expression/);
        });

        test('too few fields throws', () => {
            assert.throws(() => cron('* * * *'), /5 fields/);
        });

        test('invalid range throws', () => {
            assert.throws(() => cron('60-70 * * * *'), /valid: 0-59/);
        });

        test('invalid timezone throws', () => {
            assert.throws(() => cron('* * * * *', 5, undefined, 'Mars/Olympus'), /timezone/);
        });

        test('count out of range throws', () => {
            assert.throws(() => cron('* * * * *', 21), /Count/);
        });
    });
});
