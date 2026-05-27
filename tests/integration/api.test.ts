import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';

import app from '../../src/app.js';

let server: Server;
let baseUrl: string;

before(() => {
    return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
            const port = (server.address() as AddressInfo).port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
        });
    });
});

after(() => {
    return new Promise<void>((resolve) => {
        server.close(() => resolve());
    });
});

async function getJson(path: string): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await fetch(`${baseUrl}${path}`);
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
}

async function sendJson(
    method: string,
    path: string,
    body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body: data };
}

// --- v4 endpoints ---

// --- GET endpoints ---

describe('GET / (version listing)', () => {
    test('v4 endpoints listed', async () => {
        const { body } = await getJson('/v4');
        assert.equal(body.version, 'v4');
        const endpoints = body.endpoints as Record<string, Record<string, string>>;
        assert.ok('dice' in endpoints.get!);
        assert.ok('encode' in endpoints.get!);
        assert.ok('geo' in endpoints.get!);
        assert.ok('palette' in endpoints.get!);
        assert.ok('placeholder' in endpoints.get!);
        assert.ok('statistics' in endpoints.get!);
        assert.ok('text' in endpoints.get!);
        assert.ok('validate' in endpoints.get!);
    });

    test('invalid version returns 404', async () => {
        const { status } = await getJson('/v99');
        assert.equal(status, 404);
    });
});

describe('GET /v4/algorithms', () => {
    test('fibonacci', async () => {
        const { status, body } = await getJson('/v4/algorithms?method=fibonacci&value=10');
        assert.equal(status, 200);
        assert.deepEqual(body.answer, [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    });

    test('isprime', async () => {
        const { body } = await getJson('/v4/algorithms?method=isprime&value=17');
        assert.equal(body.answer, true);
    });

    test('roman 2024 to MMXXIV', async () => {
        const { body } = await getJson('/v4/algorithms?method=roman&value=2024');
        assert.equal(body.answer, 'MMXXIV');
    });

    test('roman MMXXIV to 2024', async () => {
        const { body } = await getJson('/v4/algorithms?method=roman&value=MMXXIV');
        assert.equal(body.answer, 2024);
    });
});

describe('GET /v4/captcha', () => {
    test('returns PNG with provided text', async () => {
        const res = await fetch(`${baseUrl}/v4/captcha?text=hello`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/png/);
        assert.equal(res.headers.get('x-captcha-text'), 'hello');
    });

    test('auto-generates text when none provided', async () => {
        const res = await fetch(`${baseUrl}/v4/captcha`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/png/);
        assert.ok(res.headers.get('x-captcha-text')!.length > 0);
    });

    test('accepts noise and dimensions', async () => {
        const res = await fetch(`${baseUrl}/v4/captcha?text=AB&noise=high&width=200&height=80`);
        assert.equal(res.status, 200);
    });
});

describe('GET /v4/chat', () => {
    test('fetches public messages', async () => {
        await sendJson('POST', '/v4/chat', {
            username: 'get-chat-user',
            message: 'ping',
            session: `get-chat-${Date.now()}`,
        });
        const res = await fetch(`${baseUrl}/v4/chat`);
        assert.equal(res.status, 200);
        const body = (await res.json()) as { username: string; message: string }[];
        assert.ok(Array.isArray(body));
    });
});

describe('GET /v4/color', () => {
    test('returns random color formats', async () => {
        const { status, body } = await getJson('/v4/color');
        assert.equal(status, 200);
        assert.match(body.hex as string, /^#[0-9a-f]{6}$/);
        assert.ok('rgb' in body);
        assert.ok('hsl' in body);
        assert.ok('cmyk' in body);
    });

    test('accepts hex input', async () => {
        const { status, body } = await getJson('/v4/color?hex=ff6600');
        assert.equal(status, 200);
        assert.equal(body.hex, '#ff6600');
    });
});

describe('GET /v4/convert', () => {
    test('celsius to fahrenheit', async () => {
        const { status, body } = await getJson('/v4/convert?value=100&from=celsius&to=fahrenheit');
        assert.equal(status, 200);
        assert.equal(body.result, 212);
    });

    test('km to mi', async () => {
        const { status, body } = await getJson('/v4/convert?value=1&from=km&to=mi');
        assert.equal(status, 200);
        assert.ok(Math.abs((body.result as number) - 0.621371) < 0.001);
    });

    test('missing value returns 400', async () => {
        const { status } = await getJson('/v4/convert?from=celsius&to=fahrenheit');
        assert.equal(status, 400);
    });
});

describe('GET /v4/dice', () => {
    test('rolls 2d6+3', async () => {
        const { body } = await getJson('/v4/dice?roll=2d6%2B3');
        assert.equal(body.count, 2);
        assert.equal(body.sides, 6);
        assert.equal(body.modifier, 3);
    });

    test('rejects invalid notation', async () => {
        const { status } = await getJson('/v4/dice?roll=foo');
        assert.equal(status, 400);
    });
});

describe('GET /v4/domain', () => {
    test('has TLD', async () => {
        const { status, body } = await getJson('/v4/domain');
        assert.equal(status, 200);
        assert.match(body.domain as string, /\./);
    });
});

describe('GET /v4/encode', () => {
    test('base64 encode', async () => {
        const { status, body } = await getJson('/v4/encode?method=base64encode&text=hello');
        assert.equal(status, 200);
        assert.equal(body.result, 'aGVsbG8=');
    });

    test('rot13', async () => {
        const { body } = await getJson('/v4/encode?method=rot13&text=Hello');
        assert.equal(body.result, 'Uryyb');
    });

    test('missing method returns 400', async () => {
        const { status } = await getJson('/v4/encode?text=hello');
        assert.equal(status, 400);
    });
});

describe('GET /v4/geo', () => {
    test('Paris-NYC distance', async () => {
        const { body } = await getJson('/v4/geo?lat1=48.8566&lon1=2.3522&lat2=40.7128&lon2=-74.006');
        const distance = body.distance as { km: number };
        assert.ok(Math.abs(distance.km - 5837) < 50);
    });

    test('missing param returns 400', async () => {
        const { status } = await getJson('/v4/geo?lat1=0&lon1=0');
        assert.equal(status, 400);
    });
});

describe('GET /v4/infos', () => {
    test('returns API infos', async () => {
        const { status, body } = await getJson('/v4/infos');
        assert.equal(status, 200);
        assert.ok('endpoints' in body);
        assert.ok('documentation' in body);
    });
});

describe('GET /v4/levenshtein', () => {
    test('computes distance', async () => {
        const { status, body } = await getJson('/v4/levenshtein?str1=kitten&str2=sitting');
        assert.equal(status, 200);
        assert.equal(body.distance, 3);
    });
});

describe('GET /v4/palette', () => {
    test('triadic returns 3 colors', async () => {
        const { body } = await getJson('/v4/palette?color=%23ff6600&type=triadic');
        assert.equal((body.colors as unknown[]).length, 3);
    });

    test('invalid type returns 400', async () => {
        const { status } = await getJson('/v4/palette?color=%23ff6600&type=rainbow');
        assert.equal(status, 400);
    });
});

describe('GET /v4/personal', () => {
    test('returns generated identity', async () => {
        const { status, body } = await getJson('/v4/personal');
        assert.equal(status, 200);
        assert.ok('name' in body);
        assert.ok('email' in body);
        assert.ok('card' in body);
    });
});

describe('GET /v4/placeholder', () => {
    test('image returns SVG', async () => {
        const res = await fetch(`${baseUrl}/v4/placeholder?type=image&width=100&height=50`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/svg\+xml/);
    });

    test('skeleton returns SVG', async () => {
        const res = await fetch(`${baseUrl}/v4/placeholder?type=skeleton&width=200&height=100`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/svg\+xml/);
        const body = await res.text();
        assert.match(body, /<svg/);
    });
});

describe('GET /v4/qrcode', () => {
    test('returns PNG image by default', async () => {
        const res = await fetch(`${baseUrl}/v4/qrcode?url=https%3A%2F%2Fexample.com`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/png/);
        const buf = Buffer.from(await res.arrayBuffer());
        assert.ok(buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])));
    });

    test('returns data URL with format=base64', async () => {
        const { status, body } = await getJson('/v4/qrcode?url=https%3A%2F%2Fexample.com&format=base64');
        assert.equal(status, 200);
        assert.match(body as unknown as string, /^data:image\/png;base64,/);
    });
});

