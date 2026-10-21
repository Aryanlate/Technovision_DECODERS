"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementTags = requirementTags;
exports.bestFitProject = bestFitProject;
const rules_js_1 = require("./rules.js");
const compare_js_1 = require("./compare.js");
const PROJECT_FIT_RULE = "Projects are ranked by how many of the opportunity's requested skills or tags appear in the project's tech stack, domains, title or description.";
/** The skill/tag vocabulary requested by the opportunity. */
function requirementTags(checklistInput) {
    const requirements = (0, compare_js_1.toRequirements)(checklistInput);
    const tags = new Set();
    for (const req of requirements) {
        if (req.kind === 'skills') {
            const list = Array.isArray(req.value) ? req.value : req.parsedRule?.requiredSkills || [];
            list.forEach((s) => s && tags.add(s));
            (req.parsedRule?.preferredSkills || []).forEach((s) => s && tags.add(s));
        }
        else if (req.kind === 'projectTag' && typeof req.value === 'string' && req.value) {
            tags.add(req.value);
        }
    }
    return Array.from(tags);
}
function scoreProject(project, tags) {
    const tech = [...(project.tech || []), ...(project.techStack || [])]
        .map(rules_js_1.canonicalizeSkill)
        .filter(Boolean);
    const domains = (project.domains || []).map(rules_js_1.canonicalizeSkill);
    const title = (0, rules_js_1.canonicalizeSkill)(project.title || '');
    const description = (0, rules_js_1.canonicalizeSkill)(project.description || '');
    const matchedTags = [];
    const matchedIn = [];
    for (const tag of tags) {
        const canon = (0, rules_js_1.canonicalizeSkill)(tag);
        if (!canon)
            continue;
        let where = null;
        if (tech.some((t) => t === canon || t.includes(canon) || canon.includes(t))) {
            where = 'tech';
        }
        else if (domains.some((d) => d.includes(canon) || canon.includes(d))) {
            where = 'domains';
        }
        else if (title.includes(canon)) {
            where = 'title';
        }
        else if (description.includes(canon)) {
            where = 'description';
        }
        if (where) {
            matchedTags.push(tag);
            matchedIn.push({ tag, where });
        }
    }
    return {
        projectId: project.id,
        title: project.title,
        score: matchedTags.length,
        matchedTags,
        matchedIn
    };
}
/**
 * Ranks the student's projects against the opportunity's requested skills/tags
 * using a visible overlap rule, then highlights the single best fit.
 */
function bestFitProject(checklistInput, profile) {
    const tags = requirementTags(checklistInput);
    const projects = profile.projects || [];
    const ranked = projects
        .map((p) => scoreProject(p, tags))
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    const best = ranked.length > 0 && ranked[0].score > 0 ? ranked[0] : null;
    const headline = best
        ? `Lead with your ${best.title} project for this opportunity`
        : projects.length > 0
            ? 'No project clearly matches this opportunity yet'
            : 'Add a project to get a best-fit recommendation';
    const reason = best
        ? `It matches ${best.score} of the ${tags.length} requested skill(s)/tag(s): ${best.matchedTags.join(', ')}.`
        : projects.length > 0
            ? `None of your ${projects.length} project(s) mention the requested skills/tags (${tags.join(', ') || 'none listed'}).`
            : 'Your profile has no projects to rank yet.';
    return {
        hasProjects: projects.length > 0,
        best,
        ranked,
        headline,
        reason,
        rule: PROJECT_FIT_RULE
    };
}
//# sourceMappingURL=projectFit.js.map