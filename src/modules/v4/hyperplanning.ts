import { formatDate } from './utils.js';
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

export default async function hyperplanning(url: string, detail?: string): Promise<CalendarEvent[]> {
    const response = await fetch(url);

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