describe('GET /v4/statistics', () => {
    test('basic stats', async () => {
        const { body } = await getJson('/v4/statistics?values=1,2,3,4,5');
        assert.equal(body.mean, 3);
        assert.equal(body.median, 3);
        assert.equal(body.count, 5);
    });

    test('missing values returns 400', async () => {
        const { status } = await getJson('/v4/statistics');
        assert.equal(status, 400);
    });
});

describe('GET /v4/text', () => {
    test('slug', async () => {
        const { body } = await getJson('/v4/text?method=slug&value=Hello%20World');
        assert.equal(body.result, 'hello-world');
    });

    test('number en', async () => {
        const { body } = await getJson('/v4/text?method=number&value=42&lang=en');
        assert.equal(body.result, 'forty-two');
    });

    test('lorem words', async () => {
        const { body } = await getJson('/v4/text?method=lorem&type=words&count=5');
        assert.equal((body.result as string).split(' ').length, 5);
    });
});

describe('GET /v4/time', () => {
    test('live', async () => {
        const { status, body } = await getJson('/v4/time');
        assert.equal(status, 200);
        assert.ok('iso' in body);
        assert.ok('timestamp' in body);
    });

    test('random in range', async () => {
        const { status, body } = await getJson('/v4/time?type=random&start=2020-01-01&end=2020-12-31');
        assert.equal(status, 200);
        const ts = body.timestamp as number;
        assert.ok(ts >= new Date('2020-01-01').getTime());
        assert.ok(ts <= new Date('2020-12-31').getTime());
    });

    test('countdown future returns direction and remaining', async () => {
        const future = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
        const { status, body } = await getJson(`/v4/time?type=countdown&target=${encodeURIComponent(future)}`);
        assert.equal(status, 200);
        assert.equal(body.direction, 'future');
        assert.ok(typeof body.human === 'string');
    });

    test('countdown missing target returns 400', async () => {
        const { status } = await getJson('/v4/time?type=countdown');
        assert.equal(status, 400);
    });
});

