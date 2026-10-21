import { describe, it, expect } from 'vitest';
import {
  buildDeadlineIcs,
  icsEscapeText,
  icsFoldLine,
  icsFileName,
  DEFAULT_REMINDER_DAYS_BEFORE
} from '../src/lib/ics.js';

const NOW = new Date('2026-10-18T09:30:00Z');

describe('iCalendar deadline export (/lib/ics)', () => {
  it('builds an all-day event with an exclusive DTEND and a DTSTAMP', () => {
    const ics = buildDeadlineIcs({ title: 'Summer Intern', deadline: '2026-11-15', now: NOW });

    // All-day events use VALUE=DATE, and DTEND is the following day (exclusive).
    expect(ics).toContain('DTSTART;VALUE=DATE:20261115');
    expect(ics).toContain('DTEND;VALUE=DATE:20261116');
    expect(ics).toContain('DTSTAMP:20261018T093000Z');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('inserts exactly the two default reminders: 3 days and 1 day before', () => {
    const ics = buildDeadlineIcs({ title: 'Summer Intern', deadline: '2026-11-15', now: NOW });

    expect(DEFAULT_REMINDER_DAYS_BEFORE).toEqual([3, 1]);
    const alarms = ics.match(/BEGIN:VALARM/g) ?? [];
    expect(alarms).toHaveLength(2);
    expect(ics).toContain('TRIGGER:-P3D');
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics).toContain('ACTION:DISPLAY');
  });

  it('uses CRLF line endings and never a bare LF', () => {
    const ics = buildDeadlineIcs({ title: 'Summer Intern', deadline: '2026-11-15', now: NOW });

    expect(ics.endsWith('\r\n')).toBe(true);
    // Every LF must be preceded by a CR.
    expect(/(^|[^\r])\n/.test(ics)).toBe(false);
  });

  it('always ends with a balanced BEGIN/END pair', () => {
    const ics = buildDeadlineIcs({ title: 'X', deadline: '2026-11-15', now: NOW });
    const begins = ics.match(/^BEGIN:/gm) ?? [];
    const ends = ics.match(/^END:/gm) ?? [];
    expect(begins.length).toBe(ends.length);
  });

  it('folds long lines to 75 octets with a leading space on continuations', () => {
    const longTitle = 'A very long opportunity title that certainly exceeds seventy five octets in total length';
    const ics = buildDeadlineIcs({ title: longTitle, deadline: '2026-11-15', now: NOW });

    const rawLines = ics.split('\r\n');
    for (const line of rawLines) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
    // A fold happened, and continuations start with a single space.
    expect(ics).toContain('\r\n ');
    expect(ics).toContain(`SUMMARY:${icsEscapeText(`Apply: ${longTitle}`).slice(0, 10)}`);
  });

  it('supports a timed event when a full timestamp is given', () => {
    const ics = buildDeadlineIcs({
      title: 'Interview slot',
      deadline: '2026-11-15T14:30:00Z',
      now: NOW
    });

    expect(ics).toContain('DTSTART:20261115T143000Z');
    expect(ics).toContain('DTEND:20261115T153000Z'); // one hour later
    expect(ics).not.toContain('VALUE=DATE');
  });

  it('drops reminder values that are not positive numbers', () => {
    const ics = buildDeadlineIcs({
      title: 'X',
      deadline: '2026-11-15',
      reminderDaysBefore: [0, -2, 5],
      now: NOW
    });

    expect(ics).toContain('TRIGGER:-P5D');
    expect(ics).not.toContain('TRIGGER:-P0D');
    expect(ics).not.toContain('TRIGGER:--P2D');
  });

  it('escapes backslashes, commas, semicolons and newlines', () => {
    expect(icsEscapeText('a, b; c\\d')).toBe('a\\, b\\; c\\\\d');
    expect(icsEscapeText('line1\nline2')).toBe('line1\\nline2');
  });

  it('refuses to build a calendar file without a usable date', () => {
    expect(() => buildDeadlineIcs({ title: 'X', deadline: 'not-a-date', now: NOW })).toThrow(
      'Cannot build a calendar file without a valid deadline date.'
    );
    expect(() => buildDeadlineIcs({ title: 'X', deadline: '', now: NOW })).toThrow();
  });

  it('produces a readable, safe file name', () => {
    expect(icsFileName('Summer Intern @ Infosys!')).toBe('summer-intern-infosys-deadline.ics');
    expect(icsFileName('')).toBe('opportunity-deadline.ics');
  });

  it('leaves short lines untouched when folding', () => {
    expect(icsFoldLine('SUMMARY:Short')).toBe('SUMMARY:Short');
  });
});
