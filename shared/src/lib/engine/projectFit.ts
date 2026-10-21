import { Checklist, Project, Requirement, StudentProfile } from '../types/index.js';
import { canonicalizeSkill } from './rules.js';
import { toRequirements } from './compare.js';

export interface ProjectFitMatch {
  tag: string;
  where: 'tech' | 'domains' | 'title' | 'description';
}

export interface ProjectFit {
  projectId: string;
  title: string;
  score: number;
  matchedTags: string[];
  matchedIn: ProjectFitMatch[];
}

export interface BestFitProjectResult {
  hasProjects: boolean;
  best: ProjectFit | null;
  ranked: ProjectFit[];
  /** e.g. "Lead with your Home Automation project for this opportunity". */
  headline: string;
  reason: string;
  /** The visible rule behind the ranking. */
  rule: string;
}

const PROJECT_FIT_RULE =
  "Projects are ranked by how many of the opportunity's requested skills or tags appear in the project's tech stack, domains, title or description.";

/** The skill/tag vocabulary requested by the opportunity. */
export function requirementTags(checklistInput: Checklist | Requirement[]): string[] {
  const requirements = toRequirements(checklistInput);
  const tags = new Set<string>();

  for (const req of requirements) {
    if (req.kind === 'skills') {
      const list = Array.isArray(req.value) ? req.value : req.parsedRule?.requiredSkills || [];
      list.forEach((s) => s && tags.add(s));
      (req.parsedRule?.preferredSkills || []).forEach((s) => s && tags.add(s));
    } else if (req.kind === 'projectTag' && typeof req.value === 'string' && req.value) {
      tags.add(req.value);
    }
  }

  return Array.from(tags);
}

function scoreProject(project: Project, tags: string[]): ProjectFit {
  const tech = [...(project.tech || []), ...(project.techStack || [])]
    .map(canonicalizeSkill)
    .filter(Boolean);
  const domains = (project.domains || []).map(canonicalizeSkill);
  const title = canonicalizeSkill(project.title || '');
  const description = canonicalizeSkill(project.description || '');

  const matchedTags: string[] = [];
  const matchedIn: ProjectFitMatch[] = [];

  for (const tag of tags) {
    const canon = canonicalizeSkill(tag);
    if (!canon) continue;

    let where: ProjectFitMatch['where'] | null = null;
    if (tech.some((t) => t === canon || t.includes(canon) || canon.includes(t))) {
      where = 'tech';
    } else if (domains.some((d) => d.includes(canon) || canon.includes(d))) {
      where = 'domains';
    } else if (title.includes(canon)) {
      where = 'title';
    } else if (description.includes(canon)) {
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
export function bestFitProject(
  checklistInput: Checklist | Requirement[],
  profile: StudentProfile
): BestFitProjectResult {
  const tags = requirementTags(checklistInput);
  const projects = profile.projects || [];

  const ranked: ProjectFit[] = projects
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
