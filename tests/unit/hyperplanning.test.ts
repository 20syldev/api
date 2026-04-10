import { test, describe, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import hyperplanning from '../../src/modules/v4/hyperplanning.js';

const ORIGINAL_FETCH = globalThis.fetch;

const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:event-1@test
DTSTAMP:20990101T000000Z
DTSTART:20990101T080000Z
DTEND:20990101T090000Z
SUMMARY:Mathematics - CM
DESCRIPTION:Matière : Mathematics\\nEnseignant : Mr Smith\\nPromotions : G1, G2\\nSalle : Room 101
END:VEVENT
END:VCALENDAR`;

function mockFetch(body: string, ok = true, contentType = 'text/calendar'): void {
    globalThis.fetch = (async () => ({
        ok,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
        text: async () => body,
    })) as unknown as typeof fetch;
}

describe('hyperplanning', () => {
    after(() => {
        globalThis.fetch = ORIGINAL_FETCH;
    });

    test('parses valid ICS with default detail', async () => {
        mockFetch(sampleIcs);
        const events = await hyperplanning('https://fake.test/cal.ics');
        assert.equal(events.length, 1);
        assert.equal(events[0]!.summary, 'Mathematics - CM');
        assert.ok(events[0]!.start);
        assert.ok(events[0]!.end);
    });

    test('detail=list returns split summary', async () => {
        mockFetch(sampleIcs);
        const events = await hyperplanning('https://fake.test/cal.ics', 'list');
        assert.deepEqual(events[0]!.summary, ['Mathematics', 'CM']);
    });

    test('detail=full extracts subject/teacher/classes', async () => {
        mockFetch(sampleIcs);
        const events = await hyperplanning('https://fake.test/cal.ics', 'full');
        const e = events[0]!;
        assert.equal(e.subject, 'Mathematics');
        assert.equal(e.teacher, 'Mr Smith');
        assert.deepEqual(e.classes, ['G1', 'G2']);
    });

    test('throws on non-OK response', async () => {
        mockFetch('', false);
        await assert.rejects(() => hyperplanning('https://fake.test/cal.ics'), /Invalid ICS/);
    });

    test('throws on wrong content-type', async () => {
        mockFetch(sampleIcs, true, 'text/html');
        await assert.rejects(() => hyperplanning('https://fake.test/cal.ics'), /Invalid ICS/);
    });

    test('filters out past events', async () => {
        const pastIcs = sampleIcs.replaceAll('20990101', '19990101');
        mockFetch(pastIcs);
        const events = await hyperplanning('https://fake.test/cal.ics');
        assert.equal(events.length, 0);
    });
});

before(() => {
    globalThis.fetch = ORIGINAL_FETCH;
});
