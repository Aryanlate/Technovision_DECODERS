import { describe, it, expect } from 'vitest';
import {
  compare,
  computeReadinessScore,
  simulateWhatIf,
  buildPrioritisedNextSteps,
  bestFitProject,
  normalizeStudentProfile,
  EFFORT_ESTIMATE_TABLE,
  OPTIONAL_WEIGHT,
  REQUIRED_WEIGHT
} from '../src/lib/engine/index.js';
import {
  SAMPLE_CHECKLIST,
  SAMPLE_STUDENT_PROFILE,
  EXPECTED_SAMPLE_RESULTS
} from '../src/lib/data/sample.js';
import { Checklist, StudentProfile } from '../src/lib/types/index.js';

describe('Readiness Score formula (/lib/engine/score)', () => {
  it('scores the Master Context sample as 67% with 6 required requirements', () => {
    const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);
    const score = computeReadinessScore(SAMPLE_CHECKLIST, result.findings);

    // 3 Match (3 x 1) + 1 Mismatch (0) + 2 Missing info (2 x 0.5) = 4 of 6 points
    expect(score.earnedPoints).toBe(4);
    expect(score.totalPoints).toBe(6);
    expect(score.score).toBe(67);
    expect(score.label).toBe('Not ready yet');
    expect(score.rows).toHaveLength(6);
  });

  it('shows the per-row points: Match = full, Missing info = half, Mismatch = zero', () => {
    const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);
    const score = computeReadinessScore(SAMPLE_CHECKLIST, result.findings);

    const byId = Object.fromEntries(score.rows.map((r) => [r.requirementId, r]));

    expect(byId['req-year'].status).toBe('Match');
    expect(byId['req-year'].points).toBe(1);

    expect(byId['req-skills'].status).toBe('Mismatch');
    expect(byId['req-skills'].points).toBe(0);

    expect(byId['req-portfolio-github'].status).toBe('Missing info');
    expect(byId['req-portfolio-github'].points).toBe(0.5);

    expect(byId['req-availability'].status).toBe('Missing info');
    expect(byId['req-availability'].points).toBe(0.5);
  });

  it('weights optional requirements less than required ones', () => {
    const checklist: Checklist = {
      opportunityType: 'custom',
      title: 'Optional Weight Test',
      requirements: [
        { id: 'r-year', kind: 'year', label: 'Year of Study', value: [2, 3], required: true },
        {
          id: 'r-link',
          kind: 'link',
          label: 'Portfolio / GitHub Link',
          value: 'portfolioOrGithub',
          required: false
        }
      ],
      sources: []
    };

    const profile = normalizeStudentProfile({ name: 'Opt Student', year: 2 });
    const result = compare(checklist, profile);
    const score = computeReadinessScore(checklist, result.findings);

    // r-year: Match, required -> 1 pt of 1 ; r-link: Missing info, optional -> 0.25 of 0.5
    expect(score.rows[0].weight).toBe(REQUIRED_WEIGHT);
    expect(score.rows[1].weight).toBe(OPTIONAL_WEIGHT);
    expect(score.earnedPoints).toBe(1.25);
    expect(score.totalPoints).toBe(1.5);
    expect(score.score).toBe(83);
    expect(score.formula).toContain('earned points');
  });
});

