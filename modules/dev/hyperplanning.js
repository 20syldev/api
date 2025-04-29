import ical from 'ical.js';
import fetch from 'node-fetch';

const formatDate = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('Z', '');

export default async function hyperplanning(url, detail) {
    const response = await fetch(url);
    if (!response.ok || !(response.headers.get('content-type') || '').includes('text/calendar')) return res.jsonResponse({ error: 'Invalid ICS file format.' });

    const events = new ical.Component(ical.parse(await response.text()))
        .getAllSubcomponents('vevent')
        .map(e => {
            const evt = new ical.Event(e);
            const summary = evt.summary.split(' ').filter(part => part !== '-');
            const start = formatDate(evt.startDate.toJSDate());
            const end = formatDate(evt.endDate.toJSDate());

            if (detail === 'full') {
                const desc = evt.description.split('\n').map(l => l.trim());
                const extract = (p) => (desc.find(l => l.startsWith(p)) || '').replace(p, '').trim();

                return {
                    summary,
                    subject: extract('Matière :'),
                    teacher: extract('Enseignant :'),
                    classes: extract('Promotions :').split(', ').map(c => c.trim()),
                    type: extract('Salle :') || undefined,
                    start,
                    end
                };
            }

            if (detail === 'list') return { summary, start, end };

            return { summary: evt.summary, start, end };
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .filter(e => new Date(e.end) >= new Date());

    return events;
}