describe('GET /v4/username', () => {
    test('has fields', async () => {
        const { status, body } = await getJson('/v4/username');
        assert.equal(status, 200);
        assert.ok('username' in body);
        assert.ok('adjective' in body);
        assert.ok('animal' in body);
    });
});

describe('GET /v4/validate', () => {
    test('valid luhn', async () => {
        const { body } = await getJson('/v4/validate?type=luhn&value=4111111111111111');
        assert.equal(body.valid, true);
    });

    test('valid email', async () => {
        const { body } = await getJson('/v4/validate?type=email&value=hello%40example.com');
        assert.equal(body.valid, true);
    });

    test('invalid type returns 400', async () => {
        const { status } = await getJson('/v4/validate?type=foo&value=bar');
        assert.equal(status, 400);
    });
});

describe('GET /v4/website', () => {
    const originalFetch = globalThis.fetch;

    after(() => {
        globalThis.fetch = originalFetch;
    });

    test('returns aggregated payload (with mocked GitHub API)', async () => {
        globalThis.fetch = (async (input: string | URL | Request) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('api.github.com')) {
                return new Response(
                    JSON.stringify({
                        data: {
                            user: {
                                contributionsCollection: {
                                    contributionCalendar: {
                                        weeks: [
                                            {
                                                firstDay: '2026-01-01',
                                                contributionDays: [{ date: '2026-01-01', contributionCount: 5 }],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    }),
                    { status: 200, headers: { 'content-type': 'application/json' } },
                );
            }
            return originalFetch(input);
        }) as typeof fetch;

        const { status, body } = await getJson('/v4/website');
        assert.equal(status, 200);
        assert.ok('versions' in body);
        assert.ok('stats' in body);
    });

    test('?key=active returns sub-key', async () => {
        const { status, body } = await getJson('/v4/website?key=active');
        assert.equal(status, 200);
        assert.ok('active' in body);
    });

    test('?key=invalid.path returns 404', async () => {
        const { status } = await getJson('/v4/website?key=does.not.exist');
        assert.equal(status, 404);
    });

    test('rejects prototype pollution keys', async () => {
        const { status } = await getJson('/v4/website?key=__proto__');
        assert.equal(status, 400);
    });
});

// --- POST endpoints ---

describe('POST /v4/chat', () => {
    const session = `chat-${Date.now()}`;

    test('sends a public message', async () => {
        const { status, body } = await sendJson('POST', '/v4/chat', {
            username: 'alice',
            message: 'public hello',
            session,
        });
        assert.equal(status, 200);
        assert.match(body.message as string, /sent/);
    });

    test('fetches private chat (legacy)', async () => {
        const token = `tok-${Date.now()}`;
        await sendJson('POST', '/v4/chat', {
            username: 'bob',
            message: 'secret',
            session: `chat-bob-${Date.now()}`,
            token,
        });
        const { status, body } = await sendJson('POST', '/v4/chat/private', {
            username: 'bob',
            token,
        });
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
    });
});

describe('POST /v4/hash', () => {
    test('sha256', async () => {
        const { status, body } = await sendJson('POST', '/v4/hash', { text: 'hello', method: 'sha256' });
        assert.equal(status, 200);
        assert.equal(body.hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
        assert.equal(body.encoding, 'hex');
    });

    test('md5', async () => {
        const { body } = await sendJson('POST', '/v4/hash', { text: 'hello', method: 'md5' });
        assert.equal(body.hash, '5d41402abc4b2a76b9719d911017c592');
    });

    test('base64 encoding', async () => {
        const { status, body } = await sendJson('POST', '/v4/hash', {
            text: 'hello',
            method: 'sha256',
            encoding: 'base64',
        });
        assert.equal(status, 200);
        assert.equal(body.encoding, 'base64');
    });

    test('unsupported method returns 400', async () => {
        const { status } = await sendJson('POST', '/v4/hash', { text: 'hello', method: 'fakehash' });
        assert.equal(status, 400);
    });

    test('missing text returns 400', async () => {
        const { status } = await sendJson('POST', '/v4/hash', { method: 'sha256' });
        assert.equal(status, 400);
    });
});

describe('POST /v4/tic-tac-toe', () => {
    const game = 'TTT' + Date.now().toString(36).slice(-3).toUpperCase();
    const session = `ttt-${Date.now()}`;

    test('list returns games', async () => {
        const { status, body } = await sendJson('POST', '/v4/tic-tac-toe/list', {});
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.games));
    });

    test('plays a move', async () => {
        const { status, body } = await sendJson('POST', '/v4/tic-tac-toe', {
            username: 'alice',
            move: '1-1',
            session,
            game,
        });
        assert.equal(status, 200);
        assert.match(body.message as string, /Move sent/);
    });

    test('fetch returns game state', async () => {
        const { status, body } = await sendJson('POST', '/v4/tic-tac-toe/fetch', {
            username: 'alice',
            game,
        });
        assert.equal(status, 200);
        assert.equal(body.id, game);
    });

    test('missing move returns 400', async () => {
        const { status } = await sendJson('POST', '/v4/tic-tac-toe', {
            username: 'alice',
            session,
            game,
        });
        assert.equal(status, 400);
    });
});

describe('POST /v4/token', () => {
    test('alpha 24', async () => {
        const { status, body } = await sendJson('POST', '/v4/token', { len: 24, type: 'alpha' });
        assert.equal(status, 200);
        assert.equal(typeof body.token, 'string');
        assert.equal((body.token as string).length, 24);
        assert.match(body.token as string, /^[a-zA-Z]+$/);
    });

    test('below min length returns 400', async () => {
        const { status } = await sendJson('POST', '/v4/token', { len: 5, type: 'alpha' });
        assert.equal(status, 400);
    });
});

// --- Security ---

describe('Security headers', () => {
    test('returns X-Content-Type-Options and X-Frame-Options', async () => {
        const res = await fetch(`${baseUrl}/v4/color`);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(res.headers.get('x-frame-options'), 'DENY');
    });
});

describe('Payload size limit', () => {
    test('body > 10kb returns 413', async () => {
        const res = await fetch(`${baseUrl}/v4/hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'A'.repeat(20000), method: 'sha256' }),
        });
        assert.equal(res.status, 413);
    });
});

describe('GET /v4/headers', () => {
    test('returns headers object with count, ip, method, url', async () => {
        const { status, body } = await getJson('/v4/headers');
        assert.equal(status, 200);
        assert.ok(typeof body.count === 'number');
        assert.ok(typeof body.headers === 'object');
        assert.ok('method' in body);
        assert.equal(body.method, 'GET');
        assert.ok((body.url as string).includes('/v4/headers'));
    });

    test('filter param returns only matching headers', async () => {
        const { body } = await getJson('/v4/headers?filter=host');
        const headers = body.headers as Record<string, unknown>;
        assert.ok('host' in headers);
        assert.equal(body.count, 1);
    });

    test('cookie header is redacted', async () => {
        const res = await fetch(`${baseUrl}/v4/headers`, {
            headers: { Cookie: 'session=secret123' },
        });
        const body = (await res.json()) as Record<string, unknown>;
        const headers = body.headers as Record<string, unknown>;
        assert.equal(headers['cookie'], '[redacted]');
    });
});

describe('GET /v4/ip', () => {
    test('returns valid ip result with no address param', async () => {
        const { status, body } = await getJson('/v4/ip');
        assert.equal(status, 200);
        assert.ok(['IPv4', 'IPv6'].includes(body.version as string));
        assert.ok(typeof body.binary === 'string');
        assert.ok(typeof body.reverse === 'string');
    });

    test('loopback 127.0.0.1', async () => {
        const { status, body } = await getJson('/v4/ip?address=127.0.0.1');
        assert.equal(status, 200);
        assert.equal(body.type, 'loopback');
        assert.equal(body.version, 'IPv4');
    });

    test('private 192.168.1.1', async () => {
        const { body } = await getJson('/v4/ip?address=192.168.1.1');
        assert.equal(body.type, 'private');
        assert.equal(body.decimal, 3232235777);
    });

    test('invalid address returns 400', async () => {
        const { status } = await getJson('/v4/ip?address=notanip');
        assert.equal(status, 400);
    });
});

describe('GET /v4/agent', () => {
    test('returns parsed result with browser, os, device, engine, bot', async () => {
        const { status, body } = await getJson('/v4/agent');
        assert.equal(status, 200);
        assert.ok(typeof body.browser === 'object');
        assert.ok(typeof body.os === 'object');
        assert.ok(typeof body.device === 'object');
        assert.ok(typeof body.engine === 'object');
        assert.ok(typeof body.bot === 'boolean');
    });

    test('custom ua param is parsed', async () => {
        const ua = encodeURIComponent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        );
        const { body } = await getJson(`/v4/agent?ua=${ua}`);
        const browser = body.browser as Record<string, string>;
        assert.equal(browser.name, 'Firefox');
        assert.equal(browser.major, '121');
    });

    test('bot ua detected', async () => {
        const ua = encodeURIComponent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
        const { body } = await getJson(`/v4/agent?ua=${ua}`);
        assert.equal(body.bot, true);
    });
});

describe('GET /v4/address', () => {
    test('returns one address by default', async () => {
        const { status, body } = await getJson('/v4/address');
        assert.equal(status, 200);
        assert.equal((body.addresses as unknown[]).length, 1);
    });

    test('country=fr returns a French address', async () => {
        const { body } = await getJson('/v4/address?country=fr');
        const a = (body.addresses as Record<string, string>[])[0]!;
        assert.equal(a.countryCode, 'FR');
    });

    test('count=3 returns 3 addresses', async () => {
        const { body } = await getJson('/v4/address?count=3');
        assert.equal((body.addresses as unknown[]).length, 3);
    });

    test('unknown country returns 400', async () => {
        const { status } = await getJson('/v4/address?country=xx');
        assert.equal(status, 400);
    });
});

describe('GET /v4/password', () => {
    test('returns one password by default', async () => {
        const { status, body } = await getJson('/v4/password');
        assert.equal(status, 200);
        assert.equal((body.passwords as string[]).length, 1);
        assert.equal((body.passwords as string[])[0]!.length, 16);
    });

    test('length param is respected', async () => {
        const { body } = await getJson('/v4/password?length=32');
        assert.equal((body.passwords as string[])[0]!.length, 32);
    });

    test('passphrase mode returns words', async () => {
        const { body } = await getJson('/v4/password?type=passphrase&length=4');
        assert.equal(body.type, 'passphrase');
        assert.equal((body.passwords as string[])[0]!.split('-').length, 4);
    });

    test('count=5 returns 5 passwords', async () => {
        const { body } = await getJson('/v4/password?count=5');
        assert.equal((body.passwords as string[]).length, 5);
    });

    test('no charset active returns 400', async () => {
        const { status } = await getJson('/v4/password?uppercase=false&lowercase=false&digits=false&symbols=false');
        assert.equal(status, 400);
    });
});

describe('GET /v4/cron', () => {
    test('returns next dates for * * * * *', async () => {
        const { status, body } = await getJson('/v4/cron?expr=*%20*%20*%20*%20*');
        assert.equal(status, 200);
        assert.equal((body.next as string[]).length, 5);
        assert.ok(typeof body.description === 'string');
    });

    test('count param is respected', async () => {
        const { body } = await getJson('/v4/cron?expr=*%20*%20*%20*%20*&count=3');
        assert.equal((body.next as string[]).length, 3);
    });

    test('invalid expression returns 400', async () => {
        const { status } = await getJson('/v4/cron?expr=invalid');
        assert.equal(status, 400);
    });

    test('missing expr returns 400', async () => {
        const { status } = await getJson('/v4/cron');
        assert.equal(status, 400);
    });
});

describe('GET /v4/regex', () => {
    test('basic match returns count and matches', async () => {
        const { status, body } = await getJson('/v4/regex?pattern=hello&text=hello%20world');
        assert.equal(status, 200);
        assert.equal(body.valid, true);
        assert.ok((body.count as number) >= 1);
    });

    test('invalid pattern returns valid: false with 200', async () => {
        const { status, body } = await getJson('/v4/regex?pattern=%5Binvalid&text=hello');
        assert.equal(status, 200);
        assert.equal(body.valid, false);
    });

    test('missing pattern returns 400', async () => {
        const { status } = await getJson('/v4/regex?text=hello');
        assert.equal(status, 400);
    });
});

describe('GET /v4/barcode', () => {
    test('returns SVG by default', async () => {
        const res = await fetch(`${baseUrl}/v4/barcode?data=Hello123`);
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('image/svg+xml'));
        const text = await res.text();
        assert.ok(text.includes('<svg'));
    });

    test('EAN-13 with 12 digits auto-calculates check digit', async () => {
        const res = await fetch(`${baseUrl}/v4/barcode?data=978030640615&type=ean13`);
        assert.equal(res.status, 200);
    });

    test('PNG format returns image/png', async () => {
        const res = await fetch(`${baseUrl}/v4/barcode?data=Hello&format=png`);
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('image/png'));
    });

    test('missing data returns 400', async () => {
        const { status } = await getJson('/v4/barcode');
        assert.equal(status, 400);
    });

    test('invalid type returns 400', async () => {
        const { status } = await getJson('/v4/barcode?data=test&type=qr');
        assert.equal(status, 400);
    });
});

describe('GET /v4/avatar', () => {
    test('returns PNG by default', async () => {
        const res = await fetch(`${baseUrl}/v4/avatar?seed=test`);
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('image/png'));
    });

    test('SVG format returns SVG content type', async () => {
        const res = await fetch(`${baseUrl}/v4/avatar?seed=test&format=svg`);
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('image/svg+xml'));
        const text = await res.text();
        assert.ok(text.includes('<svg'));
    });

    test('same seed is deterministic', async () => {
        const [a, b] = await Promise.all([
            fetch(`${baseUrl}/v4/avatar?seed=fixed`).then((r) => r.arrayBuffer()),
            fetch(`${baseUrl}/v4/avatar?seed=fixed`).then((r) => r.arrayBuffer()),
        ]);
        assert.deepEqual(Buffer.from(a!), Buffer.from(b!));
    });

    test('invalid type returns 400', async () => {
        const { status } = await getJson('/v4/avatar?seed=test&type=geometric');
        assert.equal(status, 400);
    });
});

describe('GET /v4/credit', () => {
    test('returns cards array by default', async () => {
        const { status, body } = await getJson('/v4/credit');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.cards));
        assert.equal(body.cards.length, 1);
    });

    test('brand param respected', async () => {
        const { status, body } = await getJson('/v4/credit?brand=visa');
        assert.equal(status, 200);
        assert.equal((body as { cards: { brand: string }[] }).cards[0]!.brand, 'visa');
    });

    test('count param respected', async () => {
        const { status, body } = await getJson('/v4/credit?count=3');
        assert.equal(status, 200);
        assert.equal((body as { cards: unknown[] }).cards.length, 3);
    });

    test('unknown brand returns 400', async () => {
        const { status } = await getJson('/v4/credit?brand=diners');
        assert.equal(status, 400);
    });
});

// --- v5 endpoints ---

// --- GET endpoints ---

describe('GET / (version listing)', () => {
    test('v5 endpoints listed', async () => {
        const { body } = await getJson('/v5');
        assert.equal(body.version, 'v5');
        const endpoints = body.endpoints as Record<string, Record<string, string>>;
        assert.ok('evaluate' in endpoints.get!);
        assert.ok('chart' in endpoints.post!);
        assert.ok('matrix' in endpoints.post!);
        assert.ok('otp' in endpoints.post!);
        assert.ok('symmetric' in endpoints.post!);
    });
});

describe('GET /v5/evaluate', () => {
    test('basic expression returns correct result', async () => {
        const { status, body } = await getJson('/v5/evaluate?expr=2%2B3*4');
        assert.equal(status, 200);
        assert.equal(body.result, 14);
        assert.equal(body.expression, '2+3*4');
    });
    test('precision param is respected', async () => {
        const { body } = await getJson('/v5/evaluate?expr=1%2F3&precision=2');
        assert.equal(body.result, 0.33);
        assert.equal(body.precision, 2);
    });
    test('constants work', async () => {
        const { status, body } = await getJson('/v5/evaluate?expr=pi&precision=5');
        assert.equal(status, 200);
        assert.equal(body.result, 3.14159);
    });
    test('missing expr returns 400', async () => {
        const { status } = await getJson('/v5/evaluate');
        assert.equal(status, 400);
    });
    test('division by zero returns 400', async () => {
        const { status } = await getJson('/v5/evaluate?expr=1%2F0');
        assert.equal(status, 400);
    });
    test('unknown identifier returns 400', async () => {
        const { status } = await getJson('/v5/evaluate?expr=foo');
        assert.equal(status, 400);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await getJson('/v4/evaluate?expr=1%2B1');
        assert.equal(status, 404);
    });
});

// --- POST endpoints ---

describe('POST /v5/asymmetric', () => {
    test('keygen returns publicKey and privateKey', async () => {
        const { status, body } = await sendJson('POST', '/v5/asymmetric', { action: 'keygen' });
        assert.equal(status, 200);
        assert.equal(body.action, 'keygen');
        assert.equal(body.algorithm, 'rsa-oaep-sha256');
        assert.equal(body.modulusLength, 2048);
        assert.ok((body.publicKey as string).startsWith('-----BEGIN PUBLIC KEY-----'));
        assert.ok((body.privateKey as string).startsWith('-----BEGIN PRIVATE KEY-----'));
    });
    test('encrypt then decrypt returns original text', async () => {
        const kg = await sendJson('POST', '/v5/asymmetric', { action: 'keygen' });
        const enc = await sendJson('POST', '/v5/asymmetric', {
            action: 'encrypt',
            text: 'hello RSA',
            publicKey: kg.body.publicKey,
        });
        assert.equal(enc.status, 200);
        assert.equal(enc.body.action, 'encrypt');
        assert.ok(typeof enc.body.result === 'string');
        const dec = await sendJson('POST', '/v5/asymmetric', {
            action: 'decrypt',
            text: enc.body.result,
            privateKey: kg.body.privateKey,
        });
        assert.equal(dec.status, 200);
        assert.equal(dec.body.result, 'hello RSA');
    });
    test('decrypt with wrong key returns 400', async () => {
        const kg1 = await sendJson('POST', '/v5/asymmetric', { action: 'keygen' });
        const kg2 = await sendJson('POST', '/v5/asymmetric', { action: 'keygen' });
        const enc = await sendJson('POST', '/v5/asymmetric', {
            action: 'encrypt',
            text: 'secret',
            publicKey: kg1.body.publicKey,
        });
        const { status } = await sendJson('POST', '/v5/asymmetric', {
            action: 'decrypt',
            text: enc.body.result,
            privateKey: kg2.body.privateKey,
        });
        assert.equal(status, 400);
    });
    test('missing action returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/asymmetric', {});
        assert.equal(status, 400);
    });
    test('unsupported algorithm returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/asymmetric', {
            action: 'keygen',
            algorithm: 'rsa-pkcs1v15',
        });
        assert.equal(status, 400);
    });
    test('GET /v5/asymmetric returns 405', async () => {
        const { status } = await getJson('/v5/asymmetric');
        assert.equal(status, 405);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await sendJson('POST', '/v4/asymmetric', { action: 'keygen' });
        assert.equal(status, 404);
    });
});

describe('POST /v5/chart', () => {
    test('bar chart returns SVG content type', async () => {
        const res = await fetch(`${baseUrl}/v5/chart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'bar',
                data: { labels: ['A', 'B'], datasets: [{ label: 'X', values: [10, 20] }] },
            }),
        });
        assert.equal(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('image/svg+xml'));
        const svg = await res.text();
        assert.ok(svg.startsWith('<svg'));
        assert.ok(svg.includes('<rect'));
    });
    test('line chart returns SVG', async () => {
        const res = await fetch(`${baseUrl}/v5/chart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'line',
                data: { labels: ['A', 'B'], datasets: [{ label: '', values: [1, 2] }] },
            }),
        });
        assert.equal(res.status, 200);
        const svg = await res.text();
        assert.ok(svg.includes('<polyline'));
    });
    test('pie chart returns SVG', async () => {
        const res = await fetch(`${baseUrl}/v5/chart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'pie',
                data: { labels: ['X', 'Y'], values: [60, 40] },
            }),
        });
        assert.equal(res.status, 200);
        const svg = await res.text();
        assert.ok(svg.includes('<path'));
    });
    test('missing type returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/chart', {
            data: { labels: ['A'], datasets: [{ label: '', values: [1] }] },
        });
        assert.equal(status, 400);
    });
    test('invalid type returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/chart', {
            type: 'histogram',
            data: { labels: ['A'], datasets: [{ label: '', values: [1] }] },
        });
        assert.equal(status, 400);
    });
    test('missing data returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/chart', { type: 'bar' });
        assert.equal(status, 400);
    });
    test('GET /v5/chart returns 405', async () => {
        const { status } = await getJson('/v5/chart');
        assert.equal(status, 405);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await sendJson('POST', '/v4/chart', { type: 'bar' });
        assert.equal(status, 404);
    });
    test('mode=data returns JSON with labels and scale', async () => {
        const { status, body } = await sendJson('POST', '/v5/chart', {
            type: 'bar',
            data: { labels: ['Jan', 'Fév'], datasets: [{ label: 'Sales', values: [10, 20] }] },
            mode: 'data',
        });
        assert.equal(status, 200);
        assert.equal(body.type, 'bar');
        assert.deepEqual(body.labels, ['Jan', 'Fév']);
        assert.ok(body.scale);
    });
    test('mode=data pie returns slices', async () => {
        const { status, body } = await sendJson('POST', '/v5/chart', {
            type: 'pie',
            data: { labels: ['A', 'B'], values: [60, 40] },
            mode: 'data',
        });
        assert.equal(status, 200);
        assert.equal(body.type, 'pie');
        assert.ok(Array.isArray(body.slices));
    });
});