describe('What-if simulator (/lib/engine/whatif)', () => {
  it('leaves the base sample at 3 Match, 1 Mismatch, 2 Missing info', () => {
    const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);

    expect(result.counts.matches).toBe(EXPECTED_SAMPLE_RESULTS.summary.matches); // 3
    expect(result.counts.mismatches).toBe(EXPECTED_SAMPLE_RESULTS.summary.mismatches); // 1
    expect(result.counts.missingInfo).toBe(EXPECTED_SAMPLE_RESULTS.summary.missingInfo); // 2
  });

  it('turns the sample into "Ready to apply" when the three gaps are assumed fixed', () => {
    const whatIf = simulateWhatIf(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, [
      'req-skills',
      'req-portfolio-github',
      'req-availability'
    ]);

    expect(whatIf.counts.matches).toBe(6);
    expect(whatIf.counts.mismatches).toBe(0);
    expect(whatIf.counts.missingInfo).toBe(0);
    expect(whatIf.readiness).toBe('Ready to apply');
    expect(whatIf.score.score).toBe(100);
    expect(whatIf.gapsLeft).toBe(0);
    expect(whatIf.headline).toContain('Ready to apply');
    expect(whatIf.note).toBe('What-if, not saved');
  });

  it('live-updates counts and the "N gaps left" headline for a partial what-if', () => {
    const whatIf = simulateWhatIf(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, [
      'req-portfolio-github'
    ]);

    expect(whatIf.counts.matches).toBe(4);
    expect(whatIf.counts.mismatches).toBe(1);
    expect(whatIf.counts.missingInfo).toBe(1);
    expect(whatIf.gapsLeft).toBe(2);
    expect(whatIf.headline).toBe('Only 2 gaps left');
    // 4 Match (4) + 1 Mismatch (0) + 1 Missing info (0.5) = 4.5 of 6 -> 75%
    expect(whatIf.score.score).toBe(75);
  });

  it('reports "Only 1 gap left" when exactly one gap remains', () => {
    const whatIf = simulateWhatIf(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, [
      'req-skills',
      'req-portfolio-github'
    ]);

    expect(whatIf.gapsLeft).toBe(1);
    expect(whatIf.headline).toBe('Only 1 gap left');
  });

  it('never mutates the real profile (the simulation uses a temporary copy)', () => {
    const before = JSON.stringify(SAMPLE_STUDENT_PROFILE);

    simulateWhatIf(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, [
      'req-skills',
      'req-portfolio-github',
      'req-availability'
    ]);

    expect(JSON.stringify(SAMPLE_STUDENT_PROFILE)).toBe(before);
    expect(SAMPLE_STUDENT_PROFILE.skills).toEqual(['HTML', 'CSS', 'Python']);
    expect(SAMPLE_STUDENT_PROFILE.availabilityWeeks).toBeNull();
    expect(SAMPLE_STUDENT_PROFILE.links.github).toBe('');
  });

  it('with no assumptions toggled, matches the baseline comparison', () => {
    const whatIf = simulateWhatIf(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE, []);
    const baseline = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);

    expect(whatIf.counts).toEqual(baseline.counts);
    expect(whatIf.score.score).toBe(computeReadinessScore(SAMPLE_CHECKLIST, baseline.findings).score);
  });
});

describe('Prioritised next steps (/lib/engine/nextSteps)', () => {
  it('orders by quickest fix first and labels every step as an estimate', () => {
    const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);
    const steps = buildPrioritisedNextSteps(SAMPLE_CHECKLIST, result.findings);

    expect(steps.length).toBe(3);

    // Quickest fixes (5 minutes) come before learning a skill (about 2 weeks)
    expect(steps[0].estimate).toBe('5 minutes');
    expect(steps[0].minutes).toBeLessThanOrEqual(steps[1].minutes);
    expect(steps[1].minutes).toBeLessThanOrEqual(steps[2].minutes);

    const last = steps[steps.length - 1];
    expect(last.action).toContain('Learn');
    expect(last.action).toContain('JavaScript');
    expect(last.estimate).toBe('about 2 weeks');
    expect(last.minutes).toBe(20160);
  });

  it('ships a curated effort table with the documented examples', () => {
    expect(EFFORT_ESTIMATE_TABLE['link:github'].estimate).toBe('5 minutes');
    expect(EFFORT_ESTIMATE_TABLE['skills'].estimate).toBe('about 2 weeks');
  });
});

describe('Best-fit project highlight (/lib/engine/projectFit)', () => {
  it('leads with the project that overlaps the most requested skills', () => {
    const fit = bestFitProject(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);

    expect(fit.best).not.toBeNull();
    expect(fit.best?.title).toBe('Personal Portfolio Site');
    expect(fit.best?.score).toBe(2);
    expect(fit.best?.matchedTags).toEqual(expect.arrayContaining(['HTML', 'CSS']));
    expect(fit.headline).toBe(
      'Lead with your Personal Portfolio Site project for this opportunity'
    );
    expect(fit.reason).toContain('HTML');
    expect(fit.rule.length).toBeGreaterThan(0);
  });

  it('handles a profile with no matching projects gracefully', () => {
    const profile: StudentProfile = normalizeStudentProfile({ name: 'No Projects' });
    const fit = bestFitProject(SAMPLE_CHECKLIST, profile);

    expect(fit.best).toBeNull();
    expect(fit.hasProjects).toBe(false);
    expect(fit.headline).toContain('Add a project');
  });
});
