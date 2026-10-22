import { currentVersion } from '../evidence/index.js';
import type { EvidenceRecord } from '../evidence/types.js';
import {
  buildResultFromFindings,
  evaluateRequirement,
  normalizeStudentProfile,
  toRequirements
} from '../lib/engine/core.js';
import {
  RequirementKindSchema,
  type Checklist,
  type Requirement,
  type RequirementKind,
  type StudentProfile
} from '../lib/types/index.js';
import { classifyEvidence, type EvidenceVerdict } from './classification.js';
import { profileEvidenceFromProfile, requirementEvidenceFromRequirements } from './evidence.js';
import { evidenceFingerprint } from './fingerprint.js';
import type {
  Decision,
  EligibilityFinding,
  ExcludedEvidence,
  ReasonCode,
  SupportingEvidence
} from './types.js';

// ============================================================================
// Dynamic eligibility evaluator (pure TypeScript, no AI, no network).
//
// evaluate() is rebuilt from the evidence on every call. It is deliberately not
// the source of truth: a cached Decision must be keyed by evidenceFingerprint,
// so any change to the evidence makes the cached verdict unusable.
//
// Only a confirmed fact can produce a Match or a Mismatch. Everything else is
// advisory: it is listed as excludedEvidence and the requirement degrades to
// "Missing info" with the reason code that explains why.
// ============================================================================

/** When several advisory records compete, the most blocking reason wins. */
const REASON_PRIORITY: ReasonCode[] = [
  'CONFLICT',
  'STALE',
  'UNCONFIRMED_AI',
  'UNVERIFIED',
  'MISSING',
  'SUPPORTED',
  'CONTRADICTED'
];

interface IndexedEvidence {
  evidenceId: string;
  current: EvidenceRecord;
  verdict: EvidenceVerdict;
  older: EvidenceRecord[];
}

interface ExcludedItem {
  record: EvidenceRecord;
  reasonCode: ReasonCode;
  why: string;
}

/** Groups the records by evidenceId and judges only the current version. */
function indexEvidence(records: EvidenceRecord[], now: Date): IndexedEvidence[] {
  const groups = new Map<string, EvidenceRecord[]>();

  for (const record of records) {
    const history = groups.get(record.evidenceId);
    if (history) {
      history.push(record);
    } else {
      groups.set(record.evidenceId, [record]);
    }
  }

  return Array.from(groups.entries()).map(([evidenceId, history]) => {
    const current = currentVersion(history);
    return {
      evidenceId,
      current,
      verdict: classifyEvidence(current, now),
      older: history.filter((record) => record.version !== current.version)
    };
  });
}

function isRequirementKind(kind: string): kind is RequirementKind {
  return (RequirementKindSchema.options as readonly string[]).includes(kind);
}

/** Rebuilds the requirement from its evidence record. */
function toRequirement(record: EvidenceRecord): Requirement {
  const value = record.value;
  if (value && typeof value === 'object' && 'id' in value && 'kind' in value) {
    return value as Requirement;
  }

  return {
    id: record.key,
    kind: isRequirementKind(record.kind) ? record.kind : 'custom',
    label: record.key,
    value,
    required: true
  };
}

/** Which profile fields carry the facts that a requirement is checked against. */
function profileKeysForRequirement(requirement: Requirement): string[] {
  switch (requirement.kind) {
    case 'year':
      return ['year'];
    case 'cgpa':
      return ['cgpa'];
    case 'skills':
      return ['skills'];
    case 'document':
      return ['documents', 'hasResume', 'resumeUrl'];
    case 'link':
      return ['links', 'githubUrl', 'portfolioUrl'];
    case 'availability':
      return ['availabilityWeeks'];
    case 'projectCount':
    case 'projectTag':
      return ['projects'];
    case 'deadline':
      return [];
    default: {
      const label = `${requirement.label || ''} ${requirement.title || ''} ${
        requirement.rule || ''
      }`.toLowerCase();
      if (label.includes('income')) return ['annualIncome'];
      if (label.includes('cgpa') || label.includes('marks')) return ['cgpa'];
      return [];
    }
  }
}

/** Builds a profile out of the confirmed profile evidence only. */
function buildProfileFromEvidence(index: IndexedEvidence[]): Partial<StudentProfile> {
  const partial: Record<string, unknown> = {};

  for (const item of index) {
    if (!item.verdict.confirmed) continue;
    if (item.current.subjectType !== 'profile') continue;
    partial[item.current.key] = item.current.value;
  }

  return partial as Partial<StudentProfile>;
}

