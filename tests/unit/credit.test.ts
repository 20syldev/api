import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import credit from '../../src/modules/v4/credit.js';
import { luhn } from '../../src/modules/v4/validate.js';

describe('credit', () => {
    describe('Luhn validity', () => {
        test('generated visa card passes Luhn check', () => {
            const { cards } = credit('visa', 1, 'full');
            const { valid } = luhn(cards[0]!.number);
            assert.equal(valid, true);
        });

        test('generated mastercard passes Luhn check', () => {
            const { cards } = credit('mastercard', 1, 'full');
            const { valid } = luhn(cards[0]!.number);
            assert.equal(valid, true);
        });

        test('generated amex passes Luhn check', () => {
            const { cards } = credit('amex', 1, 'full');
            const { valid } = luhn(cards[0]!.number);
            assert.equal(valid, true);
        });

        test('generated discover passes Luhn check', () => {
            const { cards } = credit('discover', 1, 'full');
            const { valid } = luhn(cards[0]!.number);
            assert.equal(valid, true);
        });
    });

    describe('brand prefixes', () => {
        test('visa starts with 4', () => {
            const { cards } = credit('visa', 1, 'full');
            assert.ok(cards[0]!.number.startsWith('4'));
        });

        test('mastercard starts with 51-55', () => {
            const { cards } = credit('mastercard', 1, 'full');
            const prefix = parseInt(cards[0]!.number.slice(0, 2), 10);
            assert.ok(prefix >= 51 && prefix <= 55);
        });

        test('amex starts with 34 or 37', () => {
            const { cards } = credit('amex', 1, 'full');
            const prefix = cards[0]!.number.slice(0, 2);
            assert.ok(prefix === '34' || prefix === '37');
        });

        test('discover starts with 6011 or 65', () => {
            const { cards } = credit('discover', 1, 'full');
            const num = cards[0]!.number;
            assert.ok(num.startsWith('6011') || num.startsWith('65'));
        });
    });

    describe('card lengths', () => {
        test('amex has 15 digits', () => {
            const { cards } = credit('amex', 1, 'full');
            assert.equal(cards[0]!.number.length, 15);
        });

        test('visa has 16 digits', () => {
            const { cards } = credit('visa', 1, 'full');
            assert.equal(cards[0]!.number.length, 16);
        });

        test('mastercard has 16 digits', () => {
            const { cards } = credit('mastercard', 1, 'full');
            assert.equal(cards[0]!.number.length, 16);
        });
    });

    describe('CVV', () => {
        test('amex CVV has 4 digits', () => {
            const { cards } = credit('amex', 1, 'full');
            assert.equal(cards[0]!.cvv.length, 4);
            assert.match(cards[0]!.cvv, /^\d{4}$/);
        });

        test('visa CVV has 3 digits', () => {
            const { cards } = credit('visa', 1, 'full');
            assert.equal(cards[0]!.cvv.length, 3);
            assert.match(cards[0]!.cvv, /^\d{3}$/);
        });
    });

    describe('masked format', () => {
        test('number hides middle digits for visa (4-***-4)', () => {
            const { cards } = credit('visa', 1, 'masked');
            // 4 visible + 8 stars + 4 visible = 16 total chars
            assert.match(cards[0]!.number, /^\d{4}\*{8}\d{4}$/);
        });

        test('formatted uses spaced groups for visa (4-*-4)', () => {
            const { cards } = credit('visa', 1, 'masked');
            assert.match(cards[0]!.formatted, /^\d{4} \*{8} \d{4}$/);
        });

        test('formatted uses spaced groups for amex (4-*-5)', () => {
            const { cards } = credit('amex', 1, 'masked');
            assert.match(cards[0]!.formatted, /^\d{4} \*{6} \d{5}$/);
        });

        test('luhn field is always true', () => {
            const { cards } = credit('visa', 1, 'full');
            assert.equal(cards[0]!.luhn, true);
        });
    });

    describe('count', () => {
        test('count=3 returns 3 cards', () => {
            const { cards } = credit('visa', 3, 'full');
            assert.equal(cards.length, 3);
        });
    });

    describe('errors', () => {
        test('unknown brand throws', () => {
            assert.throws(() => credit('diners'), /Unknown brand/);
        });

        test('count 0 throws', () => {
            assert.throws(() => credit('visa', 0), /Count must be/);
        });

        test('count 11 throws', () => {
            assert.throws(() => credit('visa', 11), /Count must be/);
        });

        test('invalid format throws', () => {
            assert.throws(() => credit('visa', 1, 'partial'), /Format must be/);
        });
    });
});
