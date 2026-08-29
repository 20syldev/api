import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';

import express from 'express';

import { envList } from '../../src/config/env.js';

// The following tests are adapted from the proxy-addr test suite
const CDN_RANGE = '198.51.100.0/24';
const CALLER = '203.0.113.7';
const CHAIN = `${CALLER}, 198.51.100.10, 10.0.0.1`;

let server: Server;
let baseUrl: string;

function listen(trustProxy: unknown): Promise<void> {
    const app = express();
    app.set('trust proxy', trustProxy);
    app.get('/', (req, res) => {
        res.json({ ip: req.ip });
    });

    return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
            baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
            resolve();
        });
    });
}

async function resolveIp(forwardedFor?: string): Promise<string> {
    const headers = forwardedFor ? { 'X-Forwarded-For': forwardedFor } : undefined;
    const res = await fetch(baseUrl, { headers });
    return ((await res.json()) as { ip: string }).ip;
}

describe('trust proxy with a configured hop list', () => {
    before(() => listen(['loopback', 'uniquelocal', CDN_RANGE]));
    after(() => new Promise<void>((resolve) => server.close(() => resolve())));

    test('skips the CDN and the private router to reach the caller', async () => {
        assert.equal(await resolveIp(CHAIN), CALLER);
    });

    test('stays stable when the CDN answers from another edge', async () => {
        assert.equal(await resolveIp(`${CALLER}, 198.51.100.200, 10.9.9.9`), CALLER);
    });

    test('ignores an entry prepended by the caller', async () => {
        assert.equal(await resolveIp(`192.0.2.1, ${CHAIN}`), CALLER);
    });

    test('ignores an entry claiming to be a trusted hop', async () => {
        assert.equal(await resolveIp(`198.51.100.99, ${CHAIN}`), CALLER);
    });

    test('resolves an IPv6 caller', async () => {
        assert.equal(await resolveIp('2001:db8::1, 198.51.100.10, 10.0.0.1'), '2001:db8::1');
    });

    test('falls back to the socket address without a forwarded header', async () => {
        assert.equal(await resolveIp(), '::ffff:127.0.0.1');
    });
});

describe('trust proxy left unconfigured', () => {
    before(() => listen(1));
    after(() => new Promise<void>((resolve) => server.close(() => resolve())));

    test('trusts a single hop and stops on the nearest proxy', async () => {
        assert.equal(await resolveIp(CHAIN), '10.0.0.1');
    });
});

describe('envList parsing for TRUSTED_PROXIES', () => {
    const parse = (value: string | undefined): string[] | null => {
        if (value === undefined) delete process.env.TRUSTED_PROXIES;
        else process.env.TRUSTED_PROXIES = value;
        return envList('TRUSTED_PROXIES');
    };

    after(() => {
        delete process.env.TRUSTED_PROXIES;
    });

    test('splits a space-separated list', () => {
        assert.deepEqual(parse(`loopback uniquelocal ${CDN_RANGE}`), ['loopback', 'uniquelocal', CDN_RANGE]);
    });

    test('splits the comma form Express documents', () => {
        assert.deepEqual(parse('loopback,uniquelocal'), ['loopback', 'uniquelocal']);
    });

    test('drops stray and repeated separators', () => {
        assert.deepEqual(parse('  loopback ,  uniquelocal , '), ['loopback', 'uniquelocal']);
    });

    test('returns null when unset', () => {
        assert.equal(parse(undefined), null);
    });

    test('returns null for the literal string undefined', () => {
        assert.equal(parse('undefined'), null);
    });

    test('returns null for a whitespace-only value, so the default applies', () => {
        assert.equal(parse('   '), null);
    });

    test('every accepted form is usable by express without throwing', () => {
        for (const value of ['loopback', 'loopback,uniquelocal', ' loopback ,  uniquelocal ', CDN_RANGE]) {
            const app = express();
            assert.doesNotThrow(() => app.set('trust proxy', parse(value) ?? 1), `rejected: ${value}`);
        }
    });
});
