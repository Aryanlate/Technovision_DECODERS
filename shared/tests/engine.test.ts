import { describe, it, expect } from 'vitest';
import {
  compare,
  evaluateRequirement,
  numberRule,
  rangeRule,
  listRule,
  documentRule,
  linkRule,
  countRule,
  tagRule,
  proofRule,
  availabilityRule,
  deadlineRule,
  canonicalizeSkill,
  isValidUrl
} from '../src/lib/engine/index.js';
import {
  SAMPLE_CHECKLIST,
  SAMPLE_STUDENT_PROFILE,
  EXPECTED_SAMPLE_RESULTS,
  SCHOLARSHIP_CHECKLIST,
  SCHOLARSHIP_STUDENT_PROFILE,
  COMPETITION_CHECKLIST,
  COMPETITION_STUDENT_PROFILE,
  IOT_INTERNSHIP_CHECKLIST,
  IOT_STUDENT_PROFILE
} from '../src/lib/data/sample.js';
import { StudentProfile, Requirement } from '../src/lib/types/index.js';

describe('OpportunityKit Comparison Engine (/lib/engine)', () => {
  // ==========================================================================
  // 1. MASTER CONTEXT BENCHMARK SAMPLE
  // ==========================================================================
  describe('Master Context Benchmark Sample', () => {
    it('produces exactly 3 Match, 1 Mismatch, 2 Missing info and "Not ready yet" readiness', () => {
      const result = compare(SAMPLE_CHECKLIST, SAMPLE_STUDENT_PROFILE);

      // Verify overall counts
      expect(result.counts.total).toBe(6);
      expect(result.counts.matches).toBe(EXPECTED_SAMPLE_RESULTS.summary.matches); // 3
      expect(result.counts.mismatches).toBe(EXPECTED_SAMPLE_RESULTS.summary.mismatches); // 1
      expect(result.counts.missingInfo).toBe(EXPECTED_SAMPLE_RESULTS.summary.missingInfo); // 2
      expect(result.readiness).toBe('Not ready yet');

      // Verify individual requirement findings
      const yearFinding = result.findings.find((f) => f.requirementId === 'req-year');
      expect(yearFinding?.status).toBe('Match');
      expect(yearFinding?.ruleUsed).toBe('rangeRule');

      const cgpaFinding = result.findings.find((f) => f.requirementId === 'req-cgpa');
      expect(cgpaFinding?.status).toBe('Match');
      expect(cgpaFinding?.ruleUsed).toBe('numberRule');

      const skillsFinding = result.findings.find((f) => f.requirementId === 'req-skills');
      expect(skillsFinding?.status).toBe('Mismatch');
      expect(skillsFinding?.ruleUsed).toBe('listRule');
      expect(skillsFinding?.reason).toContain('JavaScript'); // MUST name missing skill

      const resumeFinding = result.findings.find((f) => f.requirementId === 'req-resume');
      expect(resumeFinding?.status).toBe('Match');
      expect(resumeFinding?.ruleUsed).toBe('documentRule');

      const linkFinding = result.findings.find((f) => f.requirementId === 'req-portfolio-github');
      expect(linkFinding?.status).toBe('Missing info');
      expect(linkFinding?.ruleUsed).toBe('linkRule');

      const availFinding = result.findings.find((f) => f.requirementId === 'req-availability');
      expect(availFinding?.status).toBe('Missing info');
      expect(availFinding?.ruleUsed).toBe('availabilityRule');

      // Ordered next steps verification:
      // Mismatches must come before Missing info
      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.nextSteps[0]).toContain('[Mismatch]');
      expect(result.nextSteps.some((s) => s.includes('[Missing info]'))).toBe(true);
    });
  });

  // ==========================================================================
  // 2. EMPTY PROFILE INVARIANT
  // "Unknown" must never be treated as "fails": empty profile returns Missing info
  // ==========================================================================
  describe('Empty Profile Handling', () => {
    const emptyProfile: StudentProfile = {
      name: 'Blank Student',
      year: undefined,
      branch: '',
      cgpa: undefined,
      skills: [],
      documents: [],
      availabilityWeeks: null,
      links: {
        github: '',
        linkedin: '',
        instagram: '',
        portfolio: ''
      },
      projects: [],
      hasResume: null,
      resumeUrl: '',
      githubUrl: '',
      portfolioUrl: ''
    };

    it('returns "Missing info" for all requirements on an empty profile, never "Mismatch"', () => {
      const result = compare(SAMPLE_CHECKLIST, emptyProfile);

      // Invariant: empty fields must NEVER return Mismatch!
      expect(result.counts.mismatches).toBe(0);
      expect(result.counts.matches).toBe(0);
      expect(result.counts.missingInfo).toBe(6);

      result.findings.forEach((finding) => {
        expect(finding.status).toBe('Missing info');
        expect(finding.nextStep).toBeTruthy();
      });

      // Readiness for 0 mismatches with missing info is "Almost ready"
      expect(result.readiness).toBe('Almost ready');
    });
  });

  // ==========================================================================
  // 3. SKILL ALIASES & CASE-INSENSITIVITY
  // ==========================================================================
  describe('Skill Matching & Aliases (JS = JavaScript, Node = Node.js)', () => {
    it('recognizes JS as JavaScript', () => {
      const reqSkills = ['JavaScript', 'HTML', 'CSS'];
      const studentSkills = ['JS', 'html', 'Css'];
      const res = listRule(studentSkills, reqSkills);

      expect(res.status).toBe('Match');
      expect(res.ruleUsed).toBe('listRule');
    });

    it('recognizes Node and node.js as Node.js / nodejs', () => {
      const reqSkills = ['Node.js', 'TypeScript'];
      const studentSkills = ['Node', 'ts'];
      const res = listRule(studentSkills, reqSkills);

      expect(res.status).toBe('Match');
    });

    it('recognizes Python = Py, Golang = Go, CPP = C++', () => {
      expect(canonicalizeSkill('Py')).toBe('python');
      expect(canonicalizeSkill('python')).toBe('python');
      expect(canonicalizeSkill('golang')).toBe('go');
      expect(canonicalizeSkill('Go')).toBe('go');
      expect(canonicalizeSkill('c++')).toBe('c++');
      expect(canonicalizeSkill('CPP')).toBe('c++');
    });

    it('names the exact missing skills in the reason when a mismatch occurs', () => {
      const reqSkills = ['React', 'Docker', 'Kubernetes'];
      const studentSkills = ['React'];
      const res = listRule(studentSkills, reqSkills);

      expect(res.status).toBe('Mismatch');
      expect(res.reason).toContain('Docker');
      expect(res.reason).toContain('Kubernetes');
    });
  });

  // ==========================================================================
  // 4. EITHER / OR LINKS ("GitHub or Portfolio")
  // ==========================================================================
  describe('Either/Or Links (linkRule)', () => {
    it('is satisfied when only GitHub link is provided', () => {
      const res = linkRule(
        { github: 'https://github.com/alexsharma', linkedin: '', instagram: '', portfolio: '' },
        'portfolioOrGithub'
      );
      expect(res.status).toBe('Match');
      expect(res.reason).toContain('GitHub');
    });

    it('is satisfied when only Portfolio link is provided', () => {
      const res = linkRule(
        { github: '', linkedin: '', instagram: '', portfolio: 'https://alex.design' },
        'portfolioOrGithub'
      );
      expect(res.status).toBe('Match');
      expect(res.reason).toContain('Portfolio');
    });

    it('is satisfied when both GitHub and Portfolio links are provided', () => {
      const res = linkRule(
        {
          github: 'https://github.com/alexsharma',
          linkedin: '',
          instagram: '',
          portfolio: 'https://alex.design'
        },
        'portfolioOrGithub'
      );
      expect(res.status).toBe('Match');
      expect(res.reason).toContain('GitHub & Portfolio');
    });

    it('returns "Missing info" when neither link is provided', () => {
      const res = linkRule({ github: '', linkedin: '', instagram: '', portfolio: '' }, 'portfolioOrGithub');
      expect(res.status).toBe('Missing info');
    });

    it('returns "Mismatch" if a provided link is an invalid format and no other valid link exists', () => {
      const res = linkRule(
        { github: 'not-a-valid-url-format', linkedin: '', instagram: '', portfolio: '' },
        'portfolioOrGithub'
      );
      expect(res.status).toBe('Mismatch');
      expect(res.reason).toContain('not a valid URL');
    });
  });

  // ==========================================================================
  // 5. INDIVIDUAL VISIBLE RULES
  // ==========================================================================
  describe('numberRule (CGPA minimum, marks cut-off, income maximum)', () => {
    it('evaluates minimum CGPA threshold', () => {
      expect(numberRule(8.2, 7.5, 'min', 'CGPA').status).toBe('Match');
      expect(numberRule(7.0, 7.5, 'min', 'CGPA').status).toBe('Mismatch');
    });

    it('evaluates maximum income threshold', () => {
      expect(numberRule(450000, 600000, 'max', 'Family Annual Income').status).toBe('Match');
      expect(numberRule(600000, 600000, 'max', 'Family Annual Income').status).toBe('Match');
      expect(numberRule(750000, 600000, 'max', 'Family Annual Income').status).toBe('Mismatch');
    });

    it('returns Missing info for null, undefined, or NaN', () => {
      expect(numberRule(null, 7.5, 'min', 'CGPA').status).toBe('Missing info');
      expect(numberRule(undefined, 7.5, 'min', 'CGPA').status).toBe('Missing info');
      expect(numberRule(NaN, 7.5, 'min', 'CGPA').status).toBe('Missing info');
    });
  });

  describe('rangeRule (Year of study within allowed years)', () => {
    it('matches allowed years', () => {
      expect(rangeRule(2, [2, 3]).status).toBe('Match');
      expect(rangeRule(3, [2, 3]).status).toBe('Match');
    });

    it('mismatches outside years', () => {
      expect(rangeRule(1, [2, 3]).status).toBe('Mismatch');
      expect(rangeRule(4, [2, 3]).status).toBe('Mismatch');
    });

    it('returns Missing info for unknown year', () => {
      expect(rangeRule(undefined, [2, 3]).status).toBe('Missing info');
      expect(rangeRule(null, [2, 3]).status).toBe('Missing info');
    });
  });

  describe('documentRule (Resume, Marksheet, Income Certificate)', () => {
    it('matches when document is in documents array', () => {
      const docs = [
        { name: 'Semester_Marksheet.pdf', type: 'marksheet', url: 'https://ex.com/m.pdf' },
        { name: 'Income_Certificate.pdf', type: 'incomeCertificate', url: 'https://ex.com/i.pdf' }
      ];
      expect(documentRule(docs, 'marksheet').status).toBe('Match');
      expect(documentRule(docs, 'incomeCertificate').status).toBe('Match');
    });

    it('returns Missing info if document is not attached', () => {
      const docs = [{ name: 'Resume.pdf', type: 'resume' }];
      expect(documentRule(docs, 'incomeCertificate').status).toBe('Missing info');
    });

    it('handles explicit false flag for resume as Mismatch', () => {
      expect(documentRule([], 'resume', false).status).toBe('Mismatch');
    });
  });

  describe('countRule & tagRule (Project counting & tag verification)', () => {
    const projects = [
      {
        id: 'p1',
        title: 'Smart IoT Greenhouse',
        domains: ['IoT', 'Embedded Systems'],
        tech: ['ESP32', 'C++'],
        role: 'Firmware Engineer',
        status: 'completed',
        proofLink: 'https://github.com/student/iot-greenhouse'
      }
    ];

    it('evaluates project count matching requirement', () => {
      expect(countRule(projects, 1).status).toBe('Match');
      expect(countRule(projects, 2).status).toBe('Mismatch');
      expect(countRule([], 1).status).toBe('Missing info');
      expect(countRule(null, 1).status).toBe('Missing info');
    });

    it('evaluates project domain/technology tag', () => {
      expect(tagRule(projects, 'IoT').status).toBe('Match');
      expect(tagRule(projects, 'Embedded Systems').status).toBe('Match');
      expect(tagRule(projects, 'ESP32').status).toBe('Match');
      expect(tagRule(projects, 'Blockchain').status).toBe('Missing info');
    });
  });

  describe('proofRule (Project proof link required)', () => {
    it('matches when valid proofLink is present', () => {
      const proj = {
        id: 'p1',
        title: 'Campus Portal',
        domains: ['Web'],
        tech: ['Next.js'],
        role: 'Developer',
        status: 'completed',
        proofLink: 'https://github.com/student/campus-portal'
      };
      expect(proofRule(proj).status).toBe('Match');
    });

    it('mismatches when proofLink is empty or invalid', () => {
      const unlinkedProj = {
        id: 'p2',
        title: 'Unlinked Project',
        domains: ['Web'],
        tech: ['React'],
        role: 'Developer',
        status: 'completed',
        proofLink: ''
      };
      expect(proofRule(unlinkedProj).status).toBe('Mismatch');

      const invalidProj = { ...unlinkedProj, proofLink: 'invalid url' };
      expect(proofRule(invalidProj).status).toBe('Mismatch');
    });
  });

  describe('availabilityRule & deadlineRule', () => {
    it('evaluates availability in weeks', () => {
      expect(availabilityRule(8, 8).status).toBe('Match');
      expect(availabilityRule(12, 8).status).toBe('Match');
      expect(availabilityRule(4, 8).status).toBe('Mismatch');
      expect(availabilityRule(null, 8).status).toBe('Missing info');
    });

    it('evaluates deadline comparison', () => {
      const now = new Date('2026-10-17T12:00:00Z');
      expect(deadlineRule('2026-11-15', now).status).toBe('Match');
      expect(deadlineRule('2026-09-01', now).status).toBe('Mismatch');
      expect(deadlineRule(null, now).status).toBe('Missing info');
    });
  });

  // ==========================================================================
  // 6. WRONG INPUT & EDGE CASES
  // ==========================================================================
  describe('Wrong Input & Edge Cases', () => {
    it('handles negative numbers or invalid values gracefully without throwing', () => {
      expect(numberRule(-5, 0, 'min').status).toBe('Mismatch');
      expect(rangeRule(-1, [1, 2]).status).toBe('Mismatch');
      expect(availabilityRule(-10, 8).status).toBe('Mismatch');
    });

    it('validates URLs safely with isValidUrl', () => {
      expect(isValidUrl('https://github.com/alex')).toBe(true);
      expect(isValidUrl('http://mysite.org')).toBe(true);
      expect(isValidUrl('alex.dev')).toBe(true);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not an url with spaces')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });

    it('handles custom requirements safely without throwing', () => {
      const customReq: Requirement = {
        id: 'req-custom-99',
        kind: 'custom',
        label: 'Must have clean code habits',
        value: 'clean code',
        required: true
      };
      const finding = evaluateRequirement(customReq, SAMPLE_STUDENT_PROFILE);
      expect(finding.status).toBe('Missing info');
      expect(finding.nextStep).toBeTruthy();
    });
  });

  // ==========================================================================
  // 7. ADDITIONAL SAMPLE OPPORTUNITIES VERIFICATION
  // ==========================================================================
  describe('Additional Sample Opportunities Evaluation', () => {
    it('evaluates Scholarship opportunity with cut-off and income limit', () => {
      const result = compare(SCHOLARSHIP_CHECKLIST, SCHOLARSHIP_STUDENT_PROFILE);
      expect(result.counts.matches).toBeGreaterThanOrEqual(4);
      expect(result.counts.mismatches).toBe(0);
      expect(result.readiness).toBe('Almost ready'); // income limit pending team/officer verification
    });

    it('evaluates Competition opportunity with team size and deadline', () => {
      const result = compare(COMPETITION_CHECKLIST, COMPETITION_STUDENT_PROFILE);
      expect(result.findings.find((f) => f.requirementId === 'req-comp-github')?.status).toBe('Match');
      expect(result.findings.find((f) => f.requirementId === 'req-comp-deadline')?.status).toBe('Match');
      expect(result.counts.mismatches).toBe(0);
    });

    it('evaluates IoT Internship needing 1 IoT project and LinkedIn link', () => {
      const result = compare(IOT_INTERNSHIP_CHECKLIST, IOT_STUDENT_PROFILE);
      expect(result.findings.find((f) => f.requirementId === 'req-iot-linkedin')?.status).toBe('Match');
      expect(result.findings.find((f) => f.requirementId === 'req-iot-skills')?.status).toBe('Match');
      expect(result.findings.find((f) => f.requirementId === 'req-iot-availability')?.status).toBe('Match');
    });
  });
});
