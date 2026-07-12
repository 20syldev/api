import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import { checkRateLimit } from '../../src/utils/helpers.js';

describe('checkRateLimit (5.4.0 fixes)', () => {
    test('allows exactly the limit, rejects the next request', () => {
        const limits: Record<string, number[]> = {};
        for (let i = 0; i < 50; i++) {
            assert.doesNotThrow(() => checkRateLimit(limits, 'user', 1000 + i));
        }
        assert.throws(() => checkRateLimit(limits, 'user', 1100), /Rate limit exceeded/);
    });

    test('evicts users whose requests are all outside the window', () => {
        const limits: Record<string, number[]> = {};
        checkRateLimit(limits, 'old-user', 1000);
        checkRateLimit(limits, 'fresh-user', 20_000);
        assert.equal(limits['old-user'], undefined);
        assert.ok(limits['fresh-user']);
    });
});
