import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import address from '../../src/modules/v4/address.js';

describe('address', () => {
    describe('default behavior', () => {
        test('returns an addresses array with one entry by default', () => {
            const r = address();
            assert.equal(r.addresses.length, 1);
        });

        test('each address has required fields', () => {
            const r = address();
            const a = r.addresses[0]!;
            assert.ok(a.street);
            assert.ok(a.city);
            assert.ok(a.zip);
            assert.ok(a.state);
            assert.ok(a.country);
            assert.ok(a.countryCode);
        });
    });

    describe('country filtering', () => {
        test('fr returns a French address', () => {
            const r = address('fr');
            assert.equal(r.addresses[0]!.countryCode, 'FR');
            assert.equal(r.addresses[0]!.country, 'France');
        });

        test('us returns a US address', () => {
            const r = address('us');
            assert.equal(r.addresses[0]!.countryCode, 'US');
            assert.equal(r.addresses[0]!.country, 'United States');
        });

        test('uk returns a UK address', () => {
            const r = address('uk');
            assert.equal(r.addresses[0]!.countryCode, 'UK');
        });

        test('de returns a German address', () => {
            const r = address('de');
            assert.equal(r.addresses[0]!.countryCode, 'DE');
        });

        test('es returns a Spanish address', () => {
            const r = address('es');
            assert.equal(r.addresses[0]!.countryCode, 'ES');
        });

        test('country code is case-insensitive', () => {
            const r = address('FR');
            assert.equal(r.addresses[0]!.countryCode, 'FR');
        });
    });

    describe('count', () => {
        test('count=5 returns 5 addresses', () => {
            const r = address('fr', 5);
            assert.equal(r.addresses.length, 5);
        });

        test('count=10 returns 10 addresses', () => {
            const r = address('us', 10);
            assert.equal(r.addresses.length, 10);
        });
    });

    describe('errors', () => {
        test('unknown country throws', () => {
            assert.throws(() => address('xx'), /Unknown country code/);
        });

        test('count=0 throws', () => {
            assert.throws(() => address('fr', 0), /Count must be between/);
        });

        test('count=11 throws', () => {
            assert.throws(() => address('fr', 11), /Count must be between/);
        });
    });
});
