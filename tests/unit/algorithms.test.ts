import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import {
    anagram,
    factorial,
    fibonacci,
    gcd,
    isprime,
    palindrome,
    primefactors,
    reverse,
    roman,
} from '../../src/modules/v4/algorithms.js';

describe('algorithms', () => {
    describe('anagram', () => {
        test('listen / silent', () => {
            assert.equal(anagram('listen', 'silent'), true);
        });

        test('hello / world', () => {
            assert.equal(anagram('hello', 'world'), false);
        });
    });

    describe('factorial', () => {
        test('5! = 120', () => {
            assert.equal(factorial(5), 120);
        });

        test('0! = 1', () => {
            assert.equal(factorial(0), 1);
        });

        test('throws on negative', () => {
            assert.throws(() => factorial(-1), /positive/);
        });
    });

    describe('fibonacci', () => {
        test('first 10 values', () => {
            assert.deepEqual(fibonacci(10), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
        });
    });

    describe('gcd', () => {
        test('gcd(12, 18) = 6', () => {
            assert.equal(gcd(12, 18), 6);
        });

        test('gcd(7, 13) = 1', () => {
            assert.equal(gcd(7, 13), 1);
        });
    });

    describe('isprime', () => {
        test('17 is prime', () => {
            assert.equal(isprime(17), true);
        });

        test('15 is not prime', () => {
            assert.equal(isprime(15), false);
        });
    });

    describe('palindrome', () => {
        test('madam is palindrome', () => {
            assert.equal(palindrome('madam'), true);
        });

        test('hello is not', () => {
            assert.equal(palindrome('hello'), false);
        });
    });

    describe('primefactors', () => {
        test('factors of 60', () => {
            assert.deepEqual(primefactors(60), [2, 2, 3, 5]);
        });
    });

    describe('reverse', () => {
        test('reverses a string', () => {
            assert.equal(reverse('abc'), 'cba');
        });
    });

    describe('roman', () => {
        test('2024 → MMXXIV', () => {
            assert.equal(roman('2024'), 'MMXXIV');
        });

        test('MMXXIV → 2024', () => {
            assert.equal(roman('MMXXIV'), 2024);
        });

        test('1 → I', () => {
            assert.equal(roman('1'), 'I');
        });

        test('3999 → MMMCMXCIX', () => {
            assert.equal(roman('3999'), 'MMMCMXCIX');
        });

        test('round-trip 1..100', () => {
            for (let i = 1; i <= 100; i++) {
                const r = roman(String(i));
                assert.equal(roman(r as string), i);
            }
        });

        test('throws on out of range', () => {
            assert.throws(() => roman('4000'), /between 1 and 3999/);
        });

        test('throws on invalid roman', () => {
            assert.throws(() => roman('XYZ'), /Invalid Roman/);
        });
    });
});
