"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStudentProfile = normalizeStudentProfile;
exports.evaluateRequirement = evaluateRequirement;
exports.toRequirements = toRequirements;
exports.compare = compare;
exports.deriveReadiness = deriveReadiness;
exports.buildNextSteps = buildNextSteps;
exports.buildResultFromFindings = buildResultFromFindings;
exports.evaluateProfileAgainstOpportunity = evaluateProfileAgainstOpportunity;
const rules_js_1 = require("./rules.js");
/**
 * Normalizes a student profile to ensure all modern and legacy properties
 * are readily accessible.
 */
function normalizeStudentProfile(profile) {
    const year = profile.year ?? profile.yearOfStudy ?? null;
    const branch = profile.branch ?? profile.degree ?? 'Engineering';
    const cgpa = profile.cgpa ?? null;
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const documents = Array.isArray(profile.documents) ? profile.documents : [];
    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    const availabilityWeeks = profile.availabilityWeeks !== undefined ? profile.availabilityWeeks : null;
    const links = {
        github: profile.links?.github ?? profile.githubUrl ?? '',
        linkedin: profile.links?.linkedin ?? '',
        instagram: profile.links?.instagram ?? '',
        portfolio: profile.links?.portfolio ?? profile.portfolioUrl ?? ''
    };
    const hasResume = profile.hasResume !== undefined
        ? profile.hasResume
        : documents.some((d) => d.type.toLowerCase().includes('resume')) ||
            Boolean(profile.resumeUrl);
    return {
        ...profile,
        name: profile.name || 'Student',
        year,
        yearOfStudy: year ?? undefined,
        branch,
        degree: branch,
        cgpa,
        skills,
        documents,
        availabilityWeeks,
        links,
        projects,
        hasResume,
        resumeUrl: profile.resumeUrl ||
            documents.find((d) => d.type.toLowerCase().includes('resume'))?.url ||
            '',
        githubUrl: links.github,
        portfolioUrl: links.portfolio,
        plan: profile.plan || 'free',
        monthlyChecksUsed: profile.monthlyChecksUsed !== undefined ? profile.monthlyChecksUsed : 3,
        monthlyChecksLimit: profile.monthlyChecksLimit !== undefined ? profile.monthlyChecksLimit : 5
    };
}
/**
 * Evaluates a single requirement against a normalized student profile
 * using visible, deterministic pure TypeScript rules.
 */
function evaluateRequirement(req, profile) {
    const norm = normalizeStudentProfile(profile);
    let ruleRes;
    // 1. Dispatch based on Requirement Kind
    switch (req.kind) {
        case 'year': {
            const allowed = Array.isArray(req.value)
                ? req.value
                : req.parsedRule?.allowedYears || [2, 3];
            ruleRes = (0, rules_js_1.rangeRule)(norm.year, allowed, 'Year of study');
            break;
        }
        case 'cgpa': {
            const minCgpa = typeof req.value === 'number'
                ? req.value
                : req.parsedRule?.minCgpa ?? 7.5;
            ruleRes = (0, rules_js_1.numberRule)(norm.cgpa, minCgpa, 'min', 'CGPA');
            break;
        }
        case 'skills': {
            const required = Array.isArray(req.value)
                ? req.value
                : req.parsedRule?.requiredSkills || [];
            ruleRes = (0, rules_js_1.listRule)(norm.skills, required);
            break;
        }
        case 'document': {
            const docType = typeof req.value === 'string' ? req.value : 'resume';
            ruleRes = (0, rules_js_1.documentRule)(norm.documents, docType, norm.hasResume, norm.resumeUrl);
            break;
        }
        case 'link': {
            const linkTarget = typeof req.value === 'string' ? req.value : 'portfolioOrGithub';
            ruleRes = (0, rules_js_1.linkRule)(norm.links, linkTarget, {
                githubUrl: norm.githubUrl,
                portfolioUrl: norm.portfolioUrl
            });
            break;
        }
        case 'availability': {
            const weeks = typeof req.value === 'number'
                ? req.value
                : req.parsedRule?.minAvailabilityWeeks || 8;
            ruleRes = (0, rules_js_1.availabilityRule)(norm.availabilityWeeks, weeks);
            break;
        }
        case 'projectCount': {
            const count = typeof req.value === 'number' ? req.value : 1;
            ruleRes = (0, rules_js_1.countRule)(norm.projects, count);
            break;
        }
        case 'projectTag': {
            const tag = typeof req.value === 'string' ? req.value : 'IoT';
            ruleRes = (0, rules_js_1.tagRule)(norm.projects, tag);
            break;
        }
        case 'deadline': {
            ruleRes = (0, rules_js_1.deadlineRule)(req.value);
            break;
        }
        case 'custom':
        default: {
            // Fallback heuristics for custom rules:
            const labelLower = (req.label || req.title || req.rule || '').toLowerCase();
            if (labelLower.includes('income')) {
                // Income maximum rule (e.g. 600,000)
                // If income is not in profile, strict rule returns Missing info!
                const profileIncome = norm.annualIncome ?? null;
                ruleRes = (0, rules_js_1.numberRule)(profileIncome, 600000, 'max', 'Family Annual Income');
            }
            else if (labelLower.includes('cgpa') || labelLower.includes('marks')) {
                const minVal = typeof req.value === 'number' ? req.value : 8.0;
                ruleRes = (0, rules_js_1.numberRule)(norm.cgpa, minVal, 'min', 'Marks Cut-off');
            }
            else if (labelLower.includes('team') || labelLower.includes('size')) {
                // Team size requirement (event parameter, unknown in individual student profile)
                ruleRes = {
                    status: 'Missing info',
                    reason: 'Team size confirmation needed for submission.',
                    ruleUsed: 'customRule:TeamSize',
                    nextStep: 'Confirm team members (2-4 students) before project submission.',
                    expected: String(req.value || '2-4 members'),
                    studentValue: 'Pending team formation'
                };
            }
            else {
                // Strict invariant: "Unknown" is never treated as "fails":
                // if the profile has no answer, the status is Missing info!
                ruleRes = {
                    status: 'Missing info',
                    reason: `No matching profile evidence found for: "${req.label || req.rule || req.id}".`,
                    ruleUsed: 'customRule:Generic',
                    nextStep: 'Check whether your profile or documents demonstrate this requirement.',
                    expected: req.rule || req.label,
                    studentValue: 'Not provided'
                };
            }
            break;
        }
    }
    return {
        requirementId: req.id,
        status: ruleRes.status,
        reason: ruleRes.reason,
        ruleUsed: ruleRes.ruleUsed,
        nextStep: ruleRes.nextStep || '',
        title: req.title || req.label,
        category: req.category,
        expected: ruleRes.expected || req.rule || req.label,
        studentValue: ruleRes.studentValue || 'Not provided'
    };
}
/**
 * Accepts either a full Checklist or a bare Requirement array and returns the
 * requirement list. Shared by the comparison engine, the score and the what-if
 * simulator so they all operate on exactly the same requirements.
 */
