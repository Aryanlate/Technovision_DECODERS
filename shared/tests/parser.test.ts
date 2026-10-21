import { describe, it, expect } from 'vitest';
import {
  parseOpportunity,
  parseOpportunityToChecklist,
  detectOpportunityType,
  normalizeDate,
  splitIntoSentences
} from '../src/lib/parser/index.js';
import {
  SAMPLE_OPPORTUNITY_TEXT,
  SCHOLARSHIP_SAMPLE_TEXT,
  COMPETITION_SAMPLE_TEXT,
  IOT_INTERNSHIP_SAMPLE_TEXT
} from '../src/lib/data/sample.js';

describe('OpportunityKit Rule Parser (/lib/parser)', () => {
  // ==========================================================================
  // 1. MASTER CONTEXT BENCHMARK SAMPLE OPPORTUNITY
  // ==========================================================================
  describe('Master Context Benchmark Sample', () => {
    it('produces the exact 6 expected requirements with source sentences', () => {
      const { checklist, warnings } = parseOpportunityToChecklist(SAMPLE_OPPORTUNITY_TEXT);

      // Must produce exactly 6 requirements
      expect(checklist.requirements.length).toBe(6);
      expect(checklist.opportunityType).toBe('internship');

      // 1. Year requirement
      const yearReq = checklist.requirements.find((r) => r.kind === 'year');
      expect(yearReq).toBeDefined();
      expect(yearReq?.value).toEqual([2, 3]);
      expect(yearReq?.sourceSentence).toContain('2nd or 3rd-year');

      // 2. CGPA requirement
      const cgpaReq = checklist.requirements.find((r) => r.kind === 'cgpa');
      expect(cgpaReq).toBeDefined();
      expect(cgpaReq?.value).toBe(7.5);
      expect(cgpaReq?.sourceSentence).toContain('CGPA 7.5 or above');

      // 3. Technical Skills
      const skillsReq = checklist.requirements.find((r) => r.kind === 'skills');
      expect(skillsReq).toBeDefined();
      expect(skillsReq?.value).toEqual(['HTML', 'CSS', 'JavaScript']);
      expect(skillsReq?.sourceSentence).toContain('Skills: HTML, CSS, JavaScript');

      // 4. Resume requirement
      const resumeReq = checklist.requirements.find((r) => r.kind === 'document' && r.value === 'resume');
      expect(resumeReq).toBeDefined();
      expect(resumeReq?.sourceSentence).toContain('Resume required');

      // 5. Portfolio or GitHub link
      const linkReq = checklist.requirements.find((r) => r.kind === 'link');
      expect(linkReq).toBeDefined();
      expect(linkReq?.value).toBe('portfolioOrGithub');
      expect(linkReq?.sourceSentence).toContain('Portfolio or GitHub link required');

      // 6. Availability requirement
      const availReq = checklist.requirements.find((r) => r.kind === 'availability');
      expect(availReq).toBeDefined();
      expect(availReq?.value).toBe(8);
      expect(availReq?.sourceSentence).toContain('Available for 8 weeks');

      // 0 warnings for clean benchmark sample
      expect(warnings.length).toBe(0);
    });

    it('parseOpportunity backward-compatible helper returns the 6 requirements', () => {
      const reqs = parseOpportunity(SAMPLE_OPPORTUNITY_TEXT);
      expect(reqs.length).toBe(6);
      expect(reqs.map((r) => r.kind)).toEqual([
        'year',
        'cgpa',
        'skills',
        'document',
        'link',
        'availability'
      ]);
    });
  });

  // ==========================================================================
  // 2. SCHOLARSHIP SAMPLE OPPORTUNITY
  // ==========================================================================
  describe('Scholarship Sample Opportunity', () => {
    it('detects scholarship type, marks cut-off, income limit, and documents', () => {
      const { checklist } = parseOpportunityToChecklist(SCHOLARSHIP_SAMPLE_TEXT);

      expect(checklist.opportunityType).toBe('scholarship');

      // Year
      const yearReq = checklist.requirements.find((r) => r.kind === 'year');
      expect(yearReq?.value).toEqual([2, 3]);
      expect(yearReq?.sourceSentence).toContain('2nd or 3rd-year');

      // Marks / CGPA cut-off (8.0 or 80%)
      const cgpaReq = checklist.requirements.find((r) => r.kind === 'cgpa');
      expect(cgpaReq?.value).toBe(8);

      // Income limit
      const incomeReq = checklist.requirements.find((r) => r.id === 'req-income-limit');
      expect(incomeReq).toBeDefined();
      expect(incomeReq?.value).toBe(600000);
      expect(incomeReq?.sourceSentence).toContain('Rs 6,00,000');

      // Documents (marksheet, income certificate, resume)
      const docKinds = checklist.requirements
        .filter((r) => r.kind === 'document')
        .map((r) => r.value);
      expect(docKinds).toContain('marksheet');
      expect(docKinds).toContain('incomeCertificate');
      expect(docKinds).toContain('resume');
    });
  });

  // ==========================================================================
  // 3. COMPETITION SAMPLE OPPORTUNITY
  // ==========================================================================
  describe('Competition Sample Opportunity', () => {
    it('detects competition type, team size, GitHub link, project count, and deadline', () => {
      const { checklist } = parseOpportunityToChecklist(COMPETITION_SAMPLE_TEXT);

      expect(checklist.opportunityType).toBe('competition');

      // Team size
      const teamReq = checklist.requirements.find((r) => r.id === 'req-team-size');
      expect(teamReq).toBeDefined();
      expect(teamReq?.value).toBe('2-4 members');
      expect(teamReq?.sourceSentence).toContain('2 to 4 members');

      // GitHub link
      const linkReq = checklist.requirements.find((r) => r.kind === 'link' && r.value === 'github');
      expect(linkReq).toBeDefined();
      expect(linkReq?.sourceSentence).toContain('GitHub repository link');

      // Project count
      const projReq = checklist.requirements.find((r) => r.kind === 'projectCount');
      expect(projReq?.value).toBe(1);

      // Deadline (November 15, 2026)
      const deadlineReq = checklist.requirements.find((r) => r.kind === 'deadline');
      expect(deadlineReq).toBeDefined();
      expect(deadlineReq?.value).toBe('2026-11-15');
      expect(deadlineReq?.sourceSentence).toContain('November 15, 2026');
    });
  });

  // ==========================================================================
  // 4. IOT INTERNSHIP SAMPLE OPPORTUNITY
  // ==========================================================================
  describe('IoT Internship Sample Opportunity', () => {
    it('detects duration, IoT project tag, LinkedIn link, and embedded skills', () => {
      const { checklist } = parseOpportunityToChecklist(IOT_INTERNSHIP_SAMPLE_TEXT);

      expect(checklist.opportunityType).toBe('internship');

      // Duration (12 weeks)
      const availReq = checklist.requirements.find((r) => r.kind === 'availability');
      expect(availReq?.value).toBe(12);

      // IoT Project requirement
      const tagReq = checklist.requirements.find((r) => r.kind === 'projectTag');
      expect(tagReq?.value).toBe('IoT');

      const countReq = checklist.requirements.find((r) => r.kind === 'projectCount');
      expect(countReq?.value).toBe(1);

      // LinkedIn link
      const linkReq = checklist.requirements.find((r) => r.kind === 'link' && r.value === 'linkedin');
      expect(linkReq).toBeDefined();
      expect(linkReq?.sourceSentence).toContain('LinkedIn profile link');

      // Technical skills
      const skillsReq = checklist.requirements.find((r) => r.kind === 'skills');
      expect(skillsReq?.value).toEqual(
        expect.arrayContaining(['Embedded C', 'Arduino', 'ESP32', 'MQTT', 'Sensors'])
      );
    });
  });

  // ==========================================================================
  // 5. DATE NORMALIZATION & FORMATS
  // ==========================================================================
  describe('Date Normalization (normalizeDate)', () => {
    it('normalizes "30 Nov" to 2026-11-30', () => {
      expect(normalizeDate('Deadline is 30 Nov')).toBe('2026-11-30');
    });

    it('normalizes "30/11/2026" to 2026-11-30', () => {
      expect(normalizeDate('Last date: 30/11/2026')).toBe('2026-11-30');
    });

    it('normalizes "November 15, 2026" to 2026-11-15', () => {
      expect(normalizeDate('Deadline: November 15, 2026')).toBe('2026-11-15');
    });

    it('normalizes "15 August 2026" to 2026-08-15', () => {
      expect(normalizeDate('Due date: 15 August 2026')).toBe('2026-08-15');
    });

    it('returns null for non-date strings', () => {
      expect(normalizeDate('No deadline here')).toBeNull();
    });
  });

  // ==========================================================================
  // 6. PARSE WARNINGS
  // ==========================================================================
  describe('Parse Warnings', () => {
    it('returns parse warnings for non-trivial sentences that could not be understood', () => {
      const textWithUnparsedSentence =
        '2nd-year B.Tech students only. Free lunch will be provided every Friday afternoon in the lounge cafeteria.';
      const { warnings, checklist } = parseOpportunityToChecklist(textWithUnparsedSentence);

      // Year was understood
      expect(checklist.requirements.some((r) => r.kind === 'year')).toBe(true);

      // The free lunch sentence cannot be mapped to an eligibility rule -> warning!
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('Free lunch will be provided');
    });
  });
});
