import { Router, type Request, type Response } from 'express';
import { versions } from '../config/versions.js';
import { ipLimits } from '../storage/index.js';
import { logger } from '../middleware/logger.js';
import { DOCS_URL, START_TIME } from '../constants.js';

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
        versions: links,
    });
});

router.get('/health', (_req: Request, res: Response) => {
    const mem = process.memoryUsage();

    res.jsonResponse({
        status: 'ok',
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        version: '4.0.0',
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

router.get('/latest', (_req: Request, res: Response) => {
    const latest = Object.keys(versions).pop()!;
    res.redirect(`/${latest}`);
});

router.get('/latest/{*rest}', (req: Request, res: Response) => {
    const latest = Object.keys(versions).pop()!;
    const rest = (req.params as Record<string, string>).rest;
    res.redirect(`/${latest}/${rest}`);
});

export default router;
