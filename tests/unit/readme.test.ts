import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { versions } from '../../src/config/versions.js';

const readme = readFileSync(join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'), 'README.md'), 'utf8');

describe('readme', () => {
    test('every served version has a row of its own', () => {
        for (const version of Object.keys(versions)) {
            assert.match(
                readme,
                new RegExp(`\\| \`${version}\`\\s*\\|`),
                `the versioning table should have a row for ${version}`,
            );
        }
    });

    test('no version outside the registry is advertised', () => {
        const served = new Set(Object.keys(versions));
        for (const match of readme.matchAll(/\| `(v\d+)`\s*\|/g)) {
            const advertised = match[1]!;
            assert.ok(served.has(advertised), `the versioning table advertises ${advertised}, which is not served`);
        }
    });
});
