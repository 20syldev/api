import { type Request, type Response, Router } from 'express';

import { env } from '../config/env.js';
import { versions } from '../config/versions.js';
import { DOCS_URL, GITHUB_CACHE_TTL } from '../constants.js';
import type { UserAgentResult } from '../modules/v4/agent.js';
import type { CaptchaOptions, CaptchaResult } from '../modules/v4/captcha.js';
import type { ColorResult } from '../modules/v4/color.js';
import type { IpResult } from '../modules/v4/ip.js';
import type { QRCodeOptions, QRCodeResult } from '../modules/v4/qrcode.js';
import { chatStorage, ipLimits } from '../storage/index.js';
import { since } from '../utils/helpers.js';
import { error } from '../utils/response.js';

const router = Router();

let activity: Record<string, unknown>[] = [];
let lastFetch = 0;

// Display version information
router.get('/:version', (req: Request, res: Response) => {
    const version = req.params.version as string;
    const versionConfig = versions[version]!;

    const endpoints = Object.keys(versionConfig.endpoints).reduce<Record<string, unknown>>((acc, method) => {
        const endpointList = versionConfig.endpoints[method as keyof typeof versionConfig.endpoints];
        if (!endpointList) return acc;
        acc[method] = endpointList
            .filter(({ name }: { name: string }) => name !== 'website')
            .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
            .reduce<Record<string, unknown>>(
                (
                    group: Record<string, unknown>,
                    endpoint: { name: string; path?: string; children?: Record<string, string> },
                ) => {
                    if (endpoint.children) {
                        group[endpoint.name] = Object.keys(endpoint.children)
                            .sort((a: string, b: string) => a.localeCompare(b))
                            .reduce<Record<string, string>>((childGroup, childName) => {
                                childGroup[childName] = `/${version}${endpoint.children![childName]}`;
                                return childGroup;
                            }, {});
                    } else {
                        group[endpoint.name] = `/${version}${endpoint.path}`;
                    }
                    return group;
                },
                {},
            );
        return acc;
    }, {});

    res.jsonResponse({
        version,
        documentation: `${DOCS_URL}/${version}`,
        endpoints,
    });
});

// Algorithms
router.get('/:version/algorithms', (req: Request, res: Response) => {
    const { method, value, value2 } = req.query;
    const { version } = req.params;

    const algorithms = req.module.algorithms as Record<string, (v: string, v2?: string) => unknown>;
    if (!algorithms || !method || !Object.hasOwn(algorithms, method as string)) {
        error(res, 400, 'Please provide a valid algorithm (?method={algorithm})', `${version}/algorithms`);
        return;
    }

    try {
        const answer = algorithms[method as string]!(value as string, value2 as string);
        res.jsonResponse({ answer });
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/algorithms`);
    }
});

// Generate captcha
router.get('/:version/captcha', (req: Request, res: Response) => {
    try {
        if (since(req.version, 4)) {
            const captchaFn = req.module.captcha as (o: CaptchaOptions) => CaptchaResult;
            const result = captchaFn({
                text: req.query.text as string | undefined,
                length: req.query.length ? Number(req.query.length) : undefined,
                width: req.query.width ? Number(req.query.width) : undefined,
                height: req.query.height ? Number(req.query.height) : undefined,
                noise: req.query.noise as CaptchaOptions['noise'],
                bg: req.query.bg as string | undefined,
                color: req.query.color as string | undefined,
            });
            res.set('X-Captcha-Text', result.text);
            res.type('png').send(result.body);
        } else {
            const text = req.query.text as string;
            if (!text) {
                error(res, 400, 'Please provide a valid argument (?text={text})', `${req.version}/captcha`);
                return;
            }
            const result = (req.module.captcha as (t: string) => Buffer)(text);
            res.type('png').send(result);
        }
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/captcha`);
    }
});

