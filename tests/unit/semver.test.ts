import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import type { SemverBumpResult, SemverCompareResult, SemverParseResult } from '../../src/modules/v5/semver.js';
import semver from '../../src/modules/v5/semver.js';

describe('semver', () => {
    test('parses a simple version', () => {
        const result = semver('1.2.3') as SemverParseResult;
        assert.equal(result.major, 1);
        assert.equal(result.minor, 2);
        assert.equal(result.patch, 3);
        assert.equal(result.prerelease, null);
        assert.equal(result.build, null);
    });

    test('parses a prerelease', () => {
        const result = semver('1.0.0-alpha.1') as SemverParseResult;
        assert.equal(result.prerelease, 'alpha.1');
        assert.equal(result.build, null);
    });

    test('parses build metadata', () => {
        const result = semver('1.0.0+build.123') as SemverParseResult;
        assert.equal(result.prerelease, null);
        assert.equal(result.build, 'build.123');
    });

    test('parses prerelease and build together', () => {
        const result = semver('1.2.3-beta.1+build.42') as SemverParseResult;
        assert.equal(result.prerelease, 'beta.1');
        assert.equal(result.build, 'build.42');
    });

    test('parse is the default action', () => {
        const result = semver('1.2.3') as SemverParseResult;
        assert.equal(result.major, 1);
    });

    test('bumps patch', () => {
        assert.equal((semver('1.2.3', 'bump', 'patch') as SemverBumpResult).result, '1.2.4');
    });

    test('bumps minor and resets patch', () => {
        assert.equal((semver('1.2.3', 'bump', 'minor') as SemverBumpResult).result, '1.3.0');
    });

    test('bumps major and resets lower parts', () => {
        assert.equal((semver('1.2.3', 'bump', 'major') as SemverBumpResult).result, '2.0.0');
    });

    test('bump drops prerelease and build', () => {
        assert.equal((semver('1.0.0-alpha+build.1', 'bump', 'patch') as SemverBumpResult).result, '1.0.1');
    });

    test('compares lower version', () => {
        const result = semver('1.2.3', 'compare', undefined, '1.3.0') as SemverCompareResult;
        assert.equal(result.result, -1);
        assert.equal(result.description, '1.2.3 < 1.3.0');
    });

    test('compares higher version', () => {
        assert.equal((semver('2.0.0', 'compare', undefined, '1.9.9') as SemverCompareResult).result, 1);
    });

    test('compares equal versions', () => {
        const result = semver('1.0.0', 'compare', undefined, '1.0.0') as SemverCompareResult;
        assert.equal(result.result, 0);
        assert.equal(result.description, '1.0.0 = 1.0.0');
    });

    test('prerelease ranks below the release', () => {
        assert.equal((semver('1.0.0-alpha', 'compare', undefined, '1.0.0') as SemverCompareResult).result, -1);
    });

    test('compares prerelease identifiers', () => {
        assert.equal((semver('1.0.0-alpha', 'compare', undefined, '1.0.0-beta') as SemverCompareResult).result, -1);
        assert.equal(
            (semver('1.0.0-alpha.2', 'compare', undefined, '1.0.0-alpha.10') as SemverCompareResult).result,
            -1,
        );
    });

    test('throws on invalid action', () => {
        assert.throws(() => semver('1.2.3', 'nope'), /Action must be one of/);
    });

    test('throws on invalid part', () => {
        assert.throws(() => semver('1.2.3', 'bump', 'nope'), /Part must be one of/);
    });

    test('throws on missing other for compare', () => {
        assert.throws(() => semver('1.2.3', 'compare'), /second version/);
    });

    test('throws on invalid version', () => {
        assert.throws(() => semver('abc'), /Invalid semver/);
        assert.throws(() => semver('1.2'), /Invalid semver/);
        assert.throws(() => semver('01.2.3'), /Invalid semver/);
    });

    test('throws on missing version', () => {
        assert.throws(() => semver(''), /version/);
    });

    test('throws on version too long', () => {
        assert.throws(() => semver(`1.0.0-${'a'.repeat(300)}`), /256/);
    });
});
