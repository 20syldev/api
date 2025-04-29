export default function time(type, start, end, format, timezone) {
    const validFormats = ['iso', 'utc', 'timestamp', 'locale', 'date', 'time', 'year', 'month', 'day', 'hour', 'minute', 'second', 'ms', 'dayOfWeek', 'dayOfYear', 'weekNumber', 'timezone', 'timezoneOffset'];
    const validTimezones = ['UTC', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];

    if (type !== 'live' && type !== 'random') return res.jsonResponse({ error: 'Please provide a valid type (?type={type})' });
    if (start && !Date.parse(start)) return res.jsonResponse({ error: 'Please provide a valid start date (?start={YYYY-MM-DD})' });
    if (end && !Date.parse(end)) return res.jsonResponse({ error: 'Please provide a valid end date (?end={YYYY-MM-DD})' });
    if (format && !validFormats.includes(format)) return res.jsonResponse({ error: 'Please provide a valid format (?format={format})' });
    if (timezone && !validTimezones.includes(timezone)) return res.jsonResponse({ error: 'Please provide a valid timezone (?timezone={timezone})' });

    const getTimeFormats = (date, timezoneOption) => {
        return {
            iso: date.toISOString(),
            utc: date.toUTCString(),
            timestamp: date.getTime(),
            locale: date.toLocaleString('en-US', { timeZone: timezoneOption, timeZoneName: 'long' }),
            date: date.toLocaleDateString('en-US', { timeZone: timezoneOption }),
            time: date.toLocaleTimeString('en-US', { timeZone: timezoneOption }),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            ms: date.getMilliseconds(),
            dayOfWeek: date.getDay(),
            dayOfYear: Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000),
            weekNumber: Math.ceil((((date - new Date(date.getFullYear(), 0, 0)) / 86400000) + 1) / 7),
            timezone: timezoneOption,
            timezoneOffset: date.getTimezoneOffset()
        };
    };

    if (type === 'random') {
        const startDate = new Date(start || '1900-01-01').getTime();
        const endDate = new Date(end || '2100-12-31').getTime();
        const randomDate = new Date(start ? startDate : startDate + Math.random() * (endDate - startDate));
        const timezoneOption = timezone || validTimezones[Math.floor(Math.random() * 5)];
        const formats = getTimeFormats(randomDate, timezoneOption);

        return (format && formats[format] ? { date: formats[format] } : formats);
    }

    const now = new Date();
    const timezoneOption = timezone || 'UTC';
    const formats = getTimeFormats(now, timezoneOption);

    return (format && formats[format] ? { date: formats[format] } : formats);
}