import { formatDate } from '../../utils/helpers.js';
import ical from 'ical.js';

interface CalendarEvent {
    summary: string[] | string;
    subject?: string;
    teacher?: string;
    classes?: string[];
    type?: string;
    start: string;
    end: string;
}

function blocked(hostname: string): boolean {
    const list = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'metadata.google.internal'];
    if (list.includes(hostname)) return true;

    const parts = hostname.split('.').map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        if (parts[0] === 10) return true;
        if (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
        if (parts[0] === 192 && parts[1] === 168) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
        if (parts[0] === 0) return true;
    }

    return false;
}

export default async function hyperplanning(url: string, detail?: string): Promise<CalendarEvent[]> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL.');
    }

    if (parsed.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed.');
    if (blocked(parsed.hostname)) throw new Error('Access to private/internal hosts is not allowed.');

    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!response.ok || !(response.headers.get('content-type') || '').includes('text/calendar')) {
        throw new Error('Invalid ICS file format.');
    }

    const events: CalendarEvent[] = new ical.Component(ical.parse(await response.text()))
        .getAllSubcomponents('vevent')
        .map((e: ical.Component) => {
            const evt = new ical.Event(e);
            const summary = (evt.summary || '').split(' ').filter((part: string) => part !== '-');
            const start = formatDate(evt.startDate.toJSDate());
            const end = formatDate(evt.endDate.toJSDate());

            if (detail === 'full') {
                const desc = (evt.description || '').split('\n').map((l: string) => l.trim());
                const extract = (p: string) => (desc.find((l: string) => l.startsWith(p)) || '').replace(p, '').trim();

                return {
                    summary,
                    subject: extract('Matière :'),
                    teacher: extract('Enseignant :'),
                    classes: extract('Promotions :')
                        .split(', ')
                        .map((c: string) => c.trim()),
                    type: extract('Salle :') || undefined,
                    start,
                    end,
                };
            }

            if (detail === 'list') return { summary, start, end };

            return {
                summary: evt.summary || '',
                start,
                end,
            };
        })
        .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .filter((e: CalendarEvent) => new Date(e.end) >= new Date());

    return events;
}
