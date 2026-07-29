import { type Request, type Response, Router } from 'express';

import { versions } from '../config/versions.js';
import { DOCS_URL } from '../constants.js';
import type { AddressResult } from '../modules/v4/address.js';
import type { UserAgentResult } from '../modules/v4/agent.js';
import type { AvatarOptions, AvatarResult } from '../modules/v4/avatar.js';
import type { BarcodeOptions, BarcodeResult } from '../modules/v4/barcode.js';
import type { CaptchaOptions, CaptchaResult } from '../modules/v4/captcha.js';
import type { ColorResult } from '../modules/v4/color.js';
import type { CreditResult } from '../modules/v4/credit.js';
import type { IpResult } from '../modules/v4/ip.js';
import type { PasswordResult } from '../modules/v4/password.js';
import type { QRCodeOptions, QRCodeResult } from '../modules/v4/qrcode.js';
import { chatStorage } from '../storage/index.js';
import { since } from '../utils/helpers.js';
import { error } from '../utils/response.js';

const router = Router();

const postOnly = (name: string) => (req: Request, res: Response) => {
    const available = versions[req.version]?.endpoints.post.some((e) => e.name === name);
    if (!available) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/${name}`);
        return;
    }
    error(res, 405, 'This endpoint only supports POST requests.');
};

// Display version information
router.get('/:version', (req: Request, res: Response) => {
    const version = req.params.version as string;
    const versionConfig = versions[version]!;

    const endpoints = Object.keys(versionConfig.endpoints).reduce<Record<string, unknown>>((acc, method) => {
        const endpointList = versionConfig.endpoints[method as keyof typeof versionConfig.endpoints];
        if (!endpointList) return acc;
        acc[method] = endpointList
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

// Generate a fictional postal address
router.get('/:version/address', (req: Request, res: Response) => {
    const { country, count } = req.query;
    const { version } = req.params;

    const addressFn = (req.module as { address?: (c?: string, n?: number) => AddressResult }).address;
    if (!addressFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/address`);
        return;
    }

    const parsedCount = count !== undefined ? parseInt(count as string, 10) : 1;
    if (isNaN(parsedCount)) {
        error(res, 400, 'Please provide a valid count (&count={n})', `${version}/address`);
        return;
    }

    try {
        const result = addressFn(country as string | undefined, parsedCount);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/address`);
    }
});

// Parse a User-Agent string
router.get('/:version/agent', (req: Request, res: Response) => {
    const ua = (req.query.ua as string | undefined) ?? (req.headers['user-agent'] as string) ?? '';
    const agentFn = (req.module as { agent?: (ua: string) => UserAgentResult }).agent;
    if (!agentFn) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/agent`);
        return;
    }
    try {
        const result = agentFn(ua);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/agent`);
    }
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

// GET asymmetric error
router.get('/:version/asymmetric', postOnly('asymmetric'));

// Convert text to a different case format
router.get('/:version/case', (req: Request, res: Response) => {
    const { text, to } = req.query;
    const { version } = req.params;

    const caseConvertFn = (req.module as { caseConvert?: (t: string, to?: string) => unknown }).caseConvert;
    if (!caseConvertFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/case`);
        return;
    }
    if (!text || typeof text !== 'string') {
        error(res, 400, 'Please provide a text (?text={text})', `${version}/case`);
        return;
    }

    try {
        const result = caseConvertFn(text, to as string | undefined);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/case`);
    }
});

// Generate an identicon or pixel-art avatar from a seed
router.get('/:version/avatar', (req: Request, res: Response) => {
    const avatarFn = (req.module as { avatar?: (opts: AvatarOptions) => AvatarResult }).avatar;
    if (!avatarFn) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/avatar`);
        return;
    }
    const { seed, size, type, bg, format } = req.query;
    const parsedSize = size !== undefined ? parseInt(size as string, 10) : undefined;
    if (parsedSize !== undefined && isNaN(parsedSize)) {
        error(res, 400, 'Please provide a valid size (&size={50-2000})', `${req.version}/avatar`);
        return;
    }
    try {
        const { contentType, body } = avatarFn({
            seed: seed as string | undefined,
            size: parsedSize,
            type: type as string | undefined,
            bg: bg as string | undefined,
            format: format as string | undefined,
        });
        res.type(contentType).send(body);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/avatar`);
    }
});

// Generate a barcode image
router.get('/:version/barcode', (req: Request, res: Response) => {
    const barcodeFn = (req.module as { barcode?: (opts: BarcodeOptions) => BarcodeResult }).barcode;
    if (!barcodeFn) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/barcode`);
        return;
    }
    const { data, type, width, height, format, color, bg } = req.query;
    if (!data) {
        error(res, 400, 'Please provide data to encode (?data={string})', `${req.version}/barcode`);
        return;
    }
    const parsedWidth = width !== undefined ? parseInt(width as string, 10) : undefined;
    const parsedHeight = height !== undefined ? parseInt(height as string, 10) : undefined;
    if ((parsedWidth !== undefined && isNaN(parsedWidth)) || (parsedHeight !== undefined && isNaN(parsedHeight))) {
        error(res, 400, 'Please provide valid dimensions (&width={px}&height={px})', `${req.version}/barcode`);
        return;
    }
    try {
        const { contentType, body } = barcodeFn({
            data: data as string,
            type: type as string | undefined,
            width: parsedWidth,
            height: parsedHeight,
            format: format as string | undefined,
            color: color as string | undefined,
            bg: bg as string | undefined,
        });
        res.type(contentType).send(body);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/barcode`);
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

// GET chart error
router.get('/:version/chart', postOnly('chart'));

// Display stored data
router.get('/:version/chat', (req: Request, res: Response) => {
    try {
        const messages = req.module.chat('fetch', {
            username: `reader:${req.ip ?? 'unknown'}`,
            storage: chatStorage,
        });
        res.jsonResponse(messages);
    } catch (err) {
        error(res, 400, (err as Error).message);
    }
});

// GET private chat error
router.get('/:version/chat/private', postOnly('chat'));

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

// Generate fictitious credit card numbers
router.get('/:version/credit', (req: Request, res: Response) => {
    const creditFn = (req.module as { credit?: (brand?: string, count?: number, format?: string) => CreditResult })
        .credit;
    if (!creditFn) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/credit`);
        return;
    }
    const { brand, count, format } = req.query;
    try {
        const result = creditFn(
            brand as string | undefined,
            count !== undefined ? parseInt(count as string, 10) : 1,
            format as string | undefined,
        );
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/credit`);
    }
});

// Parse a cron expression and compute next execution dates
router.get('/:version/cron', (req: Request, res: Response) => {
    const { expr, count, from, timezone } = req.query;
    const { version } = req.params;

    const cronFn = (req.module as { cron?: (e: string, n?: number, f?: string, tz?: string) => unknown }).cron;
    if (!cronFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/cron`);
        return;
    }
    if (!expr) {
        error(res, 400, 'Please provide a cron expression (?expr=* * * * *)', `${version}/cron`);
        return;
    }
    const parsedCount = count !== undefined ? parseInt(count as string, 10) : 5;
    if (isNaN(parsedCount)) {
        error(res, 400, 'Please provide a valid count (&count={n})', `${version}/cron`);
        return;
    }

    try {
        const result = cronFn(expr as string, parsedCount, from as string | undefined, (timezone as string) ?? 'UTC');
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/cron`);
    }
});

// RPG Dice roller
router.get('/:version/dice', (req: Request, res: Response) => {
    const { roll } = req.query;
    const { version } = req.params;

    const dice = (req.module as { dice?: (r: string) => unknown }).dice;
    if (!dice) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/dice`);
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

