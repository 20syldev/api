import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import parseUrl from '../../src/modules/v5/url.js';

describe('parseUrl', () => {
    test('full URL → all components extracted', () => {
        const result = parseUrl('https://example.com:8080/path?foo=bar&baz=1#section');
        assert.equal(result.scheme, 'https');
        assert.equal(result.host, 'example.com');
        assert.equal(result.port, 8080);
        assert.equal(result.path, '/path');
        assert.deepEqual(result.params, { foo: 'bar', baz: '1' });
        assert.equal(result.fragment, 'section');
        assert.equal(result.valid, true);
    });

    test('URL without port → port is null', () => {
        const result = parseUrl('https://example.com/path');
        assert.equal(result.port, null);
    });

    test('URL with multiple query params → params object correct', () => {
        const result = parseUrl('https://example.com?a=1&b=2&c=3');
        assert.deepEqual(result.params, { a: '1', b: '2', c: '3' });
    });

    test('URL with fragment → fragment non-empty', () => {
        const result = parseUrl('https://example.com#top');
        assert.equal(result.fragment, 'top');
    });

    test('URL without fragment → fragment is empty string', () => {
        const result = parseUrl('https://example.com/path');
        assert.equal(result.fragment, '');
    });

    test('URL without path → path is "/"', () => {
        const result = parseUrl('https://example.com');
        assert.equal(result.path, '/');
    });

    test('URL without query → params is empty object', () => {
        const result = parseUrl('https://example.com');
        assert.deepEqual(result.params, {});
    });

    test('HTTP scheme → scheme is "http"', () => {
        const result = parseUrl('http://example.com');
        assert.equal(result.scheme, 'http');
    });

    test('invalid URL throws', () => {
        assert.throws(() => parseUrl('not-a-url'), /Invalid URL/);
    });

    test('missing URL throws', () => {
        assert.throws(() => parseUrl(''), /Please provide a URL/);
    });

    test('URL too long throws', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(2048);
        assert.throws(() => parseUrl(longUrl), /cannot exceed/);
    });
});
