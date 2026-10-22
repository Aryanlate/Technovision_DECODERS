"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSync = mergeSync;
exports.currentAfterMerge = currentAfterMerge;
const index_js_1 = require("../evidence/index.js");
const compare_js_1 = require("./compare.js");
function isAi(record) {
    return record.origin === 'ai_generated';
}
function isStudentConfirmed(record) {
    return record.origin === 'student_confirmed' && record.status !== 'rejected';
}
function isRejectedOrDeleted(record, operation) {
    return record.status === 'rejected' || operation === 'reject' || operation === 'delete';
}
function remoteBase(remote) {
    return remote.previousVersion ?? Math.max(0, remote.version - 1);
}
/** Two writes of the same evidenceId that both started from the same base. */
function isConcurrent(op, remote) {
    if (op.evidenceId !== remote.evidenceId || op.opId === remote.opId)
        return false;
    return op.baseVersion === remoteBase(remote) || op.record.version === remote.version;
}
function asConflicted(record, after) {
    const version = Math.max(record.version, after.version) + (record.version <= after.version ? 1 : 0);
    const nextVersion = version === after.version ? after.version + 1 : version;
    return (0, compare_js_1.cloneRecord)({
        ...record,
        status: 'conflicted',
        version: nextVersion,
        previousVersion: after.version
    });
}
function asAdvisory(ai, confirmed, now) {
    return (0, index_js_1.createEvidence)({
        evidenceId: `ev-sync-advisory-${ai.evidenceId}-${ai.version}`,
        subjectType: ai.subjectType,
        subjectId: ai.subjectId,
        kind: ai.kind,
        key: ai.key,
        value: ai.value,
        origin: 'ai_generated',
        trust: 'needs_review',
        source: ai.source,
        linkedRef: (0, index_js_1.versionRef)(confirmed),
        deviceId: ai.deviceId,
        opId: `op-sync-advisory-${ai.opId}`,
        observedAt: ai.observedAt,
        validUntil: ai.validUntil,
        now
    });
}
function asPush(record, operation, baseVersion) {
    return {
        opId: record.opId,
        operation,
        evidenceId: record.evidenceId,
        record: (0, compare_js_1.cloneRecord)(record),
        baseVersion,
        createdAt: record.createdAt
    };
}
/**
 * Pure merge of local outbox ops and server changes. No network, no storage.
 * Server rows are applied in serverSeq order. Every version that is kept is
 * emitted; nothing is deleted.
 */