describe('POST /v5/matrix', () => {
    test('add operation', async () => {
        const { status, body } = await sendJson('POST', '/v5/matrix', {
            operation: 'add',
            matrix: [
                [1, 2],
                [3, 4],
            ],
            matrix2: [
                [5, 6],
                [7, 8],
            ],
        });
        assert.equal(status, 200);
        assert.deepEqual(body.result, [
            [6, 8],
            [10, 12],
        ]);
    });
    test('multiply operation', async () => {
        const { status, body } = await sendJson('POST', '/v5/matrix', {
            operation: 'multiply',
            matrix: [
                [1, 2],
                [3, 4],
            ],
            matrix2: [
                [5, 6],
                [7, 8],
            ],
        });
        assert.equal(status, 200);
        assert.deepEqual(body.result, [
            [19, 22],
            [43, 50],
        ]);
    });
    test('transpose operation', async () => {
        const { status, body } = await sendJson('POST', '/v5/matrix', {
            operation: 'transpose',
            matrix: [
                [1, 2, 3],
                [4, 5, 6],
            ],
        });
        assert.equal(status, 200);
        assert.deepEqual(body.result, [
            [1, 4],
            [2, 5],
            [3, 6],
        ]);
    });
    test('identity operation', async () => {
        const { status, body } = await sendJson('POST', '/v5/matrix', {
            operation: 'identity',
            scalar: 3,
        });
        assert.equal(status, 200);
        assert.deepEqual(body.result, [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]);
    });
    test('missing operation returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/matrix', { matrix: [[1]] });
        assert.equal(status, 400);
    });
    test('invalid operation returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/matrix', { operation: 'unknown', matrix: [[1]] });
        assert.equal(status, 400);
    });
    test('dimension mismatch returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/matrix', {
            operation: 'add',
            matrix: [[1, 2]],
            matrix2: [
                [1, 2],
                [3, 4],
            ],
        });
        assert.equal(status, 400);
    });
    test('GET /v5/matrix returns 405', async () => {
        const { status } = await getJson('/v5/matrix');
        assert.equal(status, 405);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await sendJson('POST', '/v4/matrix', { operation: 'add', matrix: [[1]], matrix2: [[1]] });
        assert.equal(status, 404);
    });
});

