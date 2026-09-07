import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import type { UuidGenerateBatchResult, UuidGenerateResult, UuidParseResult } from '../../src/modules/v5/uuid.js';
import uuid from '../../src/modules/v5/uuid.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid', () => {
    test('generates a valid UUID v4 by default', () => {
        const result = uuid() as UuidGenerateResult;
        assert.match(result.uuid, UUID_V4_REGEX);
        assert.equal(result.version, 4);
        assert.equal(result.variant, 'RFC 4122');
    });

    test('generates a batch of unique UUIDs', () => {
        const result = uuid(undefined, 5) as UuidGenerateBatchResult;
        assert.equal(result.count, 5);
        assert.equal(result.uuids.length, 5);
        assert.equal(new Set(result.uuids).size, 5);
    });

    test('count of 1 returns a single result', () => {
        const result = uuid(undefined, 1) as UuidGenerateResult;
        assert.ok(typeof result.uuid === 'string');
    });

    test('throws on count out of range', () => {
        assert.throws(() => uuid(undefined, 0), /between 1 and 50/);
        assert.throws(() => uuid(undefined, -1), /between 1 and 50/);
        assert.throws(() => uuid(undefined, 51), /between 1 and 50/);
        assert.throws(() => uuid(undefined, 2.5), /between 1 and 50/);
    });

    test('throws on non-numeric count', () => {
        assert.throws(() => uuid(undefined, NaN), /number/);
    });

    test('parses a valid UUID v4', () => {
        const result = uuid('550e8400-e29b-41d4-a716-446655440000') as UuidParseResult;
        assert.equal(result.valid, true);
        assert.equal(result.version, 4);
        assert.equal(result.variant, 'RFC 4122');
    });

    test('parses a UUID v1', () => {
        const result = uuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8') as UuidParseResult;
        assert.equal(result.valid, true);
        assert.equal(result.version, 1);
    });

    test('parses an uppercase UUID', () => {
        const result = uuid('550E8400-E29B-41D4-A716-446655440000') as UuidParseResult;
        assert.equal(result.valid, true);
        assert.equal(result.version, 4);
    });

    test('invalid UUID (too short) returns valid: false', () => {
        const result = uuid('550e8400-e29b') as UuidParseResult;
        assert.equal(result.valid, false);
        assert.equal(result.version, null);
        assert.equal(result.variant, null);
    });

    test('invalid UUID (bad characters) returns valid: false', () => {
        const result = uuid('550e8400-e29b-41d4-a716-44665544000z') as UuidParseResult;
        assert.equal(result.valid, false);
    });
});
