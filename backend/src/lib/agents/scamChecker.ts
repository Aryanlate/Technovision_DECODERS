import { checkScam } from '@opportunity-kit/shared';

export interface ScamCheckResult {
  isScamSuspicious: boolean;
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  redFlags: string[];
  safeSignals: string[];
  recommendation: string;
}

/**
 * Backend wrapper around the shared, rule-based scam checker.
 *
 * The visible rules and points live in `shared/src/lib/engine/scam.ts` so the
 * frontend (Check and Discover pages) and the backend always agree. This keeps
 * the original `ScamCheckResult` shape used by the verifier agent and
 * `/api/check-scam` endpoint.
 */
export function checkOpportunityScam(text: string): ScamCheckResult {
  const result = checkScam(text);

  const redFlags = result.findings.map(
    (finding) => `${finding.label} (+${finding.points} pts): ${finding.explanation}`
  );

  const safeSignals: string[] = [];
  if (result.isClean) {
    safeSignals.push('No fee, credential, link, urgency or too-good-to-be-true warning signs found.');
  }
  if (result.findings.every((f) => f.ruleId !== 'noOfficial')) {
    safeSignals.push('An official domain or contact detail is present.');
  }

  let recommendation = 'Opportunity appears standard and legitimate. Proceed with evaluation.';
  if (result.level === 'High') {
    recommendation =
      'HIGH CAUTION: Strong scam signs detected. Do NOT pay any fee or share OTP, password or bank details.';
  } else if (result.level === 'Medium') {
    recommendation =
      'MODERATE CAUTION: Verify the organisation on its official site before proceeding.';
  }

  return {
    isScamSuspicious: result.level !== 'Low',
    riskScore: result.score,
    riskLevel: result.level.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
    redFlags,
    safeSignals,
    recommendation
  };
}
