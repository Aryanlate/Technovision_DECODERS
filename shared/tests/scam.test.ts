import { describe, it, expect } from 'vitest';
import {
  checkScam,
  SCAM_HIGH_THRESHOLD,
  SCAM_MEDIUM_THRESHOLD,
  SCAM_SAFE_NEXT_STEPS
} from '../src/lib/engine/scam.js';
import { SAMPLE_OPPORTUNITY_TEXT } from '../src/lib/data/sample.js';

/** A genuinely honest listing with a proper domain and contact email. */
const SAFE_LISTING = [
  'Summer Software Engineering Intern at Infosys.',
  'Open to 2nd or 3rd-year B.Tech/B.E. students. Minimum CGPA 7.0.',
  'Skills: HTML, CSS, JavaScript. Resume required. Available for 8 weeks.',
  'Apply at https://infosys.com/careers or email careers@infosys.com.'
].join(' ');

/** A classic fee-based fake listing. */
const FEE_SCAM_LISTING = [
  'URGENT! Work from home internship.',
  'Earn Rs 50,000 per month with no skills needed.',
  'Pay a registration fee of Rs 999 to confirm your seat.',
  'Only 5 seats left! Contact us on WhatsApp.'
].join(' ');

describe('Scam checker (/lib/engine/scam)', () => {
  it('keeps a normal, honest listing at Low risk (no false alarm)', () => {
    const result = checkScam(SAFE_LISTING);

    expect(result.level).toBe('Low');
    expect(result.score).toBe(0);
    expect(result.isClean).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(result.highlights).toHaveLength(0);
  });

  it('keeps the Master Context benchmark listing at Low risk', () => {
    const result = checkScam(SAMPLE_OPPORTUNITY_TEXT);

    expect(result.level).toBe('Low');
    expect(result.score).toBeLessThan(SCAM_MEDIUM_THRESHOLD);
    expect(result.level).not.toBe('High');
  });

  it('flags a fake fee-based listing as High with visible rule points', () => {
    const result = checkScam(FEE_SCAM_LISTING);

    expect(result.level).toBe('High');
    expect(result.score).toBeGreaterThanOrEqual(SCAM_HIGH_THRESHOLD);

    const fee = result.findings.find((f) => f.ruleId === 'fee');
    expect(fee).toBeDefined();
    expect(fee?.points).toBe(50);
    expect(fee?.explanation.length).toBeGreaterThan(0);

    // The fee amount and the too-good-to-be-true pay are both highlighted.
    expect(result.highlights.length).toBeGreaterThan(0);
  });

  it('flags a request for OTP or bank details as High', () => {
    const result = checkScam(
      'To confirm your internship offer, share your OTP and your bank account details.'
    );

    expect(result.level).toBe('High');
    expect(result.findings.some((f) => f.ruleId === 'credentials')).toBe(true);
  });

  it('flags a shortened link as Medium when nothing worse is present', () => {
    const result = checkScam(
      'Internship role for 2nd-year students. Skills: HTML, CSS. Apply here: https://bit.ly/apply-now'
    );

    expect(result.level).toBe('Medium');
    expect(result.findings.some((f) => f.ruleId === 'link')).toBe(true);
    expect(result.findings.some((f) => f.ruleId === 'fee')).toBe(false);
  });

  it('never marks a listing High without a concrete reason', () => {
    const result = checkScam(SAFE_LISTING);

    expect(result.level).not.toBe('High');
    expect(result.score).toBe(0);
    expect(result.findings.some((f) => f.severity === 'danger')).toBe(false);
  });

  it('highlights warning signs by exact position inside the original text', () => {
    const result = checkScam(FEE_SCAM_LISTING);

    expect(result.highlights.length).toBeGreaterThan(0);
    for (const highlight of result.highlights) {
      expect(FEE_SCAM_LISTING.slice(highlight.start, highlight.end)).toBe(highlight.text);
    }
  });

  it('always returns the safe next steps', () => {
    const result = checkScam(FEE_SCAM_LISTING);

    expect(result.safeNextSteps).toBe(SCAM_SAFE_NEXT_STEPS);
    expect(result.safeNextSteps.join(' ')).toContain("official website");
    expect(result.safeNextSteps.join(' ')).toContain('Never share an OTP');
    expect(result.safeNextSteps.join(' ')).toContain('Never pay a fee');
  });

  it('does not add the "no official domain" penalty when a source URL is supplied', () => {
    const withoutSource = checkScam('Software intern. Open to 2nd-year B.Tech students.');
    const withSource = checkScam('Software intern. Open to 2nd-year B.Tech students.', {
      sourceUrl: 'https://infosys.com/careers'
    });

    expect(withoutSource.findings.some((f) => f.ruleId === 'noOfficial')).toBe(true);
    expect(withSource.findings.some((f) => f.ruleId === 'noOfficial')).toBe(false);
    expect(withSource.level).toBe('Low');
  });

  it('handles empty input with a clear message instead of throwing', () => {
    const result = checkScam('   ');

    expect(result.level).toBe('Low');
    expect(result.isClean).toBe(true);
    expect(result.summary).toContain('Nothing to check');
  });
});
