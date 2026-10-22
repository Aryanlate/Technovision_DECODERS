import { describe, it, expect } from 'vitest';
import {
  compare,
  evaluate,
  evaluateOpportunity,
  evidenceFingerprint,
  profileEvidenceFromProfile,
  requirementEvidenceFromRequirements,
  SAMPLE_CHECKLIST,
  SAMPLE_STUDENT_PROFILE,
  createEvidence,
  confirmEvidence,
  type EvidenceRecord,
  type Requirement,
  type StudentProfile
} from '../src/index.js';

// Fixed clock so every assertion about staleness and deadlines is deterministic.
const NOW = new Date('2026-10-22T00:00:00.000Z');
const DAY_MS = 86_400_000;

const SKILLS_REQUIREMENT: Requirement = {
  id: 'req-skills',
  kind: 'skills',
  label: 'Technical Skills',
  value: ['JavaScript'],
  required: true
};

const SKILLS_REQUIREMENT_EVIDENCE = requirementEvidenceFromRequirements(
  [SKILLS_REQUIREMENT],
  'test-opportunity',
  NOW
);

function buildProfileEvidence(
  overrides: Partial<EvidenceRecord> = {},
  now: Date = NOW
): EvidenceRecord {
  return createEvidence({
    subjectType: 'profile',
    subjectId: 'student-1',
    kind: 'profile_fact',
    key: 'skills',
    value: ['JavaScript'],
    origin: 'ai_generated',
    source: { type: 'github_profile' },
    ...overrides,
    now
  });
}

