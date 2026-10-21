import { describe, it, expect } from 'vitest';
import { parseOpportunity } from '../src/lib/parser/index.js';
import { evaluateProfileAgainstOpportunity } from '../src/lib/engine/index.js';
import {
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_STUDENT_PROFILE,
  EXPECTED_SAMPLE_RESULTS
} from '../src/lib/data/sample.js';

describe('SETU 2026 OpportunityKit Benchmark Suite (PS-03)', () => {
  it('parses benchmark opportunity text into exactly 6 requirements', () => {
    const requirements = parseOpportunity(SAMPLE_OPPORTUNITY_TEXT);
    expect(requirements.length).toBe(EXPECTED_SAMPLE_RESULTS.requirementsCount);
  });

  it('evaluates benchmark profile to exactly 3 Match, 1 Mismatch, 2 Missing info', () => {
    const requirements = parseOpportunity(SAMPLE_OPPORTUNITY_TEXT);
    const result = evaluateProfileAgainstOpportunity(
      requirements,
      SAMPLE_STUDENT_PROFILE,
      'Summer Engineering Intern',
      SAMPLE_OPPORTUNITY_TEXT
    );

    // 1. Verify Specific Statuses
    const yearItem = result.checklist.find((c) => c.requirementId === 'req-year');
    expect(yearItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.year);

    const cgpaItem = result.checklist.find((c) => c.requirementId === 'req-cgpa');
    expect(cgpaItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.cgpa);

    const skillsItem = result.checklist.find((c) => c.requirementId === 'req-skills');
    expect(skillsItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.skills);
    expect(skillsItem?.reason).toContain('JavaScript');

    const resumeItem = result.checklist.find((c) => c.requirementId === 'req-resume');
    expect(resumeItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.resume);

    const linkItem = result.checklist.find((c) => c.requirementId === 'req-portfolio-github');
    expect(linkItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.portfolioOrGithub);

    const availItem = result.checklist.find((c) => c.requirementId === 'req-availability');
    expect(availItem?.status).toBe(EXPECTED_SAMPLE_RESULTS.statuses.availability);

    // 2. Verify Summary Counts & Verdict
    expect(result.summary.matches).toBe(EXPECTED_SAMPLE_RESULTS.summary.matches);
    expect(result.summary.mismatches).toBe(EXPECTED_SAMPLE_RESULTS.summary.mismatches);
    expect(result.summary.missingInfo).toBe(EXPECTED_SAMPLE_RESULTS.summary.missingInfo);
    expect(result.summary.overallVerdict).toBe('Not ready to apply yet');
  });
});
