import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import diff from '../../src/modules/v5/diff.js';

describe('diff', () => {
    test('identical texts produce only equal changes', () => {
        const result = diff('line1\nline2', 'line1\nline2');
        assert.equal(result.added, 0);
        assert.equal(result.removed, 0);
        assert.ok(result.changes.every((c) => c.type === 'equal'));
    });

    test('one added line', () => {
        const result = diff('line1', 'line1\nline2');
        assert.equal(result.added, 1);
        assert.equal(result.removed, 0);
        assert.deepEqual(result.changes[1], { type: 'add', value: 'line2' });
    });

    test('one removed line', () => {
        const result = diff('line1\nline2', 'line1');
        assert.equal(result.added, 0);
        assert.equal(result.removed, 1);
        assert.deepEqual(result.changes[1], { type: 'del', value: 'line2' });
    });

    test('a modified line yields a del and an add', () => {
        const result = diff('line1\nline2', 'line1\nline2 edited');
        assert.equal(result.added, 1);
        assert.equal(result.removed, 1);
        assert.deepEqual(result.changes[0], { type: 'equal', value: 'line1' });
    });

    test('line mode is the default', () => {
        assert.equal(diff('a', 'a').mode, 'line');
    });

    test('word mode diffs word by word', () => {
        const result = diff('the quick fox', 'the slow fox', 'word');
        assert.equal(result.mode, 'word');
        assert.equal(result.added, 1);
        assert.equal(result.removed, 1);
        assert.deepEqual(result.changes[0], { type: 'equal', value: 'the' });
    });

    test('empty texts are equal', () => {
        const result = diff('', '');
        assert.equal(result.added, 0);
        assert.equal(result.removed, 0);
    });

    test('throws on invalid mode', () => {
        assert.throws(() => diff('a', 'b', 'chars'), /Mode must be one of/);
    });

    test('throws on missing texts', () => {
        assert.throws(() => diff(undefined as unknown as string, 'b'), /first text/);
        assert.throws(() => diff('a', undefined as unknown as string), /second text/);
    });

    test('throws on text too long', () => {
        assert.throws(() => diff('a'.repeat(10_001), 'b'), /10000/);
    });

    test('throws on too many segments', () => {
        assert.throws(() => diff('a\n'.repeat(2001), 'b'), /2000 lines/);
    });
});
