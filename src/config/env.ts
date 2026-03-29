import dotenv from 'dotenv';
import { DEFAULT_PORT } from '../constants.js';

dotenv.config();

function envList(key: string): string[] | null {
    const v = process.env[key];
    return v && v !== 'undefined' ? v.split(' ') : null;
}

function envNumber(key: string, fallback: number): number {
    const v = parseInt(process.env[key] ?? '', 10);
    return isNaN(v) ? fallback : v;
}

export const env = {
    PORT: envNumber('PORT', DEFAULT_PORT),
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? '',

    DEFAULT_LIMIT: envNumber('DEFAULT_LIMIT', 2000),
    PRO_LIMIT: envNumber('PRO_LIMIT', 6000),
    ADVANCED_LIMIT: envNumber('ADVANCED_LIMIT', 4000),
    BUSINESS_LIMIT: envNumber('BUSINESS_LIMIT', 10000),
    GLOBAL_LIMIT: envNumber('GLOBAL_LIMIT', 50000),

    BUSINESS_TOKEN_LIST: envList('BUSINESS_TOKEN_LIST') ?? [],
    PRO_TOKEN_LIST: envList('PRO_TOKEN_LIST') ?? [],
    ADVANCED_TOKEN_LIST: envList('ADVANCED_TOKEN_LIST') ?? [],

    // Website endpoint env vars
    G_2048: process.env.G_2048,
    API: process.env.API,
    CDN: process.env.CDN,
    COOP_API: process.env.COOP_API,
    COOP_STATUS: process.env.COOP_STATUS,
    CHAT: process.env.CHAT,
    DIGIT: process.env.DIGIT,
    DOC_COOPBOT: process.env.DOC_COOPBOT,
    DOCS: process.env.DOCS,
    DONUT: process.env.DONUT,
    DRAWIO_PLUGIN: process.env.DRAWIO_PLUGIN,
    FLOWERS: process.env.FLOWERS,
    GEMSYNC: process.env.GEMSYNC,
    GFT: process.env.GFT,
    GITSITE: process.env.GITSITE,
    LEBONCHAR: process.env.LEBONCHAR,
    LOGGER: process.env.LOGGER,
    LOGS: process.env.LOGS,
    LOGVAULT: process.env.LOGVAULT,
    LYAH: process.env.LYAH,
    MINIFY: process.env.MINIFY,
    MN: process.env.MN,
    MONITORING: process.env.MONITORING,
    MORPION: process.env.MORPION,
    NITROGEN: process.env.NITROGEN,
    OLD_DATABASE: process.env.OLD_DATABASE,
    PASSWORD: process.env.PASSWORD,
    PHP: process.env.PHP,
    PLANNING: process.env.PLANNING,
    PING: process.env.PING,
    PORTFOLIO: process.env.PORTFOLIO,
    PYTHON_API: process.env.PYTHON_API,
    README: process.env.README,
    TIMESTAMP: process.env.TIMESTAMP,
    TERMINAL: process.env.TERMINAL,
    VALENTINE: process.env.VALENTINE,
    WRKIT: process.env.WRKIT,
    ZPKI: process.env.ZPKI,

    PATCH: envList('PATCH'),
    RECENT: envList('RECENT'),
    NEW: envList('NEW'),
    DOMAINS: envList('DOMAINS'),

    STATS1: process.env.STATS1,
    STATS2: process.env.STATS2,
    STATS3: process.env.STATS3,
    STATS4: process.env.STATS4,
    TAG: process.env.TAG,
    ACTIVE: process.env.ACTIVE === 'true',
};