function toSupporting(record: EvidenceRecord): SupportingEvidence {
  return {
    evidenceId: record.evidenceId,
    version: record.version,
    origin: record.origin,
    trust: record.trust,
    source: record.source
  };
}

function toExcluded(record: EvidenceRecord, why: string): ExcludedEvidence {
  return { evidenceId: record.evidenceId, version: record.version, why };
}

/** The most blocking advisory reason, used when a requirement has no fact. */
function pickReasonCode(excluded: ExcludedItem[]): ReasonCode {
  if (excluded.length === 0) return 'MISSING';
  return [...excluded].sort(
    (a, b) => REASON_PRIORITY.indexOf(a.reasonCode) - REASON_PRIORITY.indexOf(b.reasonCode)
  )[0].reasonCode;
}

function pickReason(excluded: ExcludedItem[]): ExcludedItem | undefined {
  return [...excluded].sort(
    (a, b) => REASON_PRIORITY.indexOf(a.reasonCode) - REASON_PRIORITY.indexOf(b.reasonCode)
  )[0];
}

/**
 * Recomputes the eligibility decision for one opportunity from its evidence.
 * Pure: depends only on the evidence and `now`.
 */
export function evaluate(
  requirementEvidence: EvidenceRecord[],
  profileEvidence: EvidenceRecord[],
  now: Date = new Date()
): Decision {
  const requirementIndex = indexEvidence(requirementEvidence, now);
  const profileIndex = indexEvidence(profileEvidence, now);
  const profile = normalizeStudentProfile(buildProfileFromEvidence(profileIndex));

  const findings: EligibilityFinding[] = requirementIndex.map((item) => {
    const requirement = toRequirement(item.current);
    const relevantKeys = profileKeysForRequirement(requirement);
    const relevant = profileIndex.filter((entry) => relevantKeys.includes(entry.current.key));

    const supporting: SupportingEvidence[] = [];
    const excluded: ExcludedItem[] = [];

    for (const entry of relevant) {
      if (entry.verdict.confirmed) {
        supporting.push(toSupporting(entry.current));
      } else {
        excluded.push({
          record: entry.current,
          reasonCode: entry.verdict.reasonCode,
          why: entry.verdict.why
        });
      }

      for (const older of entry.older) {
        const verdict = classifyEvidence(older, now);
        excluded.push({ record: older, reasonCode: verdict.reasonCode, why: verdict.why });
      }
    }

    // An unconfirmed requirement cannot be evaluated at all: there is nothing
    // to check the profile against yet.
    if (!item.verdict.confirmed) {
      return {
        requirementId: requirement.id,
        status: 'Missing info',
        reason: item.verdict.why,
        ruleUsed: 'evidenceGate',
        nextStep: 'Confirm the opportunity requirement before it can be evaluated.',
        title: requirement.title || requirement.label,
        category: requirement.category,
        expected: requirement.rule || requirement.label,
        studentValue: 'Not available',
        reasonCode: item.verdict.reasonCode,
        supportingEvidence: [],
        excludedEvidence: [toExcluded(item.current, item.verdict.why)]
      };
    }

    const base = evaluateRequirement(requirement, profile);

    const reasonCode: ReasonCode =
      base.status === 'Match'
        ? 'SUPPORTED'
        : base.status === 'Mismatch'
          ? 'CONTRADICTED'
          : pickReasonCode(excluded);

    const advisory = base.status === 'Missing info' ? pickReason(excluded) : undefined;

    return {
      ...base,
      reason: advisory ? `${base.reason} ${advisory.why}`.trim() : base.reason,
      reasonCode,
      supportingEvidence: supporting,
      excludedEvidence: excluded.map((entry) => toExcluded(entry.record, entry.why))
    };
  });

  const result = buildResultFromFindings(findings);

  return {
    evaluatedAt: now.toISOString(),
    evidenceFingerprint: evidenceFingerprint([...requirementEvidence, ...profileEvidence]),
    findings,
    counts: result.counts,
    readiness: result.readiness as Decision['readiness'],
    nextSteps: result.nextSteps
  };
}

/**
 * Thin adapter for the legacy checklist + profile call shape: it upgrades both
 * sides to evidence and delegates the decision to evaluate().
 */
export function evaluateOpportunity(
  checklistInput: Checklist | Requirement[],
  profile: StudentProfile,
  now: Date = new Date()
): Decision {
  const requirements = toRequirements(checklistInput);
  const opportunityId = Array.isArray(checklistInput) ? 'opportunity' : checklistInput.title;

  return evaluate(
    requirementEvidenceFromRequirements(requirements, opportunityId, now),
    profileEvidenceFromProfile(profile, now),
    now
  );
}
