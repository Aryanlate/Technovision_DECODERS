import {
  Checklist,
  Requirement,
  StudentProfile,
  Result,
  EvaluationResult,
  EvaluationSummary
} from '../types/index.js';
import { toRequirements } from './core.js';
import { evaluateOpportunity } from '../../evaluator/evaluate.js';

// The visible rule engine primitives live in ./core.js so the evidence
// evaluator can reuse them; they stay re-exported here for every existing
// importer of `./compare.js`.
export * from './core.js';

/**
 * Comparison adapter kept for backward compatibility.
 *
 * It no longer decides anything itself: it turns the checklist into
 * opportunity-side evidence, the profile into student-confirmed evidence and
 * hands both to the dynamic evaluator, which owns the decision. The evidence
 * evaluator is the single source of truth, and it is never cached as a verdict.
 *
 * Guaranteed Invariant:
 * An empty or unknown profile field returns "Missing info", never "Mismatch".
 */
export function compare(
  checklistInput: Checklist | Requirement[],
  profile: StudentProfile
): Result {
  const decision = evaluateOpportunity(checklistInput, profile);
  return {
    findings: decision.findings,
    counts: decision.counts,
    readiness: decision.readiness,
    nextSteps: decision.nextSteps
  };
}

/**
 * Backward compatibility wrapper returning full EvaluationResult & Result
 * for existing Next.js frontend pages and Express backend routes.
 */
export function evaluateProfileAgainstOpportunity(
  requirements: Requirement[],
  profile: StudentProfile,
  opportunityTitle = 'Opportunity Evaluation',
  rawOpportunityText = '',
  agentEvidence: any[] = []
): EvaluationResult & Result {
  const result = compare(requirements, profile);

  const overallVerdict =
    result.counts.mismatches === 0 && result.counts.missingInfo === 0 && result.counts.matches > 0
      ? 'Ready to apply'
      : 'Not ready to apply yet';

  const headline =
    result.readiness === 'Ready to apply'
      ? 'All requirements satisfied. You are ready to submit your application!'
      : `${result.counts.matches} Match, ${result.counts.mismatches} Mismatch, ${result.counts.missingInfo} Missing info. Action required before applying.`;

  const summary: EvaluationSummary = {
    totalRequirements: result.counts.total ?? result.findings.length,
    matches: result.counts.matches,
    mismatches: result.counts.mismatches,
    missingInfo: result.counts.missingInfo,
    overallVerdict,
    headline,
    actionPlan: result.nextSteps
  };

  return {
    ...result,
    opportunityTitle,
    rawOpportunityText,
    timestamp: new Date().toISOString(),
    summary,
    checklist: result.findings,
    agentEvidence
  };
}
