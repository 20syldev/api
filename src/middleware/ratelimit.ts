import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ipLimits } from '../storage/index.js';
import { SESSION_TTL } from '../constants.js';
import { error } from '../utils/response.js';

let requests = 0;
let resetTime = Date.now() + SESSION_TTL;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = (req.headers['cf-connecting-ip'] as string) || req.socket.remoteAddress || '';
    const token = req.headers.authorization?.split(' ')[1] || '';

    const now = Date.now();
    const minute = String(Math.floor(now / 60000) % 60);
    const hour = String(Math.floor(now / 3600000) % 24);

    if (
        (token && ![...env.BUSINESS_TOKEN_LIST, ...env.PRO_TOKEN_LIST, ...env.ADVANCED_TOKEN_LIST].includes(token)) ||
        token === 'undefined'
    ) {
        error(res, 401, 'Invalid token.');
        return;
    }

    let requestLimit: number;
    if (env.BUSINESS_TOKEN_LIST.includes(token) && !env.BUSINESS_TOKEN_LIST.includes('undefined')) {
        requestLimit = env.BUSINESS_LIMIT;
    } else if (env.PRO_TOKEN_LIST.includes(token) && !env.PRO_TOKEN_LIST.includes('undefined')) {
        requestLimit = env.PRO_LIMIT;
    } else if (env.ADVANCED_TOKEN_LIST.includes(token) && !env.ADVANCED_TOKEN_LIST.includes('undefined')) {
        requestLimit = env.ADVANCED_LIMIT;
    } else {
        requestLimit = env.DEFAULT_LIMIT;
    }

    if (now > resetTime) {
        requests = 0;
        resetTime = now + SESSION_TTL;
    }

    if (++requests > Math.max(env.GLOBAL_LIMIT, requestLimit)) {
        error(res, 429, 'Global rate limit exceeded.');
        return;
    }

    if (['__proto__', 'constructor', 'prototype'].includes(ip)) {
        error(res, 400, 'Invalid IP address.');
        return;
    }

    if (!ipLimits[ip]) ipLimits[ip] = {};
    if (!ipLimits[ip]![hour]) ipLimits[ip]![hour] = {};
    ipLimits[ip]![hour]![minute] = (ipLimits[ip]![hour]![minute] ?? 0) + 1;

    if (ipLimits[ip]![hour]![minute]! > requestLimit) {
        error(res, 429, `You have exceeded the limit of ${requestLimit} requests per hour.`);
        return;
    }

    Object.keys(ipLimits[ip]!).forEach((h) => {
        if (h != hour) delete ipLimits[ip]![h];
    });

    next();
}