// Generate domain informations
router.get('/:version/domain', (req: Request, res: Response) => {
    try {
        const result = req.module.domain();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/domain`);
    }
});

// Encode / decode text
router.get('/:version/encode', (req: Request, res: Response) => {
    const { method, text, shift } = req.query;
    const { version } = req.params;

    const encode = (req.module as { encode?: Record<string, (v: string, v2?: string) => string> }).encode;
    if (!encode) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/encode`);
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

// Evaluate a math expression
router.get('/:version/evaluate', (req: Request, res: Response) => {
    const { expr, precision } = req.query;
    const { version } = req.params;

    const evaluateFn = (req.module as { evaluate?: (e: string, p?: number) => unknown }).evaluate;
    if (!evaluateFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/evaluate`);
        return;
    }
    if (!expr || typeof expr !== 'string') {
        error(res, 400, 'Please provide a math expression (?expr={expression})', `${version}/evaluate`);
        return;
    }

    try {
        const result = evaluateFn(expr, precision !== undefined ? parseInt(precision as string, 10) : undefined);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/evaluate`);
    }
});

// Geographic distance and bearing between two coordinates
router.get('/:version/geo', (req: Request, res: Response) => {
    const { lat1, lon1, lat2, lon2 } = req.query;
    const { version } = req.params;

    const geo = (req.module as { geo?: (a: string, b: string, c: string, d: string) => unknown }).geo;
    if (!geo) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/geo`);
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

// GET hash error
router.get('/:version/hash', postOnly('hash'));

// Echo request headers
router.get('/:version/headers', (req: Request, res: Response) => {
    const redacted = new Set(['authorization', 'cookie', 'set-cookie', 'proxy-authorization']);
    let headers: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(req.headers)) {
        headers[k] = redacted.has(k) ? '[redacted]' : v;
    }

    const filterParam = req.query.filter;
    const filter = Array.isArray(filterParam) ? filterParam.join(',') : (filterParam as string | undefined);
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

// GET planning error
router.get('/:version/hyperplanning', postOnly('hyperplanning'));

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

// Analyze an IP address
router.get('/:version/ip', (req: Request, res: Response) => {
    const address = (req.query.address as string | undefined) ?? req.ip ?? '';
    const ipFn = (req.module as { ip?: (a: string) => IpResult }).ip;
    if (!ipFn) {
        error(res, 404, `Endpoint not available in ${req.version}.`, `${req.latest}/ip`);
        return;
    }
    try {
        const result = ipFn(address);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/ip`);
    }
});