// Display stored data
router.get('/:version/chat', (req: Request, res: Response) => {
    try {
        const messages = req.module.chat('fetch', {
            username: 'system',
            storage: chatStorage,
        });
        res.jsonResponse(messages);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// GET private chat error
router.get('/:version/chat/private', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

// Generate color
router.get('/:version/color', (req: Request, res: Response) => {
    try {
        if (since(req.version, 4)) {
            const colorFn = req.module.color as (hex?: string) => ColorResult;
            const hex = req.query.hex as string | undefined;
            const result = colorFn(hex || undefined);
            res.jsonResponse(result);
        } else {
            const result = (req.module.color as () => Record<string, string>)();
            res.jsonResponse(result);
        }
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/color`);
    }
});

// Convert units
router.get('/:version/convert', (req: Request, res: Response) => {
    const { value, from, to } = req.query;

    if (!value || isNaN(Number(value))) {
        error(res, 400, 'Please provide a valid value (?value={value})', `${req.version}/convert`);
        return;
    }
    if (!from) {
        error(res, 400, 'Please provide a valid source unit (&from={unit})', `${req.version}/convert`);
        return;
    }
    if (!to) {
        error(res, 400, 'Please provide a valid target unit (&to={unit})', `${req.version}/convert`);
        return;
    }

    try {
        if (since(req.version, 4)) {
            const convertFn = req.module.convert as (v: number, f: string, t: string) => Record<string, unknown>;
            const result = convertFn(Number(value), from as string, to as string);
            res.jsonResponse(result);
        } else {
            const result = (req.module.convert as (v: string, f: string, t: string) => Record<string, unknown>)(
                value as string,
                from as string,
                to as string,
            );
            res.jsonResponse(result);
        }
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/convert`);
    }
});

// Echo request headers
router.get('/:version/headers', (req: Request, res: Response) => {
    const redacted = new Set(['authorization', 'cookie', 'set-cookie', 'proxy-authorization']);
    let headers: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(req.headers)) {
        headers[k] = redacted.has(k) ? '[redacted]' : v;
    }

    const filter = req.query.filter as string | undefined;
    if (filter) {
        const keys = new Set(filter.split(',').map((k) => k.trim().toLowerCase()));
        headers = Object.fromEntries(Object.entries(headers).filter(([k]) => keys.has(k)));
    }

    res.jsonResponse({
        count: Object.keys(headers).length,
        headers,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
    });
});

// Analyze an IP address
router.get('/:version/ip', (req: Request, res: Response) => {
    const address = (req.query.address as string | undefined) ?? req.ip ?? '';
    try {
        const ipFn = (req.module as Record<string, unknown>).ip as (a: string) => IpResult;
        const result = ipFn(address);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/ip`);
    }
});

// Parse a User-Agent string
router.get('/:version/agent', (req: Request, res: Response) => {
    const ua = (req.query.ua as string | undefined) ?? (req.headers['user-agent'] as string) ?? '';
    try {
        const agentFn = (req.module as Record<string, unknown>).agent as (ua: string) => UserAgentResult;
        const result = agentFn(ua);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/agent`);
    }
});

// Generate domain informations
router.get('/:version/domain', (req: Request, res: Response) => {
    try {
        const result = req.module.domain();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/domain`);
    }
});

// RPG Dice roller
router.get('/:version/dice', (req: Request, res: Response) => {
    const { roll } = req.query;
    const { version } = req.params;

    const dice = (req.module as { dice?: (r: string) => unknown }).dice;
    if (!dice) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/dice`);
        return;
    }
    if (!roll) {
        error(res, 400, 'Please provide a roll notation (?roll=2d6+3)', `${version}/dice`);
        return;
    }

    try {
        const result = dice(roll as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/dice`);
    }
});

// Encode / decode text
router.get('/:version/encode', (req: Request, res: Response) => {
    const { method, text, shift } = req.query;
    const { version } = req.params;

    const encode = (req.module as { encode?: Record<string, (v: string, v2?: string) => string> }).encode;
    if (!encode) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/encode`);
        return;
    }
    if (!method || !Object.hasOwn(encode, method as string)) {
        error(res, 400, 'Please provide a valid method (?method={method})', `${version}/encode`);
        return;
    }

    try {
        const result = encode[method as string]!(text as string, shift as string);
        res.jsonResponse({ method, result });
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/encode`);
    }
});

// Geographic distance and bearing between two coordinates
router.get('/:version/geo', (req: Request, res: Response) => {
    const { lat1, lon1, lat2, lon2 } = req.query;
    const { version } = req.params;

    const geo = (req.module as { geo?: (a: string, b: string, c: string, d: string) => unknown }).geo;
    if (!geo) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/geo`);
        return;
    }
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
        error(res, 400, 'Please provide lat1, lon1, lat2 and lon2', `${version}/geo`);
        return;
    }

    try {
        const result = geo(lat1 as string, lon1 as string, lat2 as string, lon2 as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/geo`);
    }
});

// GET planning error
router.get('/:version/hyperplanning', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

// GET hash error
router.get('/:version/hash', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

// Display API informations
router.get('/:version/infos', (req: Request, res: Response) => {
    const endpoints = Object.values(versions[req.version]!.endpoints).flat();

    const paths = endpoints.flatMap((e) => (e.children ? Object.values(e.children) : e.path ? [e.path] : []));

    res.jsonResponse({
        endpoints: new Set(paths).size,
        last_version: Object.keys(versions).pop(),
        documentation: DOCS_URL,
        github: 'https://github.com/20syldev/api',
        creation: 'November 25th 2024',
    });
});

// Calculate Levenshtein distance
router.get('/:version/levenshtein', (req: Request, res: Response) => {
    const { str1, str2 } = req.query;

    if (!str1 || typeof str1 !== 'string') {
        error(res, 400, 'Please provide a first string (?str1={string})', `${req.version}/levenshtein`);
        return;
    }
    if (!str2 || typeof str2 !== 'string') {
        error(res, 400, 'Please provide a second string (&str2={string})', `${req.version}/levenshtein`);
        return;
    }

    try {
        const result = req.module.levenshtein(str1, str2);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/levenshtein`);
    }
});

