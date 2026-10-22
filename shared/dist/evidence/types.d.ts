import { z } from 'zod';
/** What the evidence is about. */
export declare const SubjectTypeSchema: z.ZodEnum<["profile", "opportunity"]>;
export type SubjectType = z.infer<typeof SubjectTypeSchema>;
/** Who created the record. Only the student can turn a suggestion into a fact. */
export declare const EvidenceOriginSchema: z.ZodEnum<["student_confirmed", "user_provided", "ai_generated", "system_import"]>;
export type EvidenceOrigin = z.infer<typeof EvidenceOriginSchema>;
/** How much the record can be trusted. */
export declare const EvidenceTrustSchema: z.ZodEnum<["verified", "needs_review", "unverified"]>;
export type EvidenceTrust = z.infer<typeof EvidenceTrustSchema>;
/** Lifecycle of a version. Old versions stay stored as 'superseded'. */
export declare const EvidenceStatusSchema: z.ZodEnum<["active", "superseded", "rejected", "conflicted"]>;
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;
/** Local device state of the record against the server store. */
export declare const EvidenceSyncStateSchema: z.ZodEnum<["local_only", "pending", "synced", "conflict"]>;
export type EvidenceSyncState = z.infer<typeof EvidenceSyncStateSchema>;
/** Where a value came from, so the UI can always show the origin and a citation. */
export declare const EvidenceSourceSchema: z.ZodObject<{
    type: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    agent: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    sentence: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    url?: string | undefined;
    agent?: string | undefined;
    provider?: string | undefined;
    sentence?: string | undefined;
}, {
    type: string;
    url?: string | undefined;
    agent?: string | undefined;
    provider?: string | undefined;
    sentence?: string | undefined;
}>;
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;
export declare const EvidenceRecordSchema: z.ZodObject<{
    /** Stable across every version of the same fact. */
    evidenceId: z.ZodString;
    subjectType: z.ZodEnum<["profile", "opportunity"]>;
    subjectId: z.ZodString;
    kind: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnknown;
    origin: z.ZodEnum<["student_confirmed", "user_provided", "ai_generated", "system_import"]>;
    trust: z.ZodEnum<["verified", "needs_review", "unverified"]>;
    source: z.ZodObject<{
        type: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        agent: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
        sentence: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        url?: string | undefined;
        agent?: string | undefined;
        provider?: string | undefined;
        sentence?: string | undefined;
    }, {
        type: string;
        url?: string | undefined;
        agent?: string | undefined;
        provider?: string | undefined;
        sentence?: string | undefined;
    }>;
    createdAt: z.ZodString;
    observedAt: z.ZodString;
    validUntil: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "superseded", "rejected", "conflicted"]>;
    /** 1 for a brand new fact, then 2, 3, ... for every change. */
    version: z.ZodNumber;
    previousVersion: z.ZodOptional<z.ZodNumber>;
    /** Version reference (`evidenceId@version`) this record is linked to. */
    linkedRef: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodString;
    serverSeq: z.ZodOptional<z.ZodNumber>;
    opId: z.ZodString;
    syncState: z.ZodEnum<["local_only", "pending", "synced", "conflict"]>;
}, "strip", z.ZodTypeAny, {
    status: "rejected" | "active" | "superseded" | "conflicted";
    kind: string;
    source: {
        type: string;
        url?: string | undefined;
        agent?: string | undefined;
        provider?: string | undefined;
        sentence?: string | undefined;
    };
    trust: "verified" | "needs_review" | "unverified";
    evidenceId: string;
    subjectType: "profile" | "opportunity";
    subjectId: string;
    key: string;
    origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
    createdAt: string;
    observedAt: string;
    version: number;
    deviceId: string;
    opId: string;
    syncState: "pending" | "local_only" | "synced" | "conflict";
    value?: unknown;
    validUntil?: string | undefined;
    previousVersion?: number | undefined;
    linkedRef?: string | undefined;
    serverSeq?: number | undefined;
}, {
    status: "rejected" | "active" | "superseded" | "conflicted";
    kind: string;
    source: {
        type: string;
        url?: string | undefined;
        agent?: string | undefined;
        provider?: string | undefined;
        sentence?: string | undefined;
    };
    trust: "verified" | "needs_review" | "unverified";
    evidenceId: string;
    subjectType: "profile" | "opportunity";
    subjectId: string;
    key: string;
    origin: "student_confirmed" | "user_provided" | "ai_generated" | "system_import";
    createdAt: string;
    observedAt: string;
    version: number;
    deviceId: string;
    opId: string;
    syncState: "pending" | "local_only" | "synced" | "conflict";
    value?: unknown;
    validUntil?: string | undefined;
    previousVersion?: number | undefined;
    linkedRef?: string | undefined;
    serverSeq?: number | undefined;
}>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
/** Kinds that carry an age limit. Other kinds never go stale by age. */
export declare const EVIDENCE_KIND: {
    /** Facts gathered by web research (72-hour style lookups). */
    readonly RESEARCHED_FACT: "researched_fact";
    /** Anything derived from the student's GitHub profile. */
    readonly GITHUB_DERIVED: "github_derived";
    /** Analysis of pasted profile / resume text. */
    readonly PROFILE_TEXT_ANALYSIS: "profile_text_analysis";
};
/** Builds a stable `evidenceId@version` reference used by linkedRef. */
export declare function versionRef(record: Pick<EvidenceRecord, 'evidenceId' | 'version'>): string;
//# sourceMappingURL=types.d.ts.map