function mergeSync(input) {
    const now = input.now ?? new Date();
    const notices = [];
    const conflicts = [];
    const toApplyLocally = [];
    const outboxTransforms = new Map();
    const skipPush = new Set();
    const localRecords = (input.localRecords ?? []).map(compare_js_1.cloneRecord);
    const knownOps = new Set(localRecords.map((record) => record.opId));
    const knownKeys = new Set(localRecords.map(compare_js_1.versionKey));
    const uniqueServer = [];
    const serverByOp = new Map();
    for (const remote of (0, compare_js_1.sortByServerSeq)(input.serverChanges)) {
        if (serverByOp.has(remote.opId)) {
            notices.push({
                code: 'DUPLICATE_OP',
                message: `Duplicate opId ${remote.opId} was ignored.`,
                opId: remote.opId,
                evidenceId: remote.evidenceId
            });
            continue;
        }
        serverByOp.set(remote.opId, remote);
        uniqueServer.push(remote);
    }
    const uniqueOutbox = [];
    const outboxByOp = new Map();
    for (const op of input.outbox) {
        if (outboxByOp.has(op.opId)) {
            notices.push({
                code: 'DUPLICATE_OP',
                message: `Duplicate opId ${op.opId} was ignored.`,
                opId: op.opId,
                evidenceId: op.evidenceId
            });
            continue;
        }
        outboxByOp.set(op.opId, op);
        uniqueOutbox.push({
            ...op,
            record: (0, compare_js_1.cloneRecord)(op.record)
        });
    }
    const byEvidence = new Map();
    function history(evidenceId) {
        return byEvidence.get(evidenceId) ?? [];
    }
    function headOf(evidenceId) {
        const rows = history(evidenceId);
        return rows.length > 0 ? (0, index_js_1.currentVersion)(rows) : undefined;
    }
    function remember(record) {
        const rows = history(record.evidenceId);
        const without = rows.filter((row) => row.version !== record.version);
        byEvidence.set(record.evidenceId, [...without, (0, compare_js_1.cloneRecord)(record)]);
        knownOps.add(record.opId);
        knownKeys.add((0, compare_js_1.versionKey)(record));
    }
    function emitLocal(record) {
        if (toApplyLocally.some((row) => row.opId === record.opId && (0, compare_js_1.versionKey)(row) === (0, compare_js_1.versionKey)(record))) {
            return;
        }
        const copy = (0, compare_js_1.cloneRecord)(record);
        toApplyLocally.push(copy);
        remember(copy);
    }
    for (const record of localRecords)
        remember(record);
    for (const op of uniqueOutbox) {
        if (!knownKeys.has((0, compare_js_1.versionKey)(op.record)))
            remember(op.record);
    }
    function concurrentOps(remote) {
        return uniqueOutbox.filter((op) => isConcurrent(op, remote));
    }
    function keepAiAsAdvisory(ai, confirmed, code, message) {
        const advisory = asAdvisory(ai, confirmed, now);
        if (!knownOps.has(advisory.opId))
            emitLocal(advisory);
        notices.push({
            code,
            message,
            opId: ai.opId,
            evidenceId: confirmed.evidenceId
        });
    }
    for (const remote of uniqueServer) {
        if (knownOps.has(remote.opId))
            continue;
        const ownEcho = uniqueOutbox.some((op) => op.opId === remote.opId);
        if (ownEcho) {
            emitLocal(remote);
            skipPush.add(remote.opId);
            continue;
        }
        const current = headOf(remote.evidenceId);
        const concurrent = concurrentOps(remote);
        const concurrentReject = concurrent.find((op) => isRejectedOrDeleted(op.record, op.operation));
        const concurrentStudent = concurrent.find((op) => isStudentConfirmed(op.record));
        if (isAi(remote) && current && isRejectedOrDeleted(current) && (0, compare_js_1.valuesEqual)(current.value, remote.value)) {
            keepAiAsAdvisory(remote, current, 'REJECTED_BEATS_AI', `Student rejection of ${remote.evidenceId} beats an AI re-suggestion of the same value.`);
            continue;
        }
        if (isAi(remote) && concurrentReject && (0, compare_js_1.valuesEqual)(concurrentReject.record.value, remote.value)) {
            keepAiAsAdvisory(remote, concurrentReject.record, 'REJECTED_BEATS_AI', `Student rejection of ${remote.evidenceId} beats an AI re-suggestion of the same value.`);
            continue;
        }
        if (isAi(remote) && current && isStudentConfirmed(current)) {
            keepAiAsAdvisory(remote, current, 'AI_DID_NOT_OVERWRITE', `AI evidence was kept as advisory; student confirmed ${(0, index_js_1.versionRef)(current)} was not overwritten.`);
            continue;
        }
        if (isAi(remote) && concurrentStudent) {
            keepAiAsAdvisory(remote, concurrentStudent.record, 'AI_DID_NOT_OVERWRITE', `AI evidence was kept as advisory; student confirmed ${(0, index_js_1.versionRef)(concurrentStudent.record)} was not overwritten.`);
            continue;
        }
        if (remote.origin === 'student_confirmed' && concurrentStudent && !(0, compare_js_1.valuesEqual)(concurrentStudent.record.value, remote.value)) {
            emitLocal(remote);
            const conflicted = asConflicted(concurrentStudent.record, remote);
            emitLocal(conflicted);
            outboxTransforms.set(concurrentStudent.opId, asPush(conflicted, concurrentStudent.operation, remote.version));
            conflicts.push({
                evidenceId: remote.evidenceId,
                local: (0, compare_js_1.cloneRecord)(conflicted),
                remote: (0, compare_js_1.cloneRecord)(remote),
                reason: 'student_confirmed values differ; both versions were kept and marked conflicted.'
            });
            continue;
        }
        if (isAi(remote) && current && isAi(current)) {
            emitLocal(remote);
            notices.push({
                code: 'AI_SUPERSEDED',
                message: `Newer server version ${(0, index_js_1.versionRef)(remote)} is current; older AI versions stay in history.`,
                opId: remote.opId,
                evidenceId: remote.evidenceId
            });
            for (const op of concurrent.filter((item) => isAi(item.record))) {
                skipPush.add(op.opId);
            }
            continue;
        }
        emitLocal(remote);
    }
    const toPushToServer = [];
    for (const op of uniqueOutbox) {
        if (serverByOp.has(op.opId))
            continue;
        const transformed = outboxTransforms.get(op.opId);
        if (transformed) {
            toPushToServer.push(transformed);
            continue;
        }
        if (skipPush.has(op.opId))
            continue;
        const current = headOf(op.evidenceId);
        if (isAi(op.record) && current && isStudentConfirmed(current) && current.opId !== op.opId) {
            keepAiAsAdvisory(op.record, current, 'AI_DID_NOT_OVERWRITE', `AI evidence was kept as advisory; student confirmed ${(0, index_js_1.versionRef)(current)} was not overwritten.`);
            toPushToServer.push(asPush(asAdvisory(op.record, current, now), 'add', 0));
            continue;
        }
        if (isAi(op.record) && current && isRejectedOrDeleted(current) && (0, compare_js_1.valuesEqual)(current.value, op.record.value)) {
            keepAiAsAdvisory(op.record, current, 'REJECTED_BEATS_AI', `Student rejection of ${op.evidenceId} beats an AI re-suggestion of the same value.`);
            continue;
        }
        if (isAi(op.record) && current && isAi(current) && current.opId !== op.opId && current.serverSeq !== undefined) {
            skipPush.add(op.opId);
            continue;
        }
        toPushToServer.push({
            ...op,
            record: (0, compare_js_1.cloneRecord)(op.record)
        });
    }
    toPushToServer.sort((a, b) => {
        const id = a.evidenceId.localeCompare(b.evidenceId);
        if (id !== 0)
            return id;
        return a.record.version - b.record.version;
    });
    return { toApplyLocally, toPushToServer, conflicts, notices };
}
function currentAfterMerge(localRecords, applied, evidenceId) {
    const history = (0, index_js_1.historyOf)(evidenceId, [...localRecords, ...applied]);
    return history.length > 0 ? (0, index_js_1.currentVersion)(history) : undefined;
}
//# sourceMappingURL=merge.js.map