// Generate a color palette from a base color
router.get('/:version/palette', (req: Request, res: Response) => {
    const { color, type } = req.query;
    const { version } = req.params;

    const palette = (req.module as { palette?: (c: string, t: string) => unknown }).palette;
    if (!palette) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/palette`);
        return;
    }
    if (!color) {
        error(res, 400, 'Please provide a base color (?color=#ff6600)', `${version}/palette`);
        return;
    }
    if (!type) {
        error(res, 400, 'Please provide a palette type (&type=complementary)', `${version}/palette`);
        return;
    }

    try {
        const result = palette(color as string, type as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/palette`);
    }
});

// Generate personal data
router.get('/:version/personal', (req: Request, res: Response) => {
    try {
        const result = req.module.personal();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/personal`);
    }
});

// Generate a placeholder image or skeleton
router.get('/:version/placeholder', (req: Request, res: Response) => {
    const { type = 'image' } = req.query;
    const { version } = req.params;

    const placeholder = (
        req.module as {
            placeholder?: (
                t: string,
                q: Record<string, string | undefined>,
            ) => { type: string; contentType: string; body: Buffer | string };
        }
    ).placeholder;
    if (!placeholder) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/placeholder`);
        return;
    }

    try {
        const result = placeholder(type as string, req.query as Record<string, string | undefined>);
        res.type(result.contentType).send(result.body);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/placeholder`);
    }
});

// Generate QR Code
router.get('/:version/qrcode', async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url) {
        error(res, 400, 'Please provide a valid url (?url={URL})', `${req.version}/qrcode`);
        return;
    }

    try {
        if (since(req.version, 4)) {
            const qrcodeFn = req.module.qrcode as (o: QRCodeOptions) => Promise<QRCodeResult>;
            const result = await qrcodeFn({
                url: url as string,
                size: req.query.size ? Number(req.query.size) : undefined,
                margin: req.query.margin ? Number(req.query.margin) : undefined,
                correction: req.query.correction as QRCodeOptions['correction'],
                dark: req.query.dark as string | undefined,
                light: req.query.light as string | undefined,
                icon: req.query.icon as string | undefined,
                iconSize: req.query.iconSize ? Number(req.query.iconSize) : undefined,
                iconPadding: req.query.iconPadding ? Number(req.query.iconPadding) : undefined,
                iconRadius: req.query.iconRadius ? Number(req.query.iconRadius) : undefined,
                format: req.query.format as QRCodeOptions['format'],
            });
            if (result.contentType === 'application/json') {
                res.jsonResponse(result.body);
            } else {
                res.type(result.contentType).send(result.body);
            }
        } else {
            const result = await (req.module.qrcode as (u: string) => Promise<string>)(url as string);
            res.jsonResponse(result);
        }
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/qrcode`);
    }
});

