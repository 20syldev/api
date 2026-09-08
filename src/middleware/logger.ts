import { createLogger } from '@20syldev/logger.ts';
import type { NextFunction, Request, Response } from 'express';

import { MAX_LOG_ENTRIES } from '../constants.js';

export const logger = createLogger({
    maxEntries: MAX_LOG_ENTRIES,
    console: true,
    theme: 'colored',
});

const SECRET_PATH = /^(\/v\d+\/(?:chat|tic-tac-toe))\/[^/]+/;

/**
 * Replaces a secret carried in the path with a placeholder.
 *
 * @param path - Request path, without its query string
 * @returns The path, with a trailing credential segment masked
 */
export function redactPath(path: string): string {
    return path.replace(SECRET_PATH, '$1/[redacted]');
}

/**
 * Strips query string values from a URL, keeping the path and parameter names.
 *
 * GET endpoints carry user input in the query string — text passed to /encode,
 * card numbers and IBANs passed to /validate, URLs passed to /qrcode — and the
 * log buffer is readable over /logs. Names alone keep the trace useful for
 * debugging without retaining anybody's payload.
 *
 * Names are kept percent-encoded on purpose. Decoding them would let a caller
 * write raw newlines and ANSI escapes into the operator's terminal and into the
 * /logs buffer, and would expose the theme's {placeholder} syntax.
 *
 * @param originalUrl - Request URL, with or without a query string
 * @returns The path, followed by the parameter names when the URL had any
 */
export function redactQuery(originalUrl: string): string {
    const [path = '', ...rest] = originalUrl.split('?');
    const query = rest.join('?');
    if (!query) return redactPath(path);

    const names = [...new Set(query.split('&').map((pair) => pair.split('=')[0] ?? ''))].filter(Boolean);
    return names.length ? `${redactPath(path)}?${names.join('&')}` : redactPath(path);
}

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'HEAD') {
        next();
        return;
    }
    if (req.originalUrl === '/logs') {
        next();
        return;
    }

    const startTime = Date.now();
    const platform = (req.headers['sec-ch-ua-platform'] as string)?.replace(/"/g, '');

    res.on('finish', () => {
        const status = res.statusCode === 304 ? 200 : res.statusCode;
        const duration = `${Date.now() - startTime}ms`;

        const entry = { method: req.method, url: redactQuery(req.originalUrl), status, duration, platform };

        if (status >= 500) logger.error(entry);
        else if (status >= 400) logger.warn(entry);
        else logger.info(entry);
    });
    next();
}
