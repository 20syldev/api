import { test, describe, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
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
    test('returns PNG', async () => {
        const res = await fetch(`${baseUrl}/v4/captcha?text=hello`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /image\/png/);
    });

    test('without text returns 400', async () => {
        const { status } = await getJson('/v4/captcha');
        assert.equal(status, 400);
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
    test('returns color formats', async () => {
        const { status, body } = await getJson('/v4/color');
        assert.equal(status, 200);
        assert.match(body.hex as string, /^#[0-9a-f]{6}$/);
        assert.ok('rgb' in body);
        assert.ok('hsl' in body);
        assert.ok('cmyk' in body);
    });
});

describe('GET /v4/convert', () => {
    test('celsius to fahrenheit', async () => {
        const { status, body } = await getJson('/v4/convert?value=100&from=celsius&to=fahrenheit');
        assert.equal(status, 200);
        assert.equal(body.result, 212);
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
    test('returns data URL', async () => {
        const { status, body } = await getJson('/v4/qrcode?url=https%3A%2F%2Fexample.com');
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
    });

    test('md5', async () => {
        const { body } = await sendJson('POST', '/v4/hash', { text: 'hello', method: 'md5' });
        assert.equal(body.hash, '5d41402abc4b2a76b9719d911017c592');
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
