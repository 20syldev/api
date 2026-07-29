import { type Request, type Response, Router } from 'express';

import { getPlan } from '../config/plans.js';
import { versions } from '../config/versions.js';
import { APP_VERSION, DOCS_URL, START_TIME } from '../constants.js';
import { logger } from '../middleware/logger.js';
import { ipLimits } from '../storage/index.js';
import { error } from '../utils/response.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const links = Object.keys(versions).reduce<Record<string, string>>((link, version) => {
        link[version] = `${base}/${version}`;
        return link;
    }, {});

    res.jsonResponse({
        documentation: DOCS_URL,
        latest: `${base}/latest`,
        health: `${base}/health`,
        logs: `${base}/logs`,
        auth: `${base}/auth`,
        versions: links,
    });
});

router.get('/health', (_req: Request, res: Response) => {
    const mem = process.memoryUsage();

    res.jsonResponse({
        status: 'ok',
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        version: APP_VERSION,
        node: process.version,
        memory: {
            rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
            heap_used: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            heap_total: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
        },
        connections: Object.keys(ipLimits).length,
        logs: logger.entries().length,
    });
});

router.get('/logs', (_req: Request, res: Response) => {
    res.jsonResponse(logger.entries());
});

// Report the caller's token tier and limits.
router.get('/auth', (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const match = getPlan(token);

    if (!match) {
        error(res, 401, 'Invalid token.');
        return;
    }

    res.jsonResponse({
        authenticated: match.name !== 'default',
        tier: match.name,
        limits: {
            hourly: match.plan.hourly,
            burst: match.plan.burst,
        },
    });
});

router.all('/latest', (req: Request, res: Response) => {
    const latest = Object.keys(versions).pop()!;
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex === -1 ? '' : req.originalUrl.slice(queryIndex);
    res.redirect(307, `/${latest}${query}`);
});

router.all('/latest/{*rest}', (req: Request, res: Response) => {
    const latest = Object.keys(versions).pop()!;
    const rest = (req.params as Record<string, string | string[]>).rest;
    const path = Array.isArray(rest) ? rest.join('/') : rest;
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex === -1 ? '' : req.originalUrl.slice(queryIndex);
    res.redirect(307, `/${latest}/${path}${query}`);
});

export default router;