describe('Dynamic eligibility evaluator (/evaluator)', () => {
  describe('Benchmark sample stays unchanged', () => {
    it('returns exactly 3 Match, 1 Mismatch, 2 Missing info with "Not ready yet"', () => {
      const decision = evaluateOpportunity(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, NOW);

      expect(decision.findings).toHaveLength(6);
      expect(decision.counts.matches).toBe(3);
      expect(decision.counts.mismatches).toBe(1);
      expect(decision.counts.missingInfo).toBe(2);
      expect(decision.readiness).toBe('Not ready yet');
      expect(decision.nextSteps[0]).toContain('[Mismatch]');
    });

    it('labels each finding with a reason code and the evidence that decided it', () => {
      const decision = evaluateOpportunity(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, NOW);
      const finding = (id: string) =>
        decision.findings.find((f) => f.requirementId === id)!;

      expect(finding('req-year').reasonCode).toBe('SUPPORTED');
      expect(finding('req-cgpa').reasonCode).toBe('SUPPORTED');
      expect(finding('req-resume').reasonCode).toBe('SUPPORTED');
      expect(finding('req-skills').reasonCode).toBe('CONTRADICTED');
      expect(finding('req-portfolio-github').reasonCode).toBe('MISSING');
      expect(finding('req-availability').reasonCode).toBe('MISSING');

      // A Match is always backed by a confirmed evidence version.
      expect(finding('req-year').supportingEvidence.length).toBeGreaterThan(0);
      expect(finding('req-year').supportingEvidence[0].version).toBe(1);

      // Nothing advisory exists in the sample, so nothing is excluded.
      expect(finding('req-availability').excludedEvidence).toHaveLength(0);
    });

    it('keeps compare() as a thin adapter over the evaluator', () => {
      const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);

      expect(result.counts.matches).toBe(3);
      expect(result.counts.mismatches).toBe(1);
      expect(result.counts.missingInfo).toBe(2);
      expect(result.counts.total).toBe(6);
      expect(result.readiness).toBe('Not ready yet');
      expect(result.findings.find((f) => f.requirementId === 'req-skills')?.reason).toContain(
        'JavaScript'
      );
    });
  });

  describe('Only a confirmed fact can decide anything', () => {
    it('degrades an AI-only skill to Missing info with UNCONFIRMED_AI', () => {
      const aiSkill = buildProfileEvidence();
      const decision = evaluate(SKILLS_REQUIREMENT_EVIDENCE, [aiSkill], NOW);
      const finding = decision.findings[0];

      expect(finding.status).toBe('Missing info');
      expect(finding.reasonCode).toBe('UNCONFIRMED_AI');
      expect(finding.supportingEvidence).toHaveLength(0);
      expect(finding.excludedEvidence).toHaveLength(1);
      expect(finding.excludedEvidence[0]).toEqual({
        evidenceId: aiSkill.evidenceId,
        version: 1,
        why: expect.stringContaining('AI suggestion')
      });
    });

    it('degrades stale evidence to Missing info with STALE', () => {
      const observedAt = new Date(NOW.getTime() - 100 * DAY_MS).toISOString();
      const staleSkill = buildProfileEvidence({
        kind: 'profile_text_analysis',
        origin: 'user_provided',
        trust: 'needs_review',
        observedAt
      });

      const decision = evaluate(SKILLS_REQUIREMENT_EVIDENCE, [staleSkill], NOW);
      const finding = decision.findings[0];

      expect(finding.status).toBe('Missing info');
      expect(finding.reasonCode).toBe('STALE');
      expect(finding.excludedEvidence[0].why).toContain('freshness window');
    });

    it('degrades conflicted evidence to Missing info with CONFLICT', () => {
      const conflicted: EvidenceRecord = { ...buildProfileEvidence(), status: 'conflicted' };

      const decision = evaluate(SKILLS_REQUIREMENT_EVIDENCE, [conflicted], NOW);
      const finding = decision.findings[0];

      expect(finding.status).toBe('Missing info');
      expect(finding.reasonCode).toBe('CONFLICT');
    });

    it('never lets an unconfirmed fact create a Mismatch', () => {
      const required: Requirement = {
        id: 'req-skills',
        kind: 'skills',
        label: 'Technical Skills',
        value: ['JavaScript', 'TypeScript'],
        required: true
      };
      const requirements = requirementEvidenceFromRequirements([required], 'test-opportunity', NOW);
      const aiSkill = buildProfileEvidence();

      const decision = evaluate(requirements, [aiSkill], NOW);
      const finding = decision.findings[0];

      expect(finding.status).toBe('Missing info');
      expect(finding.reasonCode).toBe('UNCONFIRMED_AI');
    });

    it('flips to a Match once the student confirms the AI skill', () => {
      const aiSkill = buildProfileEvidence();
      const confirmed = confirmEvidence([aiSkill], { now: NOW }).history;

      const decision = evaluate(SKILLS_REQUIREMENT_EVIDENCE, confirmed, NOW);
      const finding = decision.findings[0];

      expect(finding.status).toBe('Match');
      expect(finding.reasonCode).toBe('SUPPORTED');
      expect(finding.supportingEvidence[0].version).toBe(2);
      expect(finding.supportingEvidence[0].origin).toBe('student_confirmed');
    });
  });

  describe('evidenceFingerprint invalidates any cache', () => {
    const base = createEvidence({
      evidenceId: 'ev-skill-1',
      subjectType: 'profile',
      subjectId: 'student-1',
      kind: 'profile_fact',
      key: 'skills',
      value: ['JavaScript'],
      origin: 'student_confirmed',
      source: { type: 'student_profile' },
      now: NOW
    });

    const changed = createEvidence({
      evidenceId: 'ev-skill-1',
      subjectType: 'profile',
      subjectId: 'student-1',
      kind: 'profile_fact',
      key: 'skills',
      value: ['Python'],
      origin: 'student_confirmed',
      source: { type: 'student_profile' },
      now: NOW
    });

    it('is stable for the same evidence', () => {
      expect(evidenceFingerprint([base])).toBe(evidenceFingerprint([{ ...base }]));
    });

    it('changes when a single record changes', () => {
      expect(evidenceFingerprint([base])).not.toBe(evidenceFingerprint([changed]));
    });

    it('changes the decision fingerprint when one record changes', () => {
      const first = evaluate(SKILLS_REQUIREMENT_EVIDENCE, [base], NOW);
      const second = evaluate(SKILLS_REQUIREMENT_EVIDENCE, [changed], NOW);

      expect(first.evidenceFingerprint).not.toBe(second.evidenceFingerprint);
    });
  });

  describe('Profile rebuilding from confirmed evidence', () => {
    it('rebuilds the profile fields from student-confirmed evidence only', () => {
      const profile: StudentProfile = {
        name: 'Verified Student',
        year: 3,
        cgpa: 8.4,
        skills: ['JavaScript'],
        availabilityWeeks: 12,
        links: { github: 'https://github.com/verified', linkedin: '', instagram: '', portfolio: '' }
      };

      const requirements: Requirement[] = [
        { id: 'req-year', kind: 'year', label: 'Year', value: [2, 3], required: true },
        { id: 'req-link', kind: 'link', label: 'GitHub', value: 'github', required: true }
      ];

      const decision = evaluate(
        requirementEvidenceFromRequirements(requirements, 'test-opportunity', NOW),
        profileEvidenceFromProfile(profile, NOW),
        NOW
      );

      expect(decision.counts.matches).toBe(2);
      expect(decision.counts.missingInfo).toBe(0);
    });
  });
});
