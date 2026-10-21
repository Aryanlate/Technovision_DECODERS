import { describe, it, expect } from 'vitest';
import {
  evaluateProfileAgainstOpportunity,
  SAMPLE_CHECKLIST,
  SAMPLE_STUDENT_PROFILE,
  SCHOLARSHIP_CHECKLIST,
  SCHOLARSHIP_STUDENT_PROFILE,
  COMPETITION_CHECKLIST,
  COMPETITION_STUDENT_PROFILE,
  IOT_INTERNSHIP_CHECKLIST,
  IOT_STUDENT_PROFILE,
  SAMPLE_OPPORTUNITIES
} from '../src/index.js';

describe('All 4 Sample Opportunities Suite', () => {
  it('contains 4 sample opportunities in registry', () => {
    expect(SAMPLE_OPPORTUNITIES.length).toBe(4);
  });

  it('evaluates Benchmark sample to 3 Match, 1 Mismatch, 2 Missing info', () => {
    const benchResult = evaluateProfileAgainstOpportunity(
      SAMPLE_CHECKLIST.requirements,
      SAMPLE_STUDENT_PROFILE,
      SAMPLE_CHECKLIST.title
    );
    expect(benchResult.counts.matches).toBe(3);
    expect(benchResult.counts.mismatches).toBe(1);
    expect(benchResult.counts.missingInfo).toBe(2);
  });

  it('evaluates Scholarship sample with marks cut-off and income limit', () => {
    const scholResult = evaluateProfileAgainstOpportunity(
      SCHOLARSHIP_CHECKLIST.requirements,
      SCHOLARSHIP_STUDENT_PROFILE,
      SCHOLARSHIP_CHECKLIST.title
    );
    expect(scholResult.counts.matches).toBeGreaterThanOrEqual(2);
    expect(scholResult.counts.mismatches).toBe(0);
  });

  it('evaluates Competition sample with team size and deadline', () => {
    const compResult = evaluateProfileAgainstOpportunity(
      COMPETITION_CHECKLIST.requirements,
      COMPETITION_STUDENT_PROFILE,
      COMPETITION_CHECKLIST.title
    );
    expect(
      compResult.findings.some(
        (f) => f.requirementId === 'req-comp-github' && f.status === 'Match'
      )
    ).toBe(true);
  });

  it('evaluates IoT Internship sample needing 1 IoT project and LinkedIn link', () => {
    const iotResult = evaluateProfileAgainstOpportunity(
      IOT_INTERNSHIP_CHECKLIST.requirements,
      IOT_STUDENT_PROFILE,
      IOT_INTERNSHIP_CHECKLIST.title
    );
    expect(
      iotResult.findings.some(
        (f) => f.requirementId === 'req-iot-skills' && f.status === 'Match'
      )
    ).toBe(true);
    expect(
      iotResult.findings.some(
        (f) => f.requirementId === 'req-iot-linkedin' && f.status === 'Match'
      )
    ).toBe(true);
    expect(
      iotResult.findings.some(
        (f) => f.requirementId === 'req-iot-availability' && f.status === 'Match'
      )
    ).toBe(true);
  });
});