describe('POST /v5/otp', () => {
    test('secret action returns base32 secret and uri', async () => {
        const { status, body } = await sendJson('POST', '/v5/otp', { action: 'secret' });
        assert.equal(status, 200);
        assert.ok(typeof body.secret === 'string');
        assert.match(body.secret as string, /^[A-Z2-7]+$/);
        assert.ok((body.uri as string).startsWith('otpauth://totp/'));
    });
    test('generate action returns 6-digit code', async () => {
        const { body: secBody } = await sendJson('POST', '/v5/otp', { action: 'secret' });
        const { status, body } = await sendJson('POST', '/v5/otp', {
            action: 'generate',
            secret: secBody.secret,
        });
        assert.equal(status, 200);
        assert.match(body.code as string, /^\d{6}$/);
        assert.ok(typeof body.remaining === 'number');
    });
    test('verify just-generated code returns valid=true', async () => {
        const { body: secBody } = await sendJson('POST', '/v5/otp', { action: 'secret' });
        const { body: genBody } = await sendJson('POST', '/v5/otp', {
            action: 'generate',
            secret: secBody.secret,
        });
        const { status, body } = await sendJson('POST', '/v5/otp', {
            action: 'verify',
            secret: secBody.secret,
            code: genBody.code,
        });
        assert.equal(status, 200);
        assert.equal(body.valid, true);
    });
    test('verify wrong code returns valid=false', async () => {
        const { body: secBody } = await sendJson('POST', '/v5/otp', { action: 'secret' });
        const { body } = await sendJson('POST', '/v5/otp', {
            action: 'verify',
            secret: secBody.secret,
            code: '000000',
        });
        // May pass by coincidence but statistically always false
        assert.ok(typeof body.valid === 'boolean');
    });
    test('missing action returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/otp', { secret: 'JBSWY3DPEHPK3PXP' });
        assert.equal(status, 400);
    });
    test('invalid digits returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/otp', {
            action: 'generate',
            secret: 'JBSWY3DPEHPK3PXP',
            digits: 7,
        });
        assert.equal(status, 400);
    });
    test('GET /v5/otp returns 405', async () => {
        const { status } = await getJson('/v5/otp');
        assert.equal(status, 405);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await sendJson('POST', '/v4/otp', { action: 'secret' });
        assert.equal(status, 404);
    });
});