// Statistics on a list of numbers
router.get('/:version/statistics', (req: Request, res: Response) => {
    const { values } = req.query;
    const { version } = req.params;

    const statistics = (req.module as { statistics?: (v: string) => unknown }).statistics;
    if (!statistics) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/statistics`);
        return;
    }
    if (!values) {
        error(res, 400, 'Please provide a list of values (?values=1,2,3)', `${version}/statistics`);
        return;
    }

    try {
        const result = statistics(values as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/statistics`);
    }
});

// Text utilities (slug, stats, lorem, number)
router.get('/:version/text', (req: Request, res: Response) => {
    const { method, value, type, count, lang, text } = req.query;
    const { version } = req.params;

    const textMod = (req.module as { text?: Record<string, (...args: string[]) => unknown> }).text;
    if (!textMod) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/text`);
        return;
    }
    if (!method || !Object.hasOwn(textMod, method as string)) {
        error(res, 400, 'Please provide a valid method (?method={slug|stats|lorem|number})', `${version}/text`);
        return;
    }

    try {
        let result: unknown;
        switch (method) {
            case 'slug':
            case 'stats':
                result = textMod[method as string]!((value ?? text) as string);
                break;
            case 'lorem':
                result = textMod.lorem!((type as string) || 'words', (count as string) || '5');
                break;
            case 'number':
                result = textMod.number!(value as string, (lang as string) || 'en');
                break;
            default:
                throw new Error('Unknown method');
        }
        res.jsonResponse({ method, result });
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/text`);
    }
});

// Validate data (luhn, iban, email)
router.get('/:version/validate', (req: Request, res: Response) => {
    const { type, value } = req.query;
    const { version } = req.params;

    const validate = (req.module as { validate?: Record<string, (v: string) => unknown> }).validate;
    if (!validate) {
        error(res, 404, `Endpoint not available in ${version}.`, `${version}/validate`);
        return;
    }
    if (!type || !Object.hasOwn(validate, type as string)) {
        error(res, 400, 'Please provide a valid type (?type={luhn|iban|email})', `${version}/validate`);
        return;
    }
    if (!value) {
        error(res, 400, 'Please provide a value (&value={value})', `${version}/validate`);
        return;
    }

    try {
        const result = validate[type as string]!(value as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/validate`);
    }
});

// GET tic-tac-toe errors
router.get('/:version/tic-tac-toe', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

router.get('/:version/tic-tac-toe/fetch', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

router.get('/:version/tic-tac-toe/list', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

// Display or generate time informations
router.get('/:version/time', (req: Request, res: Response) => {
    const { type = 'live', start, end, format, timezone } = req.query;

    const validFormats = [
        'iso',
        'utc',
        'timestamp',
        'locale',
        'date',
        'time',
        'year',
        'month',
        'day',
        'hour',
        'minute',
        'second',
        'ms',
        'dayOfWeek',
        'dayOfYear',
        'weekNumber',
        'timezone',
        'timezoneOffset',
    ];
    const validTimezones = ['UTC', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];

    if (type !== 'live' && type !== 'random') {
        error(res, 400, 'Please provide a valid type (?type={type})', `${req.version}/time`);
        return;
    }
    if (start && !Date.parse(start as string)) {
        error(res, 400, 'Please provide a valid start date (?start={YYYY-MM-DD})', `${req.version}/time`);
        return;
    }
    if (end && !Date.parse(end as string)) {
        error(res, 400, 'Please provide a valid end date (?end={YYYY-MM-DD})', `${req.version}/time`);
        return;
    }
    if (format && !validFormats.includes(format as string)) {
        error(res, 400, 'Please provide a valid format (?format={format})', `${req.version}/time`);
        return;
    }
    if (timezone && !validTimezones.includes(timezone as string)) {
        error(res, 400, 'Please provide a valid timezone (?timezone={timezone})', `${req.version}/time`);
        return;
    }

    try {
        const time = req.module.time(
            type as string,
            start as string,
            end as string,
            format as string,
            timezone as string,
        );
        res.jsonResponse(time);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/time`);
    }
});

