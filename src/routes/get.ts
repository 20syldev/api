import { Router, type Request, type Response } from 'express';
import { versions } from '../config/versions.js';
import { env } from '../config/env.js';
import { ipLimits } from '../storage/index.js';
import { chatStorage } from '../storage/index.js';
import { DOCS_URL, GITHUB_CACHE_TTL } from '../constants.js';
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
    if (!algorithms || !algorithms[method as string]) {
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
    const text = req.query.text as string;

    if (!text) {
        error(res, 400, 'Please provide a valid argument (?text={text})', `${req.version}/captcha`);
        return;
    }

    try {
        const result = req.module.captcha(text);
        res.type('png').send(result);
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
        const result = req.module.color();
        res.jsonResponse(result);
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
        const result = req.module.convert(value as string, from as string, to as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/convert`);
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

// Generate personal data
router.get('/:version/personal', (req: Request, res: Response) => {
    try {
        const result = req.module.personal();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/personal`);
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
        const result = await req.module.qrcode(url as string);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/qrcode`);
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