function toRequirements(checklistInput) {
    return Array.isArray(checklistInput) ? checklistInput : checklistInput.requirements;
}
/**
 * Pure TypeScript comparison engine with no AI and no network calls.
 * Evaluates an opportunity checklist against a student profile.
 *
 * Guaranteed Invariant:
 * An empty or unknown profile field returns "Missing info", never "Mismatch".
 */
function compare(checklistInput, profile) {
    const requirements = toRequirements(checklistInput);
    const findings = requirements.map((req) => evaluateRequirement(req, profile));
    return buildResultFromFindings(findings);
}
/**
 * Readiness label rule, kept in one place so the comparison engine and the
 * What-if simulator can never disagree:
 * - Ready to apply: 0 mismatches, 0 missing info, at least 1 match
 * - Almost ready: 0 mismatches, but some missing info (profile needs details)
 * - Not ready yet: 1 or more mismatches (blockers exist)
 */
function deriveReadiness(counts) {
    if (counts.mismatches === 0 && counts.missingInfo === 0 && counts.matches > 0) {
        return 'Ready to apply';
    }
    if (counts.mismatches === 0 && counts.missingInfo > 0) {
        return 'Almost ready';
    }
    return 'Not ready yet';
}
/**
 * Ordered next steps:
 * 1. Mismatches first (critical blockers)
 * 2. Missing info second (information or documents needed)
 */
function buildNextSteps(findings) {
    const nextSteps = [];
    findings
        .filter((f) => f.status === 'Mismatch' && f.nextStep)
        .forEach((f) => {
        nextSteps.push(`[Mismatch] ${f.title || f.requirementId}: ${f.nextStep}`);
    });
    findings
        .filter((f) => f.status === 'Missing info' && f.nextStep)
        .forEach((f) => {
        nextSteps.push(`[Missing info] ${f.title || f.requirementId}: ${f.nextStep}`);
    });
    return nextSteps;
}
/**
 * Single source of truth: turns findings into counts, readiness and next steps.
 * Used by compare() and by the What-if simulator so both stay consistent.
 */
function buildResultFromFindings(findings) {
    const counts = {
        matches: findings.filter((f) => f.status === 'Match').length,
        mismatches: findings.filter((f) => f.status === 'Mismatch').length,
        missingInfo: findings.filter((f) => f.status === 'Missing info').length,
        total: findings.length
    };
    return {
        findings,
        counts,
        readiness: deriveReadiness(counts),
        nextSteps: buildNextSteps(findings)
    };
}
/**
 * Backward compatibility wrapper returning full EvaluationResult & Result
 * for existing Next.js frontend pages and Express backend routes.
 */
function evaluateProfileAgainstOpportunity(requirements, profile, opportunityTitle = 'Opportunity Evaluation', rawOpportunityText = '', agentEvidence = []) {
    const result = compare(requirements, profile);
    const overallVerdict = result.counts.mismatches === 0 && result.counts.missingInfo === 0 && result.counts.matches > 0
        ? 'Ready to apply'
        : 'Not ready to apply yet';
    const headline = result.readiness === 'Ready to apply'
        ? 'All requirements satisfied. You are ready to submit your application!'
        : `${result.counts.matches} Match, ${result.counts.mismatches} Mismatch, ${result.counts.missingInfo} Missing info. Action required before applying.`;
    const summary = {
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
//# sourceMappingURL=compare.js.map