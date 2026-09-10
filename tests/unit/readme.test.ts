import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { versions } from '../../src/config/versions.js';

const readme = readFileSync(join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'), 'README.md'), 'utf8');

/**
 * Counts the distinct endpoint names a version exposes, across every method.
 *
 * @param version - Version key, such as v6
 * @returns Number of distinct endpoint names
 */
const count = (version: string): number =>
    new Set(
        Object.values(versions[version]!.endpoints)
            .flat()
            .map((e) => e.name),
    ).size;

describe('readme', () => {
    test('the headline count matches the latest version', () => {
        const latest = Object.keys(versions).pop()!;
        const match = /bundles (\d+) self-contained utilities/.exec(readme);
        assert.ok(match, 'the headline should state how many utilities the package bundles');
        assert.equal(Number(match[1]), count(latest));
    });

    test('every served version has a row stating its endpoint count', () => {
        for (const version of Object.keys(versions)) {
            const row = new RegExp(`\\\`${version}\\\`\\s*\\|\\s*(\\d+) endpoints`).exec(readme);
            assert.ok(row, `the versioning table should have a row for ${version}`);
            assert.equal(Number(row[1]), count(version), `${version} row is stale`);
        }
    });

    test('removed versions are not advertised as available', () => {
        assert.equal(/\| `v3`\s*\|/.test(readme), false);
    });
});
