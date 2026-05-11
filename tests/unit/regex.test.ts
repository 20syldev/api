import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import regex from '../../src/modules/v4/regex.js';

describe('regex', () => {
    describe('basic matching', () => {
        test('finds a simple match', () => {
            const r = regex('hello', 'hello world');
            assert.equal(r.valid, true);
            assert.equal(r.count, 1);
            assert.equal(r.matches[0]!.match, 'hello');
            assert.equal(r.matches[0]!.index, 0);
        });

        test('finds multiple matches', () => {
            const r = regex('\\d+', 'abc 42 def 7');
            assert.equal(r.count, 2);
            assert.equal(r.matches[0]!.match, '42');
            assert.equal(r.matches[1]!.match, '7');
        });

        test('no match returns empty array', () => {
            const r = regex('xyz', 'hello world');
            assert.equal(r.valid, true);
            assert.equal(r.count, 0);
            assert.deepEqual(r.matches, []);
        });
    });

    describe('flags', () => {
        test('flag i enables case-insensitive matching', () => {
            const r = regex('hello', 'HELLO world', 'i');
            assert.equal(r.count, 1);
            assert.equal(r.matches[0]!.match, 'HELLO');
        });

        test('invalid flag x is silently ignored', () => {
            const r = regex('hello', 'hello world', 'x');
            assert.equal(r.valid, true);
            assert.equal(r.count, 1);
        });

        test('g flag is always present', () => {
            const r = regex('a', 'aaa', '');
            assert.ok(r.flags.includes('g'));
        });
    });

    describe('capture groups', () => {
        test('numbered groups are returned', () => {
            const r = regex('(\\d{4})-(\\d{2})', '2026-05');
            assert.deepEqual(r.matches[0]!.groups, ['2026', '05']);
        });

        test('named groups are returned', () => {
            const r = regex('(?<year>\\d{4})-(?<month>\\d{2})', '2026-05');
            assert.equal(r.matches[0]!.namedGroups.year, '2026');
            assert.equal(r.matches[0]!.namedGroups.month, '05');
        });

        test('no groups returns empty arrays', () => {
            const r = regex('hello', 'hello');
            assert.deepEqual(r.matches[0]!.groups, []);
            assert.deepEqual(r.matches[0]!.namedGroups, {});
        });
    });

    describe('invalid pattern', () => {
        test('invalid regex returns valid: false', () => {
            const r = regex('[invalid', 'hello');
            assert.equal(r.valid, false);
            assert.equal(r.count, 0);
            assert.deepEqual(r.matches, []);
        });
    });

    describe('errors', () => {
        test('missing pattern throws', () => {
            assert.throws(() => regex('', 'hello'), /pattern/);
        });

        test('missing text throws', () => {
            assert.throws(() => regex('hello', ''), /text/);
        });

        test('pattern too long throws', () => {
            assert.throws(() => regex('a'.repeat(201), 'hello'), /200/);
        });

        test('text too long throws', () => {
            assert.throws(() => regex('hello', 'a'.repeat(1001)), /1000/);
        });
    });
});