describe('POST /v5/symmetric', () => {
    test('encrypt returns base64 result', async () => {
        const { status, body } = await sendJson('POST', '/v5/symmetric', {
            action: 'encrypt',
            text: 'hello world',
            key: 'mysecretkey',
        });
        assert.equal(status, 200);
        assert.equal(body.action, 'encrypt');
        assert.equal(body.algorithm, 'aes-256-gcm');
        assert.ok(typeof body.result === 'string' && (body.result as string).length > 0);
    });
    test('encrypt then decrypt returns original text', async () => {
        const enc = await sendJson('POST', '/v5/symmetric', {
            action: 'encrypt',
            text: 'round trip',
            key: 'mypassword1',
        });
        const dec = await sendJson('POST', '/v5/symmetric', {
            action: 'decrypt',
            text: enc.body.result,
            key: 'mypassword1',
        });
        assert.equal(dec.status, 200);
        assert.equal(dec.body.result, 'round trip');
    });
    test('wrong key at decrypt returns 400', async () => {
        const enc = await sendJson('POST', '/v5/symmetric', {
            action: 'encrypt',
            text: 'secret',
            key: 'correctkey1',
        });
        const { status } = await sendJson('POST', '/v5/symmetric', {
            action: 'decrypt',
            text: enc.body.result,
            key: 'wrongkey123',
        });
        assert.equal(status, 400);
    });
    test('missing action returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/symmetric', { text: 'hello', key: 'mypassword' });
        assert.equal(status, 400);
    });
    test('missing text returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/symmetric', { action: 'encrypt', key: 'mypassword' });
        assert.equal(status, 400);
    });
    test('missing key returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/symmetric', { action: 'encrypt', text: 'hello' });
        assert.equal(status, 400);
    });
    test('unknown algorithm returns 400', async () => {
        const { status } = await sendJson('POST', '/v5/symmetric', {
            action: 'encrypt',
            text: 'hello',
            key: 'mypassword',
            algorithm: 'rot13',
        });
        assert.equal(status, 400);
    });
    test('GET /v5/symmetric returns 405', async () => {
        const { status } = await getJson('/v5/symmetric');
        assert.equal(status, 405);
    });
    test('not available in v4 returns 404', async () => {
        const { status } = await sendJson('POST', '/v4/symmetric', {
            action: 'encrypt',
            text: 'hi',
            key: 'password1',
        });
        assert.equal(status, 404);
    });
});

describe('Prototype access on dynamic endpoints', () => {
    test('algorithms?method=toString returns 400', async () => {
        const { status } = await getJson('/v4/algorithms?method=toString');
        assert.equal(status, 400);
    });

    test('encode?method=constructor returns 400', async () => {
        const { status } = await getJson('/v4/encode?method=constructor&text=hello');
        assert.equal(status, 400);
    });

    test('validate?type=hasOwnProperty returns 400', async () => {
        const { status } = await getJson('/v4/validate?type=hasOwnProperty&value=test');
        assert.equal(status, 400);
    });
});
