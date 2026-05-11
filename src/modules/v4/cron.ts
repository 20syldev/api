import { MAX_CRON_ITERATIONS, MAX_CRON_RESULTS } from '../../constants.js';
import { VALID_TIMEZONES } from './time.js';

type Timezone = (typeof VALID_TIMEZONES)[number];

const FIELD_RANGES = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 7 }, // day of week (0 and 7 = Sunday)
] as const;

const DOW_NAMES: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

const DOW_DISPLAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface CronResult {
    expression: string;
    description: string;
    next: string[];
    timezone: string;
}

function parseField(field: string, range: { min: number; max: number }): Set<number> {
    const result = new Set<number>();

    for (const part of field.split(',')) {
        if (part === '*') {
            for (let i = range.min; i <= range.max; i++) result.add(i);
        } else if (part.startsWith('*/')) {
            const step = parseInt(part.slice(2), 10);
            if (isNaN(step) || step < 1) throw new Error(`Invalid step in "${part}"`);
            for (let i = range.min; i <= range.max; i += step) result.add(i);
        } else if (part.includes('-')) {
            const [s, e] = part.split('-');
            const start = parseInt(s!, 10);
            const end = parseInt(e!, 10);
            if (isNaN(start) || isNaN(end) || start < range.min || end > range.max || start > end) {
                throw new Error(`Invalid range "${part}" (valid: ${range.min}-${range.max})`);
            }
            for (let i = start; i <= end; i++) result.add(i);
        } else {
            const val = parseInt(part, 10);
            if (isNaN(val) || val < range.min || val > range.max) {
                throw new Error(`Invalid value "${part}" (valid: ${range.min}-${range.max})`);
            }
            result.add(val);
        }
    }

    return result;
}

function getComponents(
    date: Date,
    formatter: Intl.DateTimeFormat,
): { minute: number; hour: number; dom: number; month: number; dow: number } {
    const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
    return {
        minute: parseInt(parts.minute!, 10),
        hour: parseInt(parts.hour!, 10) % 24,
        dom: parseInt(parts.day!, 10),
        month: parseInt(parts.month!, 10),
        dow: DOW_NAMES[parts.weekday!] ?? 0,
    };
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function formatDow(field: string): string {
    if (field === '1-5') return 'Monday through Friday';
    if (field === '0' || field === '7') return 'Sunday';
    if (field === '6') return 'Saturday';
    const n = parseInt(field, 10);
    if (!isNaN(n)) return DOW_DISPLAY[n % 7] ?? field;
    return field;
}

function describe(fields: string[]): string {
    const [mF, hF, domF, monthF, dowF] = fields as [string, string, string, string, string];

    const isAll = (f: string) => f === '*';
    const isFixed = (f: string) => /^\d+$/.test(f);
    const isStep = (f: string) => /^\*\/\d+$/.test(f);

    // Every minute
    if (isAll(mF) && isAll(hF) && isAll(domF) && isAll(monthF) && isAll(dowF)) {
        return 'Every minute';
    }

    // Every N minutes (whole day, every day)
    if (isStep(mF) && isAll(hF) && isAll(domF) && isAll(monthF) && isAll(dowF)) {
        const n = mF.slice(2);
        return `Every ${n} minute${n === '1' ? '' : 's'}`;
    }

    // Every hour at minute 0
    if (mF === '0' && isAll(hF) && isAll(domF) && isAll(monthF) && isAll(dowF)) {
        return 'Every hour';
    }

    // Every N hours at minute 0
    if (mF === '0' && isStep(hF) && isAll(domF) && isAll(monthF) && isAll(dowF)) {
        const n = hF.slice(2);
        return `Every ${n} hour${n === '1' ? '' : 's'}`;
    }

    // At specific time daily
    if (isFixed(mF) && isFixed(hF) && isAll(domF) && isAll(monthF) && isAll(dowF)) {
        return `At ${pad(parseInt(hF))}:${pad(parseInt(mF))} daily`;
    }

    // At specific time on specific weekday(s)
    if (isFixed(mF) && isFixed(hF) && isAll(domF) && isAll(monthF) && !isAll(dowF)) {
        return `At ${pad(parseInt(hF))}:${pad(parseInt(mF))}, ${formatDow(dowF)}`;
    }

    // At specific time on specific day of month
    if (isFixed(mF) && isFixed(hF) && isFixed(domF) && isAll(monthF) && isAll(dowF)) {
        return `At ${pad(parseInt(hF))}:${pad(parseInt(mF))}, on day ${domF} of the month`;
    }

    // Every N minutes, within hour range, optionally filtered by weekday
    if (isStep(mF) && !isAll(hF) && isAll(domF) && isAll(monthF)) {
        const n = mF.slice(2);
        const parts = [`Every ${n} minute${n === '1' ? '' : 's'}`];
        if (hF.includes('-')) {
            const [h1, h2] = hF.split('-');
            parts.push(`between ${pad(parseInt(h1!))}:00 and ${pad(parseInt(h2!))}:59`);
        }
        if (!isAll(dowF)) parts.push(formatDow(dowF));
        return parts.join(', ');
    }

    return `At cron schedule: ${fields.join(' ')}`;
}

/**
 * Parses a cron expression and returns the next scheduled execution dates.
 *
 * @param expr - Cron expression with 5 space-separated fields (minute hour dom month dow)
 * @param count - Number of next executions to return (1–20, default 5)
 * @param from - Starting date in ISO 8601 format (defaults to now)
 * @param timezone - Timezone to evaluate the expression in (default "UTC")
 * @returns Parsed expression with description and list of next execution timestamps
 * @throws Error if the expression is invalid, count is out of range, or timezone is unsupported
 */
export default function cron(expr: string, count: number = 5, from?: string, timezone: string = 'UTC'): CronResult {
    if (!expr) throw new Error('Please provide a cron expression (?expr=* * * * *)');

    if (!VALID_TIMEZONES.includes(timezone as Timezone)) {
        throw new Error(`Please provide a valid timezone. Options: ${VALID_TIMEZONES.join(', ')}`);
    }

    const fields = expr.trim().split(/\s+/);
    if (fields.length !== 5) {
        throw new Error('Cron expression must have exactly 5 fields (minute hour dom month dow)');
    }

    if (count < 1 || count > MAX_CRON_RESULTS) {
        throw new Error(`Count must be between 1 and ${MAX_CRON_RESULTS}`);
    }

    const fromMs = from ? new Date(from).getTime() : Date.now();
    if (from && isNaN(fromMs)) throw new Error('Please provide a valid from date (ISO 8601)');

    const sets = fields.map((f, i) => parseField(f, FIELD_RANGES[i]!));
    const [minuteSet, hourSet, domSet, monthSet, dowSet] = sets as [
        Set<number>,
        Set<number>,
        Set<number>,
        Set<number>,
        Set<number>,
    ];

    // Normalize DOW: treat 7 as Sunday (0)
    if (dowSet.has(7)) {
        dowSet.add(0);
        dowSet.delete(7);
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'long',
        hour12: false,
    });

    // Always start from the next minute (never include the current minute)
    let currentMs = (Math.floor(fromMs / 60000) + 1) * 60000;

    const next: string[] = [];
    let iterations = 0;

    while (next.length < count && iterations < MAX_CRON_ITERATIONS) {
        const { minute, hour, dom, month, dow } = getComponents(new Date(currentMs), formatter);

        if (minuteSet.has(minute) && hourSet.has(hour) && domSet.has(dom) && monthSet.has(month) && dowSet.has(dow)) {
            next.push(new Date(currentMs).toISOString());
        }

        currentMs += 60000;
        iterations++;
    }

    return { expression: expr.trim(), description: describe(fields), next, timezone };
}
