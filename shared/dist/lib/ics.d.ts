/** Reminders, in days before the deadline. */
export declare const DEFAULT_REMINDER_DAYS_BEFORE: number[];
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
/** Escapes a text value per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline). */
export declare function icsEscapeText(value: string): string;
/**
 * Folds a content line to 75 octets, continuing on the next line with a single
 * leading space (RFC 5545 §3.1). Operates on whole lines only.
 */
export declare function icsFoldLine(line: string): string;
/** Builds the full VCALENDAR text for one opportunity deadline. */
export declare function buildDeadlineIcs(input: IcsDeadlineInput): string;
/** A safe, readable .ics file name for an opportunity title. */
export declare function icsFileName(title: string): string;
//# sourceMappingURL=ics.d.ts.map