import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, test } from 'node:test';

import app from '../../src/app.js';
import { env } from '../../src/config/env.js';

// Save the instance metadata and logs token so we can restore them after each test
const saved = {
    DOCS_URL: env.DOCS_URL,
    REPO_URL: env.REPO_URL,
    INSTANCE_CREATED: env.INSTANCE_CREATED,
    LOGS_TOKEN: env.LOGS_TOKEN,
};

let server: Server;
let baseUrl: string;

before(() => {
    return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
            baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
            resolve();
        });
    });
});

after(() => {
    return new Promise<void>((resolve) => {
        server.close(() => resolve());
    });
});

afterEach(() => {
    Object.assign(env, saved);
});

async function getJson(path: string, headers?: HeadersInit) {
    const res = await fetch(`${baseUrl}${path}`, { headers });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe('instance metadata left unset', () => {
    const blank = () => Object.assign(env, { DOCS_URL: '', REPO_URL: '', INSTANCE_CREATED: '' });

    test('/:version/infos omits documentation, github and creation', async () => {
        blank();
        const { body } = await getJson('/v5/infos');
        assert.ok('endpoints' in body);
        assert.equal('documentation' in body, false);
        assert.equal('github' in body, false);
        assert.equal('creation' in body, false);
    });

    test('the root route omits documentation', async () => {
        blank();
        const { body } = await getJson('/');
        assert.ok('versions' in body);
        assert.equal('documentation' in body, false);
    });

    test('/:version omits documentation', async () => {
        blank();
        const { body } = await getJson('/v5');
        assert.ok('endpoints' in body);
        assert.equal('documentation' in body, false);
    });

    test('error payloads stay well formed', async () => {
        blank();
        const { status, body } = await getJson('/v5/does-not-exist');
        assert.equal(status, 404);
        assert.equal(body.status, 404);
        assert.ok(body.error);
        assert.equal('documentation' in body, false);
    });
});

describe('instance metadata configured', () => {
    const filled = () =>
        Object.assign(env, {
            DOCS_URL: 'https://docs.example.test',
            REPO_URL: 'https://github.com/acme/api',
            INSTANCE_CREATED: 'March 1st 2026',
        });

    test('/:version/infos reports all three', async () => {
        filled();
        const { body } = await getJson('/v5/infos');
        assert.equal(body.documentation, 'https://docs.example.test');
        assert.equal(body.github, 'https://github.com/acme/api');
        assert.equal(body.creation, 'March 1st 2026');
    });

    test('/:version points at the version documentation', async () => {
        filled();
        const { body } = await getJson('/v5');
        assert.equal(body.documentation, 'https://docs.example.test/v5');
    });

    test('error payloads stay free of the documentation link', async () => {
        filled();
        const { status, body } = await getJson('/v5/encode');
        assert.equal(status, 400);
        assert.equal('documentation' in body, false);
    });
});

describe('GET /logs', () => {
    test('stays closed while no token is configured', async () => {
        env.LOGS_TOKEN = '';
        const { status, body } = await getJson('/logs');
        assert.equal(status, 404);
        assert.equal(body.error, "Endpoint '/logs' does not exist.");
    });

    test('is left out of the root index while no token is configured', async () => {
        env.LOGS_TOKEN = '';
        const { body } = await getJson('/');
        assert.equal('logs' in body, false);
    });

    test('is advertised on the root index once a token is configured', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        const { body } = await getJson('/');
        assert.ok(String(body.logs).endsWith('/logs'));
    });

    test('rejects a request with no token once one is configured', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        const { status, body } = await getJson('/logs');
        assert.equal(status, 401);
        assert.equal(body.error, 'Invalid token.');
    });

    test('rejects a wrong token', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        const { status } = await getJson('/logs', { 'X-Logs-Token': 'nope' });
        assert.equal(status, 401);
    });

    test('accepts the configured token', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        const { status } = await getJson('/logs', { 'X-Logs-Token': 's3cr3t' });
        assert.equal(status, 200);
    });

    test('rejects a duplicated header pairing a good token with a bad one', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        const headers = new Headers();
        headers.append('X-Logs-Token', 's3cr3t');
        headers.append('X-Logs-Token', 'nope');
        const { status } = await getJson('/logs', headers);
        assert.equal(status, 401);
    });
});

describe('request log redaction, end to end', () => {
    test('the buffer keeps parameter names without their values', async () => {
        env.LOGS_TOKEN = 's3cr3t';
        await getJson('/v5/encode?text=SUPERSECRET&method=base64');
        const { body } = await getJson('/logs', { 'X-Logs-Token': 's3cr3t' });
        const urls = (body as unknown as { url: string }[]).map((e) => e.url);
        assert.ok(
            urls.includes('/v5/encode?text&method'),
            `expected a redacted entry, got ${JSON.stringify(urls.slice(-3))}`,
        );
        assert.equal(
            urls.some((u) => u.includes('SUPERSECRET')),
            false,
        );
    });
});
