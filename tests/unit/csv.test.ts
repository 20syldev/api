import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import csv from '../../src/modules/v5/csv.js';

describe('csv parse', () => {
    test('simple CSV → correct rows and count', () => {
        const result = csv('parse', { csv: 'name,age\nAlice,30\nBob,25' });
        assert.equal(result.action, 'parse');
        assert.equal('rows' in result && result.rows.length, 2);
        assert.deepEqual('rows' in result && result.rows[0], { name: 'Alice', age: '30' });
        assert.equal(result.count, 2);
    });

    test('custom delimiter (;)', () => {
        const result = csv('parse', { csv: 'name;age\nAlice;30' }, { delimiter: ';' });
        assert.equal('rows' in result && result.rows.length, 1);
        assert.deepEqual('rows' in result && result.rows[0], { name: 'Alice', age: '30' });
    });

    test('quoted fields containing commas', () => {
        const result = csv('parse', { csv: 'name,city\n"Doe, John","New York"' });
        assert.deepEqual('rows' in result && result.rows[0], { name: 'Doe, John', city: 'New York' });
    });

    test('quoted fields with escaped quotes', () => {
        const result = csv('parse', { csv: 'val\n"say ""hello"""' });
        assert.deepEqual('rows' in result && result.rows[0], { val: 'say "hello"' });
    });

    test('headers: false → numeric keys', () => {
        const result = csv('parse', { csv: 'Alice,30\nBob,25' }, { headers: false });
        assert.equal('rows' in result && result.rows.length, 2);
        assert.deepEqual('rows' in result && result.rows[0], { '0': 'Alice', '1': '30' });
    });

    test('empty CSV throws', () => {
        assert.throws(() => csv('parse', { csv: '' }), /Please provide CSV data/);
    });

    test('headers-only CSV → empty rows', () => {
        const result = csv('parse', { csv: 'name,age' });
        assert.equal(result.count, 0);
    });

    test('CRLF line endings handled', () => {
        const result = csv('parse', { csv: 'a,b\r\n1,2\r\n3,4' });
        assert.equal(result.count, 2);
    });

    test('missing csv for parse throws', () => {
        assert.throws(() => csv('parse', {}), /Please provide CSV data/);
    });

    test('CSV too long throws', () => {
        assert.throws(() => csv('parse', { csv: 'a\n' + 'x'.repeat(50_001) }), /cannot exceed/);
    });
});

describe('csv format', () => {
    test('simple format → correct CSV', () => {
        const result = csv('format', {
            json: [
                { name: 'Alice', age: '30' },
                { name: 'Bob', age: '25' },
            ],
        });
        assert.equal(result.action, 'format');
        assert.equal('csv' in result && result.csv, 'name,age\nAlice,30\nBob,25');
        assert.equal(result.count, 2);
    });

    test('values with commas are quoted', () => {
        const result = csv('format', { json: [{ val: 'a,b' }] });
        assert.equal('csv' in result && result.csv, 'val\n"a,b"');
    });

    test('values with quotes are escaped', () => {
        const result = csv('format', { json: [{ val: 'say "hi"' }] });
        assert.equal('csv' in result && result.csv, 'val\n"say ""hi"""');
    });

    test('custom delimiter for format', () => {
        const result = csv('format', { json: [{ a: '1', b: '2' }] }, { delimiter: ';' });
        assert.equal('csv' in result && result.csv, 'a;b\n1;2');
    });

    test('missing json for format throws', () => {
        assert.throws(() => csv('format', {}), /Please provide a JSON array/);
    });

    test('empty json array throws', () => {
        assert.throws(() => csv('format', { json: [] }), /Please provide a JSON array/);
    });
});

describe('csv round-trip', () => {
    test('parse → format → parse yields same data', () => {
        const original = 'name,age\nAlice,30\nBob,25';
        const parsed = csv('parse', { csv: original });
        const formatted = csv('format', { json: (parsed as { rows: Record<string, unknown>[] }).rows });
        assert.equal('csv' in formatted && formatted.csv, original);
    });
});

describe('csv validation', () => {
    test('invalid action throws', () => {
        assert.throws(() => csv('invalid', {}), /valid action/);
    });

    test('missing action throws', () => {
        assert.throws(() => csv('', {}), /valid action/);
    });

    test('multi-char delimiter throws', () => {
        assert.throws(() => csv('parse', { csv: 'a\n1' }, { delimiter: '::' }), /single character/);
    });
});

describe('csv (5.5.0 fixes)', () => {
    test('quoted field at end of line adds no phantom column', () => {
        const result = csv('parse', { csv: 'a,"b"\n1,"2"' });
        assert.deepEqual('rows' in result && result.rows, [{ a: '1', b: '2' }]);
    });

    test('newline inside a quoted field is preserved', () => {
        const result = csv('parse', { csv: 'name,note\na,"l1\nl2"' });
        assert.deepEqual('rows' in result && result.rows, [{ name: 'a', note: 'l1\nl2' }]);
    });

    test('format then parse round-trips multiline values', () => {
        const formatted = csv('format', { json: [{ name: 'a', note: 'l1\nl2' }] });
        const parsed = csv('parse', { csv: 'csv' in formatted ? formatted.csv : '' });
        assert.deepEqual('rows' in parsed && parsed.rows, [{ name: 'a', note: 'l1\nl2' }]);
    });
});