// GET jwt error
router.get('/:version/jwt', postOnly('jwt'));

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

// GET matrix error
router.get('/:version/matrix', postOnly('matrix'));

// GET otp error
router.get('/:version/otp', postOnly('otp'));

// Generate a color palette from a base color
router.get('/:version/palette', (req: Request, res: Response) => {
    const { color, type } = req.query;
    const { version } = req.params;

    const palette = (req.module as { palette?: (c: string, t: string) => unknown }).palette;
    if (!palette) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/palette`);
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

// Generate a password or passphrase
router.get('/:version/password', (req: Request, res: Response) => {
    const { type, length, uppercase, lowercase, digits, symbols, exclude, count, separator } = req.query;
    const { version } = req.params;

    const passwordFn = (
        req.module as { password?: (t: string, l: number, o: Record<string, unknown>) => PasswordResult }
    ).password;
    if (!passwordFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/password`);
        return;
    }

    const parseBool = (v: unknown, def: boolean): boolean => (v === undefined ? def : v !== 'false');

    try {
        const result = passwordFn(
            (type as string) ?? 'random',
            length !== undefined ? parseInt(length as string, 10) : 16,
            {
                uppercase: parseBool(uppercase, true),
                lowercase: parseBool(lowercase, true),
                digits: parseBool(digits, true),
                symbols: parseBool(symbols, false),
                exclude: (exclude as string) ?? '',
                count: count !== undefined ? parseInt(count as string, 10) : 1,
                separator: (separator as string) ?? '-',
            },
        );
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/password`);
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
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/placeholder`);
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

// Test a regex pattern against a text
router.get('/:version/regex', (req: Request, res: Response) => {
    const { pattern, text, flags } = req.query;
    const { version } = req.params;

    const regexFn = (req.module as { regex?: (p: string, t: string, f?: string) => unknown }).regex;
    if (!regexFn) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/regex`);
        return;
    }
    if (!pattern) {
        error(res, 400, 'Please provide a pattern (?pattern={regex})', `${version}/regex`);
        return;
    }
    if (!text) {
        error(res, 400, 'Please provide a text (&text={string})', `${version}/regex`);
        return;
    }

    try {
        const result = regexFn(pattern as string, text as string, flags as string | undefined);
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/regex`);
    }
});

// Statistics on a list of numbers
router.get('/:version/statistics', (req: Request, res: Response) => {
    const { values } = req.query;
    const { version } = req.params;

    const statistics = (req.module as { statistics?: (v: string) => unknown }).statistics;
    if (!statistics) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/statistics`);
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

// GET symmetric error
router.get('/:version/symmetric', postOnly('symmetric'));

// Text utilities (slug, stats, lorem, number)
router.get('/:version/text', (req: Request, res: Response) => {
    const { method, value, type, count, lang, text } = req.query;
    const { version } = req.params;

    const textMod = (req.module as { text?: Record<string, (...args: string[]) => unknown> }).text;
    if (!textMod) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/text`);
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

// GET tic-tac-toe errors
router.get('/:version/tic-tac-toe', postOnly('tic_tac_toe'));

router.get('/:version/tic-tac-toe/fetch', postOnly('tic_tac_toe'));

router.get('/:version/tic-tac-toe/list', postOnly('tic_tac_toe'));

// Display or generate time informations, or compute a countdown
router.get('/:version/time', (req: Request, res: Response) => {
    const { type = 'live', start, end, format, timezone, target } = req.query;

    try {
        const timeFn = req.module.time as (
            t: string,
            s?: string,
            e?: string,
            f?: string,
            tz?: string,
            target?: string,
        ) => Record<string, unknown>;
        const time = timeFn(
            type as string,
            start as string,
            end as string,
            format as string,
            timezone as string,
            target as string,
        );
        res.jsonResponse(time);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/time`);
    }
});

// GET token error
router.get('/:version/token', postOnly('token'));

// Generate username
router.get('/:version/username', (req: Request, res: Response) => {
    try {
        const result = req.module.username();
        res.jsonResponse(result);
    } catch (err) {
        error(res, 400, (err as Error).message, `${req.version}/username`);
    }
});

// Validate data (luhn, iban, email)
router.get('/:version/validate', (req: Request, res: Response) => {
    const { type, value } = req.query;
    const { version } = req.params;

    const validate = (req.module as { validate?: Record<string, (v: string) => unknown> }).validate;
    if (!validate) {
        error(res, 404, `Endpoint not available in ${version}.`, `${req.latest}/validate`);
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

export default router;
