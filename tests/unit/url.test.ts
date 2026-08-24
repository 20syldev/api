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

    test('URL without port → default scheme port', () => {
        const result = parseUrl('https://example.com/path');
        assert.equal(result.port, 443);
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

describe('parseUrl (5.5.0 fixes)', () => {
    test('duplicate query params are preserved as an array', () => {
        const result = parseUrl('https://example.com/?a=1&a=2&b=3');
        assert.deepEqual(result.params, { a: ['1', '2'], b: '3' });
    });
});

describe('parseUrl (5.7.0 default ports)', () => {
    test('http URL without port → 80', () => {
        const result = parseUrl('http://example.com');
        assert.equal(result.port, 80);
    });

    test('explicit default port stripped by parser → still 443', () => {
        const result = parseUrl('https://example.com:443/');
        assert.equal(result.port, 443);
    });

    test('ws URL without port → 80', () => {
        const result = parseUrl('ws://example.com');
        assert.equal(result.port, 80);
    });

    test('wss URL without port → 443', () => {
        const result = parseUrl('wss://example.com');
        assert.equal(result.port, 443);
    });

    test('ftp URL without port → 21', () => {
        const result = parseUrl('ftp://example.com');
        assert.equal(result.port, 21);
    });

    test('unknown scheme without port → port is null', () => {
        const result = parseUrl('foo://example.com');
        assert.equal(result.port, null);
    });
});

describe('parseUrl (prototype-safe scheme lookup)', () => {
    test('constructor scheme without port → port is null', () => {
        const result = parseUrl('constructor://example.com');
        assert.equal(result.port, null);
    });

    test('constructor scheme survives serialization with a port key', () => {
        const result = parseUrl('constructor://example.com');
        assert.ok('port' in JSON.parse(JSON.stringify(result)));
    });

    test('explicit port on an unknown scheme is still reported', () => {
        const result = parseUrl('constructor://example.com:8080');
        assert.equal(result.port, 8080);
    });
});
