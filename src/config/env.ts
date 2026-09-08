import dotenv from 'dotenv';

import { DEFAULT_PORT } from '../constants.js';

dotenv.config();

export function envList(key: string): string[] | null {
    const v = process.env[key];
    if (!v || v === 'undefined') return null;

    const items = v.split(/[\s,]+/).filter(Boolean);
    return items.length ? items : null;
}

function envNumber(key: string, fallback: number): number {
    const v = parseInt(process.env[key] ?? '', 10);
    return isNaN(v) ? fallback : v;
}

export const env = {
    PORT: envNumber('PORT', DEFAULT_PORT),
    TRUSTED_PROXIES: envList('TRUSTED_PROXIES'),

    DOCS_URL: (process.env.DOCS_URL ?? '').replace(/\/+$/, ''),
    REPO_URL: process.env.REPO_URL ?? '',
    INSTANCE_CREATED: process.env.INSTANCE_CREATED ?? '',

    LOGS_TOKEN: process.env.LOGS_TOKEN ?? '',
    CHALLENGE_SECRET: process.env.CHALLENGE_SECRET ?? '',

    DEFAULT_LIMIT: envNumber('DEFAULT_LIMIT', 2000),
    ADVANCED_LIMIT: envNumber('ADVANCED_LIMIT', 3500),
    PRO_LIMIT: envNumber('PRO_LIMIT', 6000),
    BUSINESS_LIMIT: envNumber('BUSINESS_LIMIT', 10000),
    GLOBAL_LIMIT: envNumber('GLOBAL_LIMIT', 50000),

    DEFAULT_BURST: envNumber('DEFAULT_BURST', 50),
    ADVANCED_BURST: envNumber('ADVANCED_BURST', 80),
    PRO_BURST: envNumber('PRO_BURST', 120),
    BUSINESS_BURST: envNumber('BUSINESS_BURST', 200),

    BUSINESS_TOKEN_LIST: envList('BUSINESS_TOKEN_LIST') ?? [],
    PRO_TOKEN_LIST: envList('PRO_TOKEN_LIST') ?? [],
    ADVANCED_TOKEN_LIST: envList('ADVANCED_TOKEN_LIST') ?? [],
};
