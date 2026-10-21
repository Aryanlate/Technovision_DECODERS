import { z } from 'zod';
import { type ResultCounts } from './types/index.js';
export declare const TrackerStatusSchema: z.ZodEnum<["Interested", "Preparing", "Applied", "Interview", "Result"]>;
export type TrackerStatus = z.infer<typeof TrackerStatusSchema>;
/** Board columns, left to right — the order a student moves through. */
export declare const TRACKER_STATUSES: TrackerStatus[];
/** A deadline this many days away (or sooner, but not past) is "coming up". */
export declare const DEADLINE_SOON_DAYS = 7;
export declare const TrackerItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    /** Human-readable source, e.g. "Pasted listing" or an organisation name. */
    source: z.ZodDefault<z.ZodString>;
    sourceUrl: z.ZodDefault<z.ZodString>;
    /** ISO date (YYYY-MM-DD) or full ISO timestamp. Null when the listing has none. */
    deadline: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    /** Readiness score (0-100) captured when the item was saved. */
    readinessScore: z.ZodNumber;
    readinessLabel: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["Interested", "Preparing", "Applied", "Interview", "Result"]>>;
    notes: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    counts: z.ZodOptional<z.ZodObject<{
        matches: z.ZodDefault<z.ZodNumber>;
        mismatches: z.ZodDefault<z.ZodNumber>;
        missingInfo: z.ZodDefault<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    }, {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    }>>;
    nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "Interested" | "Preparing" | "Applied" | "Interview" | "Result";
    id: string;
    title: string;
    deadline: string | null;
    nextSteps: string[];
    source: string;
    notes: string;
    sourceUrl: string;
    readinessScore: number;
    readinessLabel: string;
    createdAt: string;
    updatedAt: string;
    counts?: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    } | undefined;
}, {
    id: string;
    title: string;
    readinessScore: number;
    createdAt: string;
    updatedAt: string;
    status?: "Interested" | "Preparing" | "Applied" | "Interview" | "Result" | undefined;
    deadline?: string | null | undefined;
    counts?: {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    } | undefined;
    nextSteps?: string[] | undefined;
    source?: string | undefined;
    notes?: string | undefined;
    sourceUrl?: string | undefined;
    readinessLabel?: string | undefined;
}>;
export type TrackerItem = z.infer<typeof TrackerItemSchema>;
export type TrackerSortKey = 'deadline' | 'readiness' | 'title' | 'created';
export interface TrackerFilter {
    status?: TrackerStatus | 'All';
    /** Only items whose deadline is within DEADLINE_SOON_DAYS days. */
    soonOnly?: boolean;
    /** Case-insensitive search over title, source and notes. */
    query?: string;
}
export interface NewTrackerItemInput {
    title: string;
    source?: string;
    sourceUrl?: string;
    deadline?: string | null;
    readinessScore: number;
    readinessLabel?: string;
    status?: TrackerStatus;
    notes?: string;
    counts?: ResultCounts;
    nextSteps?: string[];
    /** Overridable for deterministic tests. */
    id?: string;
    now?: Date;
}
/** Converts a date string to a whole-day index. Returns null for invalid input. */
export declare function deadlineDayIndex(deadline?: string | null): number | null;
/** Whole days from `now` until the deadline. Negative means it has passed. */
export declare function daysUntilDeadline(deadline?: string | null, now?: Date): number | null;
/** True when the deadline is today or within the next `days` days (but not past). */
export declare function isDeadlineSoon(deadline?: string | null, now?: Date, days?: number): boolean;
/** Short human label for a deadline, e.g. "in 3 days", "today", "2 days ago". */
export declare function describeDeadline(deadline?: string | null, now?: Date): string;
/** Stable id generator that works in the browser and in tests. */
export declare function newTrackerId(now?: Date): string;
/** Builds a validated tracker item, filling ids and timestamps. */
export declare function createTrackerItem(input: NewTrackerItemInput): TrackerItem;
/**
 * Sorts a copy of the items. Missing deadlines always sort last, so a listing
 * without a date never jumps ahead of one that is genuinely closing soon.
 */
export declare function sortTrackerItems(items: TrackerItem[], key?: TrackerSortKey): TrackerItem[];
/** Applies status, "coming up soon" and text filters. */
export declare function filterTrackerItems(items: TrackerItem[], filter?: TrackerFilter): TrackerItem[];
/** Groups items into the five board columns, each sorted by deadline. */
export declare function groupTrackerItemsByStatus(items: TrackerItem[]): Record<TrackerStatus, TrackerItem[]>;
/** Counts items per status, always including zero-count columns. */
export declare function trackerStatusCounts(items: TrackerItem[]): Record<TrackerStatus, number>;
//# sourceMappingURL=tracker.d.ts.map