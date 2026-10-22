import { z } from 'zod';
import { type Finding, type ResultCounts } from './types/index.js';
/** Share links stay valid for 7 days, then expire automatically. */
export declare const SHARE_TTL_DAYS = 7;
/** One requirement row inside a snapshot: status only, never the student's value. */
export declare const ShareRowSchema: z.ZodObject<{
    requirementId: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
    reason: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "Match" | "Mismatch" | "Missing info";
    title: string;
    requirementId: string;
    reason: string;
}, {
    status: "Match" | "Mismatch" | "Missing info";
    title: string;
    requirementId: string;
    reason?: string | undefined;
}>;
export type ShareRow = z.infer<typeof ShareRowSchema>;
export declare const ShareSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
    revoked: z.ZodDefault<z.ZodBoolean>;
    opportunityTitle: z.ZodString;
    opportunityType: z.ZodDefault<z.ZodString>;
    /** The opportunity's own official page (never a personal profile link). */
    sourceUrl: z.ZodDefault<z.ZodString>;
    sourceLabel: z.ZodDefault<z.ZodString>;
    readinessScore: z.ZodNumber;
    readinessLabel: z.ZodDefault<z.ZodString>;
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
    rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
        reason: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason: string;
    }, {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason?: string | undefined;
    }>, "many">>;
    nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    opportunityType: string;
    nextSteps: string[];
    opportunityTitle: string;
    sourceUrl: string;
    readinessScore: number;
    readinessLabel: string;
    expiresAt: string;
    revoked: boolean;
    sourceLabel: string;
    rows: {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason: string;
    }[];
    counts?: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    } | undefined;
    ownerId?: string | undefined;
}, {
    createdAt: string;
    id: string;
    opportunityTitle: string;
    readinessScore: number;
    expiresAt: string;
    opportunityType?: string | undefined;
    counts?: {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    } | undefined;
    nextSteps?: string[] | undefined;
    sourceUrl?: string | undefined;
    readinessLabel?: string | undefined;
    ownerId?: string | undefined;
    revoked?: boolean | undefined;
    sourceLabel?: string | undefined;
    rows?: {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason?: string | undefined;
    }[] | undefined;
}>;
export type ShareSnapshot = z.infer<typeof ShareSnapshotSchema>;
/** What the public /share/[id] page is allowed to read (no owner id). */
export declare const PublicShareSnapshotSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    ownerId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
    revoked: z.ZodDefault<z.ZodBoolean>;
    opportunityTitle: z.ZodString;
    opportunityType: z.ZodDefault<z.ZodString>;
    /** The opportunity's own official page (never a personal profile link). */
    sourceUrl: z.ZodDefault<z.ZodString>;
    sourceLabel: z.ZodDefault<z.ZodString>;
    readinessScore: z.ZodNumber;
    readinessLabel: z.ZodDefault<z.ZodString>;
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
    rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
        requirementId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<["Match", "Mismatch", "Missing info"]>;
        reason: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason: string;
    }, {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason?: string | undefined;
    }>, "many">>;
    nextSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "ownerId">, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    opportunityType: string;
    nextSteps: string[];
    opportunityTitle: string;
    sourceUrl: string;
    readinessScore: number;
    readinessLabel: string;
    expiresAt: string;
    revoked: boolean;
    sourceLabel: string;
    rows: {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason: string;
    }[];
    counts?: {
        matches: number;
        mismatches: number;
        missingInfo: number;
        total?: number | undefined;
    } | undefined;
}, {
    createdAt: string;
    id: string;
    opportunityTitle: string;
    readinessScore: number;
    expiresAt: string;
    opportunityType?: string | undefined;
    counts?: {
        matches?: number | undefined;
        mismatches?: number | undefined;
        missingInfo?: number | undefined;
        total?: number | undefined;
    } | undefined;
    nextSteps?: string[] | undefined;
    sourceUrl?: string | undefined;
    readinessLabel?: string | undefined;
    revoked?: boolean | undefined;
    sourceLabel?: string | undefined;
    rows?: {
        status: "Match" | "Mismatch" | "Missing info";
        title: string;
        requirementId: string;
        reason?: string | undefined;
    }[] | undefined;
}>;
export type PublicShareSnapshot = z.infer<typeof PublicShareSnapshotSchema>;
/** Removes links, emails and phone numbers from a free-text field. */
export declare function redactContactAndLinks(text: string): string;
/** True when a string still contains an email, phone number or link. */
export declare function containsContactOrLink(text: string): boolean;
export declare function shareExpiresAt(createdAt: Date, ttlDays?: number): string;
export declare function isShareExpired(snapshot: {
    expiresAt: string;
}, now?: Date): boolean;
/** Whole days until expiry (0 once expired). */
export declare function shareDaysRemaining(snapshot: {
    expiresAt: string;
}, now?: Date): number;
/** A snapshot is usable when it is neither revoked nor expired. */
export declare function isShareActive(snapshot: {
    revoked?: boolean;
    expiresAt: string;
}, now?: Date): boolean;
export interface ShareSnapshotInput {
    opportunityTitle: string;
    opportunityType?: string;
    sourceUrl?: string;
    sourceLabel?: string;
    readinessScore: number;
    readinessLabel?: string;
    counts?: ResultCounts;
    findings?: Pick<Finding, 'requirementId' | 'title' | 'status' | 'reason'>[];
    nextSteps?: string[];
    ownerId?: string;
    ttlDays?: number;
    /** Overridable for deterministic tests. */
    id?: string;
    now?: Date;
}
export declare function newShareId(now?: Date): string;
/**
 * Builds a sanitised, read-only snapshot. Only statuses are kept from the
 * findings — the student's own values are dropped — and every text field is
 * run through the redactor.
 */
export declare function createShareSnapshot(input: ShareSnapshotInput): ShareSnapshot;
/** Strips the owner id before the snapshot is shown publicly. */
export declare function toPublicShareSnapshot(snapshot: ShareSnapshot): PublicShareSnapshot;
//# sourceMappingURL=share.d.ts.map