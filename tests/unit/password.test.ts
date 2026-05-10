import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import password from '../../src/modules/v4/password.js';

describe('password', () => {
    describe('random mode', () => {
        test('default returns one password of length 16', () => {
            const r = password();
            assert.equal(r.passwords.length, 1);
            assert.equal(r.passwords[0]!.length, 16);
            assert.equal(r.type, 'random');
            assert.equal(r.length, 16);
        });

        test('length is respected', () => {
            const r = password('random', 32);
            assert.equal(r.passwords[0]!.length, 32);
        });

        test('no symbols when symbols=false', () => {
            const r = password('random', 64, { symbols: false });
            assert.ok(!/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(r.passwords[0]!));
        });

        test('only digits when only digits enabled', () => {
            const r = password('random', 16, { uppercase: false, lowercase: false, digits: true, symbols: false });
            assert.ok(/^\d+$/.test(r.passwords[0]!));
        });

        test('exclude chars are absent from password', () => {
            const r = password('random', 64, { exclude: 'aeiou' });
            assert.ok(!/[aeiou]/.test(r.passwords[0]!));
        });

        test('count=5 returns 5 passwords', () => {
            const r = password('random', 16, { count: 5 });
            assert.equal(r.passwords.length, 5);
        });

        test('entropy and strength are present', () => {
            const r = password();
            assert.ok(typeof r.entropy === 'number');
            assert.ok(['weak', 'moderate', 'strong', 'very_strong'].includes(r.strength));
        });
    });

    describe('passphrase mode', () => {
        test('returns words joined by separator', () => {
            const r = password('passphrase', 4, { separator: '-' });
            assert.equal(r.type, 'passphrase');
            const words = r.passwords[0]!.split('-');
            assert.equal(words.length, 4);
        });

        test('custom separator is used', () => {
            const r = password('passphrase', 3, { separator: '.' });
            assert.ok(r.passwords[0]!.includes('.'));
        });
    });

    describe('errors', () => {
        test('length below 8 throws', () => {
            assert.throws(() => password('random', 4), /Length must be between/);
        });

        test('length above 128 throws', () => {
            assert.throws(() => password('random', 200), /Length must be between/);
        });

        test('no charset active throws', () => {
            assert.throws(
                () => password('random', 16, { uppercase: false, lowercase: false, digits: false, symbols: false }),
                /At least one character set/,
            );
        });

        test('count above 20 throws', () => {
            assert.throws(() => password('random', 16, { count: 21 }), /Count must be between/);
        });

        test('invalid type throws', () => {
            assert.throws(() => password('invalid'), /Type must be/);
        });
    });
});