// GET token error
router.get('/:version/token', (_req: Request, res: Response) => {
    error(res, 405, 'This endpoint only supports POST requests.');
});

// Generate username
router.get('/:version/username', (req: Request, res: Response) => {
    try {
        const result = req.module.username();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/username`);
    }
});

// Display informations for owner's website
router.get('/:version/website', async (req: Request, res: Response) => {
    const currentTime = Date.now();

    if (currentTime - lastFetch >= GITHUB_CACHE_TTL) {
        try {
            const username = '20syldev';
            const token = env.GITHUB_TOKEN;
            const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

            const query = `
            {
              user(login: "${username}") {
                contributionsCollection(from: "${lastYear}T00:00:00Z") {
                  contributionCalendar {
                    totalContributions
                    weeks {
                      firstDay
                      contributionDays {
                        date
                        contributionCount
                      }
                    }
                  }
                }
              }
            }`;

            const apiResponse = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            if (!apiResponse.ok) throw new Error('Error fetching data.');

            const data = (await apiResponse.json()) as {
                data?: {
                    user?: {
                        contributionsCollection?: {
                            contributionCalendar?: {
                                weeks?: {
                                    firstDay: string;
                                    contributionDays: { date: string; contributionCount: number }[];
                                }[];
                            };
                        };
                    };
                };
            };
            const user = data?.data?.user;

            const weeks = user?.contributionsCollection?.contributionCalendar?.weeks || [];
            activity = weeks.map((w) => ({
                week: w.firstDay,
                total: w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0),
                days: w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
            }));

            lastFetch = currentTime;
        } catch {
            activity = [];
        }
    }

    const response: Record<string, unknown> = {
        versions: {
            2048: env.G_2048,
            api: env.API,
            cdn: env.CDN,
            coop_api: env.COOP_API,
            coop_status: env.COOP_STATUS,
            chat: env.CHAT,
            digit: env.DIGIT,
            doc_coopbot: env.DOC_COOPBOT,
            docs: env.DOCS,
            donut: env.DONUT,
            drawio_plugin: env.DRAWIO_PLUGIN,
            flowers: env.FLOWERS,
            gemsync: env.GEMSYNC,
            gft: env.GFT,
            gitsite: env.GITSITE,
            lebonchar: env.LEBONCHAR,
            logger: env.LOGGER,
            logs: env.LOGS,
            logvault: env.LOGVAULT,
            lyah: env.LYAH,
            minify: env.MINIFY,
            mn: env.MN,
            monitoring: env.MONITORING,
            morpion: env.MORPION,
            nitrogen: env.NITROGEN,
            old_database: env.OLD_DATABASE,
            password: env.PASSWORD,
            php: env.PHP,
            planning: env.PLANNING,
            ping: env.PING,
            portfolio: env.PORTFOLIO,
            python_api: env.PYTHON_API,
            readme: env.README,
            timestamp: env.TIMESTAMP,
            terminal: env.TERMINAL,
            valentine: env.VALENTINE,
            wrkit: env.WRKIT,
            zpki: env.ZPKI,
        },
        patched_projects: env.PATCH,
        updated_projects: env.RECENT,
        new_projects: env.NEW,
        sub_domains: env.DOMAINS,
        stats: {
            1: env.STATS1,
            2: env.STATS2,
            3: env.STATS3,
            4: env.STATS4,
            5: Object.keys(ipLimits).length,
            activity,
        },
        tag: env.TAG,
        active: env.ACTIVE,
    };

    const key = req.query.key as string | undefined;
    if (key) {
        if (['__proto__', 'constructor', 'prototype'].some((p) => key.includes(p))) {
            error(res, 400, 'Invalid key.');
            return;
        }

        const keys = key.split('.');
        let result: unknown = response;

        for (const k of keys) {
            if (result == null || typeof result !== 'object' || !(k in result)) {
                error(res, 404, `Key '${key}' not found.`);
                return;
            }
            result = (result as Record<string, unknown>)[k];
        }

        res.jsonResponse({ [key]: result });
        return;
    }

    res.jsonResponse(response);
});

export default router;
