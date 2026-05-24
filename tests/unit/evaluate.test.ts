import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import evaluate from '../../src/modules/v5/evaluate.js';

describe('evaluate', () => {
    describe('basic arithmetic', () => {
        test('addition', () => {
            assert.equal(evaluate('2+3').result, 5);
        });
        test('subtraction', () => {
            assert.equal(evaluate('10-4').result, 6);
        });
        test('multiplication', () => {
            assert.equal(evaluate('3*7').result, 21);
        });
        test('division', () => {
            assert.equal(evaluate('15/3').result, 5);
        });
        test('modulo', () => {
            assert.equal(evaluate('10%3').result, 1);
        });
    });

    describe('operator precedence', () => {
        test('multiplication before addition', () => {
            assert.equal(evaluate('2+3*4').result, 14);
        });
        test('parentheses override precedence', () => {
            assert.equal(evaluate('(2+3)*4').result, 20);
        });
        test('nested parentheses', () => {
            assert.equal(evaluate('((2+3)*4)-1').result, 19);
        });
    });

    describe('power operator', () => {
        test('basic power', () => {
            assert.equal(evaluate('2^10').result, 1024);
        });
        test('right-associative: 2^2^3 = 2^(2^3) = 256', () => {
            assert.equal(evaluate('2^2^3').result, 256);
        });
    });

    describe('unary operators', () => {
        test('unary minus', () => {
            assert.equal(evaluate('-5').result, -5);
        });
        test('unary plus', () => {
            assert.equal(evaluate('+3').result, 3);
        });
        test('unary minus with expression', () => {
            assert.equal(evaluate('-(2+3)').result, -5);
        });
    });

    describe('functions', () => {
        test('sqrt(9) = 3', () => {
            assert.equal(evaluate('sqrt(9)').result, 3);
        });
        test('abs(-5) = 5', () => {
            assert.equal(evaluate('abs(-5)').result, 5);
        });
        test('ceil(2.3) = 3', () => {
            assert.equal(evaluate('ceil(2.3)').result, 3);
        });
        test('floor(2.7) = 2', () => {
            assert.equal(evaluate('floor(2.7)').result, 2);
        });
        test('round(2.5) = 3', () => {
            assert.equal(evaluate('round(2.5)').result, 3);
        });
        test('sin(0) = 0', () => {
            assert.equal(evaluate('sin(0)').result, 0);
        });
        test('cos(0) = 1', () => {
            assert.equal(evaluate('cos(0)').result, 1);
        });
        test('log(1) = 0', () => {
            assert.equal(evaluate('log(1)').result, 0);
        });
        test('log2(8) = 3', () => {
            assert.equal(evaluate('log2(8)').result, 3);
        });
        test('log10(100) = 2', () => {
            assert.equal(evaluate('log10(100)').result, 2);
        });
        test('exp(0) = 1', () => {
            assert.equal(evaluate('exp(0)').result, 1);
        });
        test('min(3, 7) = 3', () => {
            assert.equal(evaluate('min(3,7)').result, 3);
        });
        test('max(3, 7) = 7', () => {
            assert.equal(evaluate('max(3,7)').result, 7);
        });
    });

    describe('constants', () => {
        test('pi', () => {
            const { result } = evaluate('pi', 5);
            assert.equal(result, 3.14159);
        });
        test('e', () => {
            const { result } = evaluate('e', 5);
            assert.equal(result, 2.71828);
        });
        test('expression using pi', () => {
            const { result } = evaluate('2*pi', 4);
            assert.ok(result > 6.28 && result < 6.29);
        });
    });

    describe('precision', () => {
        test('default precision is 10', () => {
            const { precision } = evaluate('1/3');
            assert.equal(precision, 10);
        });
        test('precision=2 rounds to 2 decimals', () => {
            assert.equal(evaluate('1/3', 2).result, 0.33);
        });
        test('precision=5 rounds to 5 decimals', () => {
            assert.equal(evaluate('1/3', 5).result, 0.33333);
        });
        test('precision=0 returns integer', () => {
            assert.equal(evaluate('3.7', 0).result, 4);
        });
        test('precision clamped to 15 max', () => {
            const { precision } = evaluate('1', 99);
            assert.equal(precision, 15);
        });
    });

    describe('result shape', () => {
        test('includes expression', () => {
            const r = evaluate('2+2');
            assert.equal(r.expression, '2+2');
        });
        test('includes precision', () => {
            const r = evaluate('1', 4);
            assert.equal(r.precision, 4);
        });
    });

    describe('errors', () => {
        test('empty string throws', () => {
            assert.throws(() => evaluate(''), /Please provide/);
        });
        test('whitespace only throws', () => {
            assert.throws(() => evaluate('   '), /Please provide/);
        });
        test('division by zero throws', () => {
            assert.throws(() => evaluate('1/0'), /Division by zero/);
        });
        test('modulo by zero throws', () => {
            assert.throws(() => evaluate('5%0'), /Division by zero/);
        });
        test('unknown identifier throws', () => {
            assert.throws(() => evaluate('foo'), /Unknown identifier/);
        });
        test('unknown function throws', () => {
            assert.throws(() => evaluate('evil(1)'), /Unknown function/);
        });
        test('no eval/Function access', () => {
            assert.throws(() => evaluate('eval(1)'), /Unknown function/);
        });
        test('expression too long throws', () => {
            assert.throws(() => evaluate('1+'.repeat(300)), /cannot exceed/i);
        });
        test('mismatched parens throws', () => {
            assert.throws(() => evaluate('(2+3'), /Unexpected end|Expected RPAREN/);
        });
    });
});
