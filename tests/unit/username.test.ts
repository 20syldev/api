import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import username from '../../src/modules/v4/username.js';

describe('username', () => {
    test('returns expected fields', () => {
        const result = username();
        assert.ok('username' in result);
        assert.ok('number' in result);
        assert.ok('adjective' in result);
        assert.ok('animal' in result);
        assert.ok('job' in result);
    });

    test('username is a non-empty string', () => {
        const result = username();
        assert.equal(typeof result.username, 'string');
        assert.ok((result.username as string).length > 0);
    });

    test('number is between 0 and 99', () => {
        const result = username();
        const n = result.number as number;
        assert.ok(n >= 0 && n <= 99);
    });

    test('produces varied usernames', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 10; i++) {
            seen.add(username().username as string);
        }
        assert.ok(seen.size > 1);
    });
});
