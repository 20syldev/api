import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { slug, stats, lorem, number } from '../../src/modules/v4/text.js';

describe('text', () => {
    describe('slug', () => {
        test('basic slug', () => {
            assert.equal(slug('Hello World'), 'hello-world');
        });

        test('strips diacritics', () => {
            assert.equal(slug('Crème Brûlée'), 'creme-brulee');
        });

        test('strips special chars', () => {
            assert.equal(slug('Mon Article #1 !'), 'mon-article-1');
        });

        test('collapses multiple spaces', () => {
            assert.equal(slug('a   b   c'), 'a-b-c');
        });
    });

    describe('stats', () => {
        test('counts characters and words', () => {
            const result = stats('Hello world');
            assert.equal(result.characters, 11);
            assert.equal(result.charactersNoSpaces, 10);
            assert.equal(result.words, 2);
        });

        test('counts sentences', () => {
            const result = stats('Hi. How are you? Fine!');
            assert.equal(result.sentences, 3);
        });

        test('reading time format', () => {
            const result = stats('a '.repeat(200).trim());
            assert.match(result.readingTime, /min/);
        });

        test('short text returns seconds', () => {
            const result = stats('hello world');
            assert.match(result.readingTime, /s$/);
        });
    });

    describe('lorem', () => {
        test('words count', () => {
            const result = lorem('words', '10');
            assert.equal(result.split(' ').length, 10);
        });

        test('sentences end with period', () => {
            const result = lorem('sentences', '3');
            const sentences = result.split('. ');
            assert.equal(sentences.length, 3);
        });

        test('paragraphs separated by double newline', () => {
            const result = lorem('paragraphs', '2');
            assert.equal(result.split('\n\n').length, 2);
        });

        test('throws on invalid type', () => {
            assert.throws(() => lorem('verses', '5'), /Type must be one of/);
        });
    });

    describe('number', () => {
        test('English: 42', () => {
            assert.equal(number('42', 'en'), 'forty-two');
        });

        test('English: 100', () => {
            assert.equal(number('100', 'en'), 'one hundred');
        });

        test('English: 1234', () => {
            assert.equal(number('1234', 'en'), 'one thousand two hundred thirty-four');
        });

        test('French: 21', () => {
            assert.equal(number('21', 'fr'), 'vingt et un');
        });

        test('French: 80', () => {
            assert.equal(number('80', 'fr'), 'quatre-vingts');
        });

        test('French: 0', () => {
            assert.equal(number('0', 'fr'), 'zéro');
        });

        test('English: negative', () => {
            assert.equal(number('-5', 'en'), 'minus five');
        });

        test('throws on invalid lang', () => {
            assert.throws(() => number('42', 'es'), /Lang must be one of/);
        });

        test('throws on non-integer', () => {
            assert.throws(() => number('3.14', 'en'), /must be an integer/);
        });
    });
});
