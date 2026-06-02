import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import caseConvert from '../../src/modules/v5/case.js';

describe('caseConvert', () => {
    // Default: camel
    test('default to is camel', () => {
        const { result } = caseConvert('hello_world');
        assert.equal(result, 'helloWorld');
    });

    // camelCase
    test('snake_case → camel', () => {
        assert.equal(caseConvert('hello_world', 'camel').result, 'helloWorld');
    });

    test('camelCase → camel (unchanged)', () => {
        assert.equal(caseConvert('helloWorld', 'camel').result, 'helloWorld');
    });

    // PascalCase
    test('snake_case → pascal', () => {
        assert.equal(caseConvert('hello_world', 'pascal').result, 'HelloWorld');
    });

    test('camelCase → pascal', () => {
        assert.equal(caseConvert('helloWorld', 'pascal').result, 'HelloWorld');
    });

    // snake_case
    test('camelCase → snake', () => {
        assert.equal(caseConvert('helloWorld', 'snake').result, 'hello_world');
    });

    test('spaces → snake', () => {
        assert.equal(caseConvert('hello world', 'snake').result, 'hello_world');
    });

    // kebab-case
    test('snake_case → kebab', () => {
        assert.equal(caseConvert('hello_world', 'kebab').result, 'hello-world');
    });

    // CONSTANT_CASE
    test('camelCase → constant', () => {
        assert.equal(caseConvert('helloWorld', 'constant').result, 'HELLO_WORLD');
    });

    // Title Case
    test('snake_case → title', () => {
        assert.equal(caseConvert('hello_world', 'title').result, 'Hello World');
    });

    // Sentence case
    test('snake_case → sentence', () => {
        assert.equal(caseConvert('hello_world', 'sentence').result, 'Hello world');
    });

    // upper / lower
    test('text → upper', () => {
        assert.equal(caseConvert('Hello World', 'upper').result, 'HELLO WORLD');
    });

    test('text → lower', () => {
        assert.equal(caseConvert('Hello World', 'lower').result, 'hello world');
    });

    // Multi-separator input
    test('dot.separated → camel', () => {
        assert.equal(caseConvert('hello.world', 'camel').result, 'helloWorld');
    });

    test('dash-separated → pascal', () => {
        assert.equal(caseConvert('hello-world', 'pascal').result, 'HelloWorld');
    });

    // Response shape
    test('returns text, to and result', () => {
        const res = caseConvert('hello_world', 'camel');
        assert.equal(res.text, 'hello_world');
        assert.equal(res.to, 'camel');
        assert.equal(res.result, 'helloWorld');
    });

    // Errors
    test('missing text throws', () => {
        assert.throws(() => caseConvert(''), /Please provide a text/);
    });

    test('invalid target throws', () => {
        assert.throws(() => caseConvert('hello', 'bad'), /Invalid target case/);
    });

    test('text too long throws', () => {
        assert.throws(() => caseConvert('a'.repeat(1001)), /cannot exceed/);
    });
});
