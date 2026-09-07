import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import read from '../../src/modules/v5/read.js';

describe('read', () => {
    test('counts words, sentences and syllables', () => {
        const result = read('The cat sat on the mat. It was happy.');
        assert.equal(result.words, 9);
        assert.equal(result.sentences, 2);
        assert.ok(result.syllables >= 9);
    });

    test('single sentence without punctuation counts as one', () => {
        assert.equal(read('hello world').sentences, 1);
    });

    test('ignores punctuation-only tokens', () => {
        assert.equal(read('Salut ça va ?').words, 3);
        assert.equal(read('wait — what ?!').words, 2);
    });

    test('throws when the text has no word', () => {
        assert.throws(() => read('??? !!!'), /text/);
    });

    test('flesch reading ease is in a plausible range for standard text', () => {
        const result = read('The cat sat on the mat. The dog ran in the park. It was a sunny day.');
        assert.ok(result.fleschReadingEase > 0);
        assert.ok(result.fleschReadingEase <= 121.22);
    });

    test('flesch-kincaid grade is not negative for standard text', () => {
        const result = read('Understanding complicated documentation requires considerable experience and patience.');
        assert.ok(result.fleschKincaidGrade! >= 0);
    });

    test('scores are rounded to 2 decimals', () => {
        const result = read('Some sample text for rounding. Another sentence here.');
        assert.equal(result.fleschReadingEase, Math.round(result.fleschReadingEase * 100) / 100);
        const grade = result.fleschKincaidGrade!;
        assert.equal(grade, Math.round(grade * 100) / 100);
    });

    test('reading time in seconds for a short text', () => {
        assert.match(read('A short text.').readingTime, /^\d+s$/);
    });

    test('reading time in minutes for a long text', () => {
        assert.match(read('word '.repeat(500)).readingTime, /^\d+min$/);
    });

    test('defaults to English', () => {
        assert.equal(read('hello world').lang, 'en');
    });

    test('French uses the Kandel & Moles coefficients and no grade', () => {
        const result = read('Salut ça va ?', 'fr');
        assert.equal(result.lang, 'fr');
        assert.equal(result.words, 3);
        assert.equal(result.sentences, 1);
        assert.equal(result.syllables, 4);
        assert.equal(result.fleschReadingEase, 105.82);
        assert.equal(result.fleschKincaidGrade, null);
    });

    test('French syllables keep accented vowels and drop the silent e', () => {
        assert.equal(read('été', 'fr').syllables, 2);
        assert.equal(read('où', 'fr').syllables, 1);
        assert.equal(read('porte', 'fr').syllables, 1);
        assert.equal(read('journée', 'fr').syllables, 2);
    });

    test('ellipsis ends a sentence', () => {
        assert.equal(read('Bon… on y va', 'fr').sentences, 2);
    });

    test('throws on unsupported language', () => {
        assert.throws(() => read('hello', 'de'), /Language must be one of/);
    });

    test('throws on missing text', () => {
        assert.throws(() => read(''), /text/);
        assert.throws(() => read('   '), /text/);
    });

    test('throws on text too long', () => {
        assert.throws(() => read('a'.repeat(50_001)), /50000/);
    });
});
