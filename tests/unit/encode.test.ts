import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import {
    base64encode,
    base64decode,
    urlencode,
    urldecode,
    morse,
    unmorse,
    rot13,
    caesar,
    binary,
    unbinary,
} from '../../src/modules/v4/encode.js';

describe('encode', () => {
    describe('base64', () => {
        test('encodes ASCII text', () => {
            assert.equal(base64encode('hello'), 'aGVsbG8=');
        });

        test('round-trip preserves UTF-8', () => {
            assert.equal(base64decode(base64encode('héllo wörld')), 'héllo wörld');
        });

        test('decode rejects invalid base64', () => {
            assert.throws(() => base64decode('not!valid'), /Invalid Base64/);
        });
    });

    describe('url', () => {
        test('encodes special chars', () => {
            assert.equal(urlencode('a b&c=d'), 'a%20b%26c%3Dd');
        });

        test('round-trip', () => {
            assert.equal(urldecode(urlencode('hello world?')), 'hello world?');
        });

        test('decode rejects malformed sequence', () => {
            assert.throws(() => urldecode('%ZZ'), /Invalid URL/);
        });
    });

    describe('morse', () => {
        test('encodes SOS', () => {
            assert.equal(morse('SOS'), '... --- ...');
        });

        test('round-trip with words', () => {
            assert.equal(unmorse(morse('HELLO WORLD')), 'HELLO WORLD');
        });

        test('throws on unsupported char', () => {
            assert.throws(() => morse('hello#'), /Unsupported character/);
        });
    });

    describe('rot13', () => {
        test('shifts letters by 13', () => {
            assert.equal(rot13('Hello'), 'Uryyb');
        });

        test('is its own inverse', () => {
            assert.equal(rot13(rot13('The Quick Brown Fox')), 'The Quick Brown Fox');
        });

        test('preserves non-alpha chars', () => {
            assert.equal(rot13('abc 123!'), 'nop 123!');
        });
    });

    describe('caesar', () => {
        test('shift 3 forward', () => {
            assert.equal(caesar('abc', '3'), 'def');
        });

        test('shift wraps around alphabet', () => {
            assert.equal(caesar('xyz', '3'), 'abc');
        });

        test('negative shift', () => {
            assert.equal(caesar('def', '-3'), 'abc');
        });

        test('throws on non-numeric shift', () => {
            assert.throws(() => caesar('abc', 'abc'), /Shift must be a number/);
        });
    });

    describe('binary', () => {
        test('encodes A as 01000001', () => {
            assert.equal(binary('A'), '01000001');
        });

        test('round-trip', () => {
            assert.equal(unbinary(binary('Hello!')), 'Hello!');
        });

        test('rejects malformed binary', () => {
            assert.throws(() => unbinary('012'), /Invalid binary/);
        });

        test('rejects wrong group size', () => {
            assert.throws(() => unbinary('0100'), /Each binary group must contain 8 bits/);
        });
    });
});
