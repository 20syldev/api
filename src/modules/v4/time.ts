const validFormats = [
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

const validTimezones = ['UTC', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'] as const;

type TimeFormat = (typeof validFormats)[number];
type Timezone = (typeof validTimezones)[number];

export default function time(
    type: string = 'live',
    start?: string,
    end?: string,
    format?: string,
    timezone?: string,
): Record<string, unknown> {
    if (type !== 'live' && type !== 'random') {
        throw new Error('Please provide a valid type (live or random)');
    }

    if (start && !Date.parse(start)) {
        throw new Error('Please provide a valid start date (YYYY-MM-DD)');
    }

    if (end && !Date.parse(end)) {
        throw new Error('Please provide a valid end date (YYYY-MM-DD)');
    }

    if (format && !validFormats.includes(format as TimeFormat)) {
        throw new Error(`Please provide a valid format. Options: ${validFormats.join(', ')}`);
    }

    if (timezone && !validTimezones.includes(timezone as Timezone)) {
        throw new Error(`Please provide a valid timezone. Options: ${validTimezones.join(', ')}`);
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
        const tz = timezone || validTimezones[Math.floor(Math.random() * validTimezones.length)]!;
        const formats = getTimeFormats(randomDate, tz);

        return format ? { date: formats[format] } : formats;
    }

    const now = new Date();
    const tz = timezone || 'UTC';
    const formats = getTimeFormats(now, tz);

    return format ? { date: formats[format] } : formats;
}
