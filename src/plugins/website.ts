import { type Request, type Response, Router } from 'express';

import { ipLimits } from '../storage/index.js';
import { error } from '../utils/response.js';

const router = Router();

// GitHub contribution graph cache
const GITHUB_CACHE_TTL = 600_000;
let activity: Record<string, unknown>[] = [];
let lastFetch = 0;

/**
 * Website metadata for the owner's portfolio, served by the /website endpoint.
 * This is deployment-specific public data (project versions, stats, sub-domains),
 * kept out of the shared API config and sourced from a single WEBSITE env var.
 */
interface WebsiteData {
    versions?: Record<string, string>;
    patched?: string[];
    updated?: string[];
    new?: string[];
    domains?: string[];
    stats?: string[];
    tag?: string;
    active?: boolean;
}

let cachedData: WebsiteData | null = null;

// Parse the WEBSITE env blob once; a malformed value falls back to empty data
// so the endpoint degrades gracefully instead of throwing.
function getData(): WebsiteData {
    if (cachedData) return cachedData;
    try {
        cachedData = process.env.WEBSITE ? (JSON.parse(process.env.WEBSITE) as WebsiteData) : {};
    } catch {
        cachedData = {};
    }
    return cachedData;
}

// Refresh the GitHub contribution calendar, respecting the cache window.
async function refreshActivity(): Promise<void> {
    const now = Date.now();
    if (now - lastFetch < GITHUB_CACHE_TTL) return;

    try {
        const username = '20syldev';
        const token = process.env.GITHUB_TOKEN ?? '';
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

        lastFetch = now;
    } catch {
        activity = [];
    }
}

// Display informations for owner's website
router.get('/:version/website', async (req: Request, res: Response) => {
    await refreshActivity();

    const data = getData();
    const response: Record<string, unknown> = {
        versions: data.versions ?? {},
        patched_projects: data.patched ?? null,
        updated_projects: data.updated ?? null,
        new_projects: data.new ?? null,
        sub_domains: data.domains ?? null,
        stats: {
            1: data.stats?.[0],
            2: data.stats?.[1],
            3: data.stats?.[2],
            4: data.stats?.[3],
            5: Object.keys(ipLimits).length,
            activity,
        },
        tag: data.tag,
        active: data.active ?? false,
    };

    const keyParam = req.query.key;
    if (Array.isArray(keyParam)) {
        error(res, 400, 'Invalid key.');
        return;
    }
    const key = keyParam as string | undefined;
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
