"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateWhatIf = simulateWhatIf;
const compare_js_1 = require("./compare.js");
const score_js_1 = require("./score.js");
const WHAT_IF_NOTE = 'What-if, not saved';
/**
 * Deep copy of a profile so a simulation can never mutate the real profile.
 */
function cloneProfile(profile) {
    return {
        ...profile,
        skills: [...(profile.skills || [])],
        documents: (profile.documents || []).map((d) => ({ ...d })),
        projects: (profile.projects || []).map((p) => ({
            ...p,
            domains: [...(p.domains || [])],
            tech: [...(p.tech || [])],
            techStack: p.techStack ? [...p.techStack] : undefined
        })),
        links: { ...(profile.links || { github: '', linkedin: '', instagram: '', portfolio: '' }) }
    };
}
/**
 * Returns a NEW profile copy in which the given requirement is assumed to be
 * satisfied. The input profile is never touched.
 */
function satisfyRequirement(req, profile) {
    const next = cloneProfile(profile);
    switch (req.kind) {
        case 'year': {
            const allowed = Array.isArray(req.value)
                ? req.value
                : req.parsedRule?.allowedYears || [2, 3];
            if (typeof next.year !== 'number' || !allowed.includes(next.year)) {
                next.year = allowed[0] ?? next.year;
                next.yearOfStudy = next.year ?? undefined;
            }
            break;
        }
        case 'cgpa': {
            const minVal = typeof req.value === 'number' ? req.value : req.parsedRule?.minCgpa ?? 7.5;
            if (typeof next.cgpa !== 'number' || next.cgpa < minVal) {
                next.cgpa = minVal;
            }
            break;
        }
        case 'skills': {
            const required = Array.isArray(req.value)
                ? req.value
                : req.parsedRule?.requiredSkills || [];
            next.skills = Array.from(new Set([...(next.skills || []), ...required]));
            break;
        }
        case 'document': {
            const docType = typeof req.value === 'string' ? req.value : 'resume';
            const docs = [...(next.documents || [])];
            if (!docs.some((d) => d.type.toLowerCase().includes(docType.toLowerCase()))) {
                docs.push({
                    id: `whatif-${req.id}`,
                    name: `${docType}.pdf`,
                    type: docType,
                    url: 'https://example.com/what-if/document.pdf',
                    verified: true
                });
            }
            next.documents = docs;
            if (docType.toLowerCase().includes('resume')) {
                next.hasResume = true;
                next.resumeUrl = next.resumeUrl || 'https://example.com/what-if/resume.pdf';
            }
            break;
        }
        case 'link': {
            const target = String(typeof req.value === 'string' ? req.value : 'portfolioOrGithub')
                .toLowerCase()
                .replace(/[\s\-_]/g, '');
            const links = {
                ...(next.links || { github: '', linkedin: '', instagram: '', portfolio: '' })
            };
            const githubUrl = 'https://github.com/what-if-user';
            const portfolioUrl = 'https://what-if.example.com';
            if (target.includes('linkedin')) {
                links.linkedin = 'https://linkedin.com/in/what-if-user';
            }
            else if (target.includes('instagram')) {
                links.instagram = 'https://instagram.com/what-if-user';
            }
            else if (target.includes('githuborportfolio') || target.includes('portfolioorgithub')) {
                // Either link satisfies the requirement.
                links.github = githubUrl;
                next.githubUrl = githubUrl;
            }
            else if (target.includes('portfolio')) {
                links.portfolio = portfolioUrl;
                next.portfolioUrl = portfolioUrl;
            }
            else {
                links.github = githubUrl;
                next.githubUrl = githubUrl;
            }
            next.links = links;
            break;
        }
        case 'availability': {
            const weeks = typeof req.value === 'number' ? req.value : req.parsedRule?.minAvailabilityWeeks || 8;
            next.availabilityWeeks = weeks;
            break;
        }
        case 'projectCount': {
            const needed = typeof req.value === 'number' ? req.value : 1;
            const projects = [...(next.projects || [])];
            while (projects.length < needed) {
                projects.push({
                    id: `whatif-project-${projects.length + 1}`,
                    title: `What-if project ${projects.length + 1}`,
                    domains: [],
                    tech: [],
                    role: 'Contributor',
                    status: 'completed',
                    proofLink: 'https://example.com/what-if/project'
                });
            }
            next.projects = projects;
            break;
        }
        case 'projectTag': {
            const tag = typeof req.value === 'string' ? req.value : 'IoT';
            const projects = [...(next.projects || [])];
            projects.push({
                id: `whatif-tag-project`,
                title: `What-if ${tag} project`,
                domains: [tag],
                tech: [tag],
                role: 'Contributor',
                status: 'completed',
                proofLink: 'https://example.com/what-if/project'
            });
            next.projects = projects;
            break;
        }
        case 'custom':
        default: {
            const label = (req.label || req.title || '').toLowerCase();
            if (label.includes('income')) {
                next.annualIncome = 450000;
            }
            else {
                const docs = [...(next.documents || [])];
                docs.push({
                    id: `whatif-custom-${req.id}`,
                    name: `${req.label || 'Evidence'}.pdf`,
                    type: req.id,
                    verified: true
                });
                next.documents = docs;
            }
            break;
        }
    }
    return next;
}
/**
 * Re-runs the pure comparison engine against a temporary copy of the profile
 * in which every toggled requirement is assumed fixed.
 *
 * The real profile is never modified and nothing is persisted here.
 */
function simulateWhatIf(checklistInput, profile, assumedRequirementIds) {
    const requirements = (0, compare_js_1.toRequirements)(checklistInput);
    const assumed = new Set(assumedRequirementIds);
    let temp = cloneProfile(profile);
    for (const req of requirements) {
        if (assumed.has(req.id)) {
            temp = satisfyRequirement(req, temp);
        }
    }
    const simulated = (0, compare_js_1.compare)(requirements, temp);
    const score = (0, score_js_1.computeReadinessScore)(requirements, simulated.findings);
    const gapsLeft = simulated.counts.mismatches + simulated.counts.missingInfo;
    const headline = gapsLeft === 0
        ? 'All gaps resolved — Ready to apply'
        : gapsLeft === 1
            ? 'Only 1 gap left'
            : `Only ${gapsLeft} gaps left`;
    return {
        appliedIds: Array.from(assumed),
        counts: simulated.counts,
        readiness: simulated.readiness,
        findings: simulated.findings,
        score,
        gapsLeft,
        headline,
        note: WHAT_IF_NOTE
    };
}
//# sourceMappingURL=whatif.js.map