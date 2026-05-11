import { MAX_COUNTDOWN_YEARS } from '../../constants.js';

const VALID_FORMATS = [
    'iso',
    'utc',
    'timestamp',
    'locale',
    'date',
    'time',
    'year',
    'month',
    'day',
    'hour',
    'minute',
    'second',
    'ms',
    'dayOfWeek',
    'dayOfYear',
    'weekNumber',
    'timezone',
    'timezoneOffset',
] as const;

export const VALID_TIMEZONES = ['UTC', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'] as const;

type TimeFormat = (typeof VALID_FORMATS)[number];
type Timezone = (typeof VALID_TIMEZONES)[number];

/**
 * Returns the current or a random date/time in various formats and timezones,
 * or computes a countdown/elapsed time to/from a target date.
 *
 * @param type - "live" for the current time, "random" for a random date, or "countdown" for a time diff
 * @param start - Optional start date for random mode (YYYY-MM-DD)
 * @param end - Optional end date for random mode (YYYY-MM-DD)
 * @param format - Optional specific format to return (e.g. "iso", "timestamp", "year")
 * @param timezone - Optional timezone (e.g. "UTC", "Europe/Paris")
 * @param target - Required for countdown mode: target date in ISO 8601 or YYYY-MM-DD format
 * @returns Object containing all time formats, a single format, or a countdown result
 * @throws Error if type, format, timezone, or target is invalid
 */
export default function time(
    type: string = 'live',
    start?: string,
    end?: string,
    format?: string,
    timezone?: string,
    target?: string,
): Record<string, unknown> {
    if (type !== 'live' && type !== 'random' && type !== 'countdown') {
        throw new Error('Please provide a valid type (live, random or countdown)');
    }

    if (timezone && !VALID_TIMEZONES.includes(timezone as Timezone)) {
        throw new Error(`Please provide a valid timezone. Options: ${VALID_TIMEZONES.join(', ')}`);
    }

    if (type === 'countdown') {
        if (!target) {
            throw new Error('Please provide a target date (?target=YYYY-MM-DD)');
        }

        const targetDate = new Date(target);
        if (isNaN(targetDate.getTime())) {
            throw new Error('Please provide a valid target date (ISO 8601 or YYYY-MM-DD)');
        }

        const now = new Date();
        const maxMs = MAX_COUNTDOWN_YEARS * 365.25 * 24 * 3600 * 1000;

        if (Math.abs(targetDate.getTime() - now.getTime()) > maxMs) {
            throw new Error(`Target date must be within ${MAX_COUNTDOWN_YEARS} years from now`);
        }

        const direction: 'future' | 'past' = targetDate > now ? 'future' : 'past';
        const diffMs = Math.abs(targetDate.getTime() - now.getTime());
        const total_seconds = Math.floor(diffMs / 1000);

        const days = Math.floor(total_seconds / 86400);
        const hours = Math.floor((total_seconds % 86400) / 3600);
        const minutes = Math.floor((total_seconds % 3600) / 60);
        const seconds = total_seconds % 60;

        const parts: string[] = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

        return {
            target: targetDate.toISOString(),
            now: now.toISOString(),
            direction,
            remaining: { total_seconds, days, hours, minutes, seconds },
            human: parts.length > 0 ? parts.join(', ') : '0 seconds',
        };
    }

    if (start && !Date.parse(start)) {
        throw new Error('Please provide a valid start date (YYYY-MM-DD)');
    }

    if (end && !Date.parse(end)) {
        throw new Error('Please provide a valid end date (YYYY-MM-DD)');
    }

    if (format && !VALID_FORMATS.includes(format as TimeFormat)) {
        throw new Error(`Please provide a valid format. Options: ${VALID_FORMATS.join(', ')}`);
    }

    const getTimeFormats = (date: Date, tz: string): Record<string, unknown> => {
        return {
            iso: date.toISOString(),
            utc: date.toUTCString(),
            timestamp: date.getTime(),
            locale: date.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'long' }),
            date: date.toLocaleDateString('en-US', { timeZone: tz }),
            time: date.toLocaleTimeString('en-US', { timeZone: tz }),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            ms: date.getMilliseconds(),
            dayOfWeek: date.getDay(),
            dayOfYear: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000),
            weekNumber: Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000 + 1) / 7),
            timezone: tz,
            timezoneOffset: date.getTimezoneOffset(),
        };
    };

    if (type === 'random') {
        const startDate = start ? new Date(start).getTime() : new Date('1900-01-01').getTime();
        const endDate = end ? new Date(end).getTime() : new Date('2100-12-31').getTime();
        const randomDate = new Date(startDate + Math.random() * (endDate - startDate));
        const tz = timezone || VALID_TIMEZONES[Math.floor(Math.random() * VALID_TIMEZONES.length)]!;
        const formats = getTimeFormats(randomDate, tz);

        return format ? { date: formats[format] } : formats;
    }

    const now = new Date();
    const tz = timezone || 'UTC';
    const formats = getTimeFormats(now, tz);

    return format ? { date: formats[format] } : formats;
}
