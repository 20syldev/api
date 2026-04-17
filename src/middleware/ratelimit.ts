import type { Request, Response, NextFunction } from 'express';
import { ipLimits } from '../storage/index.js';
import { RATE_LIMIT_WINDOW, SESSION_TTL } from '../constants.js';
import { error } from '../utils/response.js';
import { getPlan, globalLimit } from '../config/plans.js';

let requests = 0;
let resetTime = Date.now() + SESSION_TTL;

const burstTracker: Record<string, number[]> = {};

// Cleanup stale IPs every hour
setInterval(() => {
    const currentHour = String(Math.floor(Date.now() / 3600000) % 24);
    for (const ip of Object.keys(ipLimits)) {
        const hours = Object.keys(ipLimits[ip]!);
        if (hours.length === 0 || (hours.length === 1 && hours[0] !== currentHour)) {
            delete ipLimits[ip];
        }
    }

    const now = Date.now();
    for (const ip of Object.keys(burstTracker)) {
        burstTracker[ip] = burstTracker[ip]!.filter((t) => now - t < RATE_LIMIT_WINDOW);
        if (burstTracker[ip]!.length === 0) delete burstTracker[ip];
    }
}, SESSION_TTL);

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip || req.socket.remoteAddress || '';
    const token = req.headers.authorization?.split(' ')[1] || '';

    const now = Date.now();
    const minute = String(Math.floor(now / 60000) % 60);
    const hour = String(Math.floor(now / 3600000) % 24);

    const match = getPlan(token);
    if (!match) {
        error(res, 401, 'Invalid token.');
        return;
    }

    const { plan } = match;

    if (now > resetTime) {
        requests = 0;
        resetTime = now + SESSION_TTL;
    }

    if (++requests > Math.max(globalLimit, plan.hourly)) {
        error(res, 429, 'Global rate limit exceeded.');
        return;
    }

    if (['__proto__', 'constructor', 'prototype'].includes(ip)) {
        error(res, 400, 'Invalid IP address.');
        return;
    }

    // Burst protection per tier
    if (process.env.NODE_ENV !== 'test') {
        if (!burstTracker[ip]) burstTracker[ip] = [];
        burstTracker[ip] = burstTracker[ip]!.filter((t) => now - t < RATE_LIMIT_WINDOW);
        burstTracker[ip]!.push(now);

        if (burstTracker[ip]!.length > plan.burst) {
            error(res, 429, 'Too many requests, please slow down.');
            return;
        }
    }

    // Hourly rate limit per IP
    if (!ipLimits[ip]) ipLimits[ip] = {};
    if (!ipLimits[ip]![hour]) ipLimits[ip]![hour] = {};
    ipLimits[ip]![hour]![minute] = (ipLimits[ip]![hour]![minute] ?? 0) + 1;

    const hourTotal = Object.values(ipLimits[ip]![hour]!).reduce((sum, count) => sum + count, 0);
    if (hourTotal > plan.hourly) {
        error(res, 429, `You have exceeded the limit of ${plan.hourly} requests per hour.`);
        return;
    }

    Object.keys(ipLimits[ip]!).forEach((h) => {
        if (h != hour) delete ipLimits[ip]![h];
    });

    next();
}
