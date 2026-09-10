import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    main: string;
    types: string;
    exports: Record<string, string | Record<string, string>>;
};

/**
 * Maps a build output path onto the source file that produces it, so the exports
 * map can be validated without running `tsc` first.
 *
 * @param target - Path declared in package.json, relative to the package root
 * @returns Absolute path of the matching source file, or null if none exists
 */
const source = (target: string): string | null => {
    const rel = target.replace(/^\.\//, '');
    if (!rel.startsWith('dist/')) return existsSync(join(root, rel)) ? join(root, rel) : null;

    const base = rel.slice('dist/'.length).replace(/\.d\.ts$|\.js$/, '');
    for (const ext of ['.ts', '.js']) {
        const candidate = join(root, 'src', base + ext);
        if (existsSync(candidate)) return candidate;
    }
    return null;
};

// Every target path referenced by an exports entry, flattened across conditions.
const targets = Object.entries(pkg.exports).flatMap(([subpath, entry]) =>
    typeof entry === 'string'
        ? [[subpath, entry] as const]
        : Object.entries(entry).map(([condition, value]) => [`${subpath} (${condition})`, value] as const),
);

describe('package exports', () => {
    test('declares a root entry', () => {
        assert.ok(pkg.exports['.'], 'exports must declare "." or bare imports throw ERR_PACKAGE_PATH_NOT_EXPORTED');
    });

    test('every export target has a source file', () => {
        for (const [label, target] of targets) {
            assert.ok(source(target), `${label} → ${target} has no matching source file`);
        }
    });

    test('main and types have a source file', () => {
        assert.ok(source(pkg.main), `main → ${pkg.main} has no matching source file`);
        assert.ok(source(pkg.types), `types → ${pkg.types} has no matching source file`);
    });

    test('every version supported at runtime is exported', () => {
        for (const version of ['v4', 'v5', 'v6']) {
            assert.ok(pkg.exports[`./${version}`], `missing "./${version}" export`);
        }
    });

    test('types condition is declared before default', () => {
        for (const [subpath, entry] of Object.entries(pkg.exports)) {
            if (typeof entry === 'string') continue;
            const keys = Object.keys(entry);
            const types = keys.indexOf('types');
            if (types === -1) continue;
            assert.ok(types < keys.indexOf('default'), `"${subpath}": "types" must come before "default"`);
        }
    });
});
