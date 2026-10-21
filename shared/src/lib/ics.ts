// ============================================================================
// iCalendar (.ics) builder — RFC 5545, plain TypeScript, no external service.
//
// Produces a single VEVENT for an opportunity deadline with two DISPLAY
// alarms: one 3 days before and one 1 day before. The output uses CRLF line
// endings and 75-octet line folding exactly as the RFC requires, so it opens
// in Google Calendar, Apple Calendar and Outlook.
// ============================================================================

/** Reminders, in days before the deadline. */
export const DEFAULT_REMINDER_DAYS_BEFORE = [3, 1];

export interface IcsDeadlineInput {
  title: string;
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. */
  deadline: string;
  description?: string;
  url?: string;
  location?: string;
  /** Stable identifier; defaults to a time-based one. */
  uid?: string;
  reminderDaysBefore?: number[];
  now?: Date;
}

const CRLF = '\r\n';

// ---------------------------------------------------------------------------
// Escaping & folding
// ---------------------------------------------------------------------------

/** Escapes a text value per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline). */
export function icsEscapeText(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** UTF-8 byte length of a string, counted without relying on TextEncoder. */
function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Folds a content line to 75 octets, continuing on the next line with a single
 * leading space (RFC 5545 §3.1). Operates on whole lines only.
 */
export function icsFoldLine(line: string): string {
  const MAX = 75;
  if (utf8ByteLength(line) <= MAX) return line;

  const out: string[] = [];
  let current = '';
  let currentBytes = 0;

  for (const char of line) {
    const charBytes = utf8ByteLength(char);
    // A folded continuation line starts with a space, which counts toward 75.
    const limit = out.length === 0 ? MAX : MAX - 1;
    if (currentBytes + charBytes > limit) {
      out.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  if (current) out.push(current);
  return out.join(`${CRLF} `);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function toIcsDate(deadline: string): { lines: string[]; isAllDay: boolean; dateOnly: string } | null {
  const text = String(deadline ?? '').trim();
  const dateOnlyMatch = DATE_ONLY.exec(text);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const base = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (Number.isNaN(base.getTime())) return null;
    // All-day event ends the following day (DTEND is exclusive per RFC 5545).
    const next = new Date(base.getTime() + 86_400_000);
    const fmt = (dt: Date) => dt.toISOString().slice(0, 10).replace(/-/g, '');
    return {
      lines: [`DTSTART;VALUE=DATE:${fmt(base)}`, `DTEND;VALUE=DATE:${fmt(next)}`],
      isAllDay: true,
      dateOnly: text
    };
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  const end = new Date(parsed.getTime() + 60 * 60 * 1000);
  const compact = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return {
    lines: [`DTSTART:${compact(parsed)}`, `DTEND:${compact(end)}`],
    isAllDay: false,
    dateOnly: parsed.toISOString().slice(0, 10)
  };
}

/** Formats a Date as a UTC iCalendar timestamp, e.g. 20261115T090000Z. */
function toIcsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/** Builds the full VCALENDAR text for one opportunity deadline. */
export function buildDeadlineIcs(input: IcsDeadlineInput): string {
  const now = input.now ?? new Date();
  const dates = toIcsDate(input.deadline);
  if (!dates) {
    throw new Error('Cannot build a calendar file without a valid deadline date.');
  }

  const uid = input.uid || `oppkit-${now.getTime()}@opportunitykit.local`;
  const reminders = (input.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS_BEFORE)
    .filter((d) => Number.isFinite(d) && d > 0)
    .sort((a, b) => b - a);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpportunityKit//Deadline Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscapeText(uid)}`,
    `DTSTAMP:${toIcsStamp(now)}`,
    ...dates.lines,
    `SUMMARY:${icsEscapeText(`Apply: ${input.title}`)}`
  ];

  if (input.description) lines.push(`DESCRIPTION:${icsEscapeText(input.description)}`);
  if (input.location) lines.push(`LOCATION:${icsEscapeText(input.location)}`);
  if (input.url) lines.push(`URL:${icsEscapeText(input.url)}`);

  lines.push('STATUS:CONFIRMED');

  for (const days of reminders) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscapeText(`Reminder: ${input.title} deadline in ${days} day${days === 1 ? '' : 's'}`)}`,
      `TRIGGER:-P${days}D`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(icsFoldLine).join(CRLF) + CRLF;
}

/** A safe, readable .ics file name for an opportunity title. */
export function icsFileName(title: string): string {
  const slug = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'opportunity'}-deadline.ics`;
}
