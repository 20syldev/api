import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { luhn, iban, email } from '../../src/modules/v4/validate.js';

describe('validate', () => {
    describe('luhn', () => {
        test('valid Visa test card', () => {
            const result = luhn('4111111111111111');
            assert.equal(result.valid, true);
        });

        test('invalid card number', () => {
            const result = luhn('4111111111111112');
            assert.equal(result.valid, false);
        });

        test('strips spaces and dashes', () => {
            const result = luhn('4111-1111 1111-1111');
            assert.equal(result.valid, true);
            assert.equal(result.value, '4111111111111111');
        });

        test('throws on non-digit', () => {
            assert.throws(() => luhn('4111ABC11111111'), /only digits/);
        });

        test('throws on too short', () => {
            assert.throws(() => luhn('411111'), /between 12 and 19/);
        });
    });

    describe('iban', () => {
        test('valid French IBAN', () => {
            const result = iban('FR1420041010050500013M02606');
            assert.equal(result.valid, true);
            assert.equal(result.country, 'FR');
        });

        test('invalid checksum', () => {
            const result = iban('FR1420041010050500013M02607');
            assert.equal(result.valid, false);
        });

        test('strips spaces', () => {
            const result = iban('FR14 2004 1010 0505 0001 3M02 606');
            assert.equal(result.valid, true);
        });

        test('throws on bad format', () => {
            assert.throws(() => iban('1234'), /Invalid IBAN format/);
        });
    });

    describe('email', () => {
        test('valid email', () => {
            assert.equal(email('hello@example.com').valid, true);
        });

        test('rejects missing domain', () => {
            assert.equal(email('hello@').valid, false);
        });

        test('rejects missing @', () => {
            assert.equal(email('helloexample.com').valid, false);
        });

        test('rejects spaces', () => {
            assert.equal(email('hello world@example.com').valid, false);
        });
    });
});
