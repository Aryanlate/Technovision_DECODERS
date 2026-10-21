import {
  Project,
  RequirementStatus
} from '../types/index.js';

export interface RuleResult {
  status: RequirementStatus;
  reason: string;
  ruleUsed: string;
  nextStep?: string;
  studentValue?: string;
  expected?: string;
}

// ============================================================================
// Skill Normalization & Aliases
// ============================================================================
export const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  py: 'python',
  python: 'python',
  react: 'react',
  reactjs: 'react',
  'react.js': 'react',
  vue: 'vue',
  vuejs: 'vue',
  'vue.js': 'vue',
  next: 'nextjs',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  golang: 'go',
  go: 'go',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  cpp: 'c++',
  'c++': 'c++',
  cs: 'c#',
  csharp: 'c#',
  'c#': 'c#',
  html: 'html',
  html5: 'html',
  css: 'css',
  css3: 'css',
  docker: 'docker',
  git: 'git',
  aws: 'aws',
  gcp: 'gcp',
  azure: 'azure',
  k8s: 'kubernetes',
  kubernetes: 'kubernetes'
};

/**
 * Normalizes skill strings for case-insensitive matching and alias resolution.
 * e.g., "JS" -> "javascript", "Node" -> "nodejs", "node.js" -> "nodejs"
 */
export function canonicalizeSkill(skill: string): string {
  if (!skill || typeof skill !== 'string') return '';
  const trimmed = skill.trim().toLowerCase();
  if (SKILL_ALIASES[trimmed]) return SKILL_ALIASES[trimmed];

  const alphanumeric = trimmed.replace(/[\s\-_.]/g, '');
  if (SKILL_ALIASES[alphanumeric]) return SKILL_ALIASES[alphanumeric];

  return alphanumeric;
}

/**
 * Validates whether a given string is a plausible URL format.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Basic check: must contain a dot, no spaces
  if (/\s/.test(trimmed)) return false;

  try {
    const testUrl =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(testUrl);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

// ============================================================================
// 1. numberRule
// Handles CGPA minimum, marks cut-off, income maximum, etc.
// ============================================================================
export function numberRule(
  studentValue: number | null | undefined,
  threshold: number,
  mode: 'min' | 'max' | 'exact' = 'min',
  metricName = 'Score'
): RuleResult {
  const expectedStr = `${mode === 'min' ? 'Minimum ' : mode === 'max' ? 'Maximum ' : ''}${threshold}`;

  // Strict invariant: empty, null, undefined, or NaN is ALWAYS Missing info, never Mismatch
  if (
    studentValue === undefined ||
    studentValue === null ||
    typeof studentValue !== 'number' ||
    Number.isNaN(studentValue)
  ) {
    return {
      status: 'Missing info',
      reason: `${metricName} is not specified in profile.`,
      ruleUsed: 'numberRule',
      nextStep: `Add your ${metricName} in your profile (Required: ${expectedStr}).`,
      expected: expectedStr,
      studentValue: 'Not provided'
    };
  }

  const studentStr = `${metricName} ${studentValue}`;

  if (mode === 'min') {
    if (studentValue >= threshold) {
      return {
        status: 'Match',
        reason: `${studentStr} meets the minimum requirement of ${threshold}.`,
        ruleUsed: 'numberRule',
        nextStep: '',
        expected: expectedStr,
        studentValue: studentStr
      };
    }
    return {
      status: 'Mismatch',
      reason: `${studentStr} is below the required cutoff of ${threshold}.`,
      ruleUsed: 'numberRule',
      nextStep: `Opportunity requires minimum ${metricName} ${threshold}.`,
      expected: expectedStr,
      studentValue: studentStr
    };
  }

  if (mode === 'max') {
    if (studentValue <= threshold) {
      return {
        status: 'Match',
        reason: `${studentStr} is within the permitted limit of ${threshold}.`,
        ruleUsed: 'numberRule',
        nextStep: '',
        expected: expectedStr,
        studentValue: studentStr
      };
    }
    return {
      status: 'Mismatch',
      reason: `${studentStr} exceeds the permitted maximum limit of ${threshold}.`,
      ruleUsed: 'numberRule',
      nextStep: `Opportunity requires ${metricName} to not exceed ${threshold}.`,
      expected: expectedStr,
      studentValue: studentStr
    };
  }

  // exact mode
  if (studentValue === threshold) {
    return {
      status: 'Match',
      reason: `${studentStr} matches exact requirement of ${threshold}.`,
      ruleUsed: 'numberRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: studentStr
    };
  }
  return {
    status: 'Mismatch',
    reason: `${studentStr} does not match required value of ${threshold}.`,
    ruleUsed: 'numberRule',
    nextStep: `Opportunity requires exact ${metricName} ${threshold}.`,
    expected: expectedStr,
    studentValue: studentStr
  };
}

// ============================================================================
// 2. rangeRule
// Handles year of study within allowed years
// ============================================================================
export function rangeRule(
  studentValue: number | null | undefined,
  allowedValues: number[],
  label = 'Year of study'
): RuleResult {
  const formatYear = (y: number) =>
    y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : `${y}th`;

  const expectedStr =
    allowedValues.length > 0
      ? `${allowedValues.map(formatYear).join(' or ')} year`
      : 'Open';

  // Strict invariant: empty/unknown profile field is Missing info, never Mismatch
  if (
    studentValue === undefined ||
    studentValue === null ||
    typeof studentValue !== 'number' ||
    Number.isNaN(studentValue)
  ) {
    return {
      status: 'Missing info',
      reason: `${label} is not specified in profile.`,
      ruleUsed: 'rangeRule',
      nextStep: `Update your profile to indicate your current ${label.toLowerCase()} (Allowed: ${expectedStr}).`,
      expected: expectedStr,
      studentValue: 'Not provided'
    };
  }

  const studentStr = `${formatYear(studentValue)} year`;

  if (allowedValues.includes(studentValue)) {
    return {
      status: 'Match',
      reason: `${studentStr} student matches the requirement (${expectedStr}).`,
      ruleUsed: 'rangeRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: studentStr
    };
  }

  return {
    status: 'Mismatch',
    reason: `Current ${label.toLowerCase()} (${studentStr}) does not match the required year (${expectedStr}).`,
    ruleUsed: 'rangeRule',
    nextStep: `This opportunity is reserved for students in ${expectedStr}.`,
    expected: expectedStr,
    studentValue: studentStr
  };
}

// ============================================================================
// 3. listRule
// Required skills minus profile skills; the reason must name the missing skills
// Case-insensitive, handles aliases (JS = JavaScript, Node = Node.js)
// ============================================================================
export function listRule(
  profileSkills: string[] | null | undefined,
  requiredSkills: string[],
  aliases: Record<string, string> = SKILL_ALIASES
): RuleResult {
  const expectedStr = requiredSkills.join(', ');

  // Strict invariant: empty or unknown profile field returns "Missing info"
  if (!profileSkills || !Array.isArray(profileSkills) || profileSkills.length === 0) {
    return {
      status: 'Missing info',
      reason: 'No technical skills are listed in your profile.',
      ruleUsed: 'listRule',
      nextStep: `Add your relevant technical skills (${expectedStr}) to your profile.`,
      expected: expectedStr,
      studentValue: 'None listed'
    };
  }

  const profileCanonical = new Set(
    profileSkills.map((s) => canonicalizeSkill(s)).filter(Boolean)
  );

  const missingSkills = requiredSkills.filter(
    (req) => !profileCanonical.has(canonicalizeSkill(req))
  );

  const studentValStr = profileSkills.join(', ');

  if (missingSkills.length > 0) {
    return {
      status: 'Mismatch',
      reason: `Missing required skill${missingSkills.length > 1 ? 's' : ''}: ${missingSkills.join(', ')}.`,
      ruleUsed: 'listRule',
      nextStep: `Build or document proficiency in ${missingSkills.join(', ')} before applying.`,
      expected: expectedStr,
      studentValue: studentValStr
    };
  }

  return {
    status: 'Match',
    reason: `All required skills (${expectedStr}) are present in your profile.`,
    ruleUsed: 'listRule',
    nextStep: '',
    expected: expectedStr,
    studentValue: studentValStr
  };
}

// ============================================================================
// 4. documentRule
// Handles resume, marksheet, incomeCertificate, etc.
// ============================================================================
export function documentRule(
  profileDocuments:
    | Array<{ name?: string; type: string; url?: string; verified?: boolean }>
    | null
    | undefined,
  requiredType: string,
  legacyFlag?: boolean | null,
  legacyUrl?: string
): RuleResult {
  const normalizedRequired = requiredType.toLowerCase().replace(/[\s\-_]/g, '');
  const expectedStr = `${requiredType} required`;

  // Special handling for legacy resume flag
  if (normalizedRequired.includes('resume')) {
    if (legacyFlag === false) {
      return {
        status: 'Mismatch',
        reason: 'Resume is not ready or marked missing.',
        ruleUsed: 'documentRule',
        nextStep: 'Prepare your updated resume according to the role requirements.',
        expected: expectedStr,
        studentValue: 'Not ready'
      };
    }

    if (
      legacyFlag === true ||
      (legacyUrl && legacyUrl.trim().length > 0) ||
      profileDocuments?.some((d) => d.type.toLowerCase().includes('resume'))
    ) {
      return {
        status: 'Match',
        reason: 'Resume is available and ready.',
        ruleUsed: 'documentRule',
        nextStep: '',
        expected: expectedStr,
        studentValue: legacyUrl ? `Ready (${legacyUrl})` : 'Ready'
      };
    }

    // Not specified or null
    return {
      status: 'Missing info',
      reason: 'Resume status is not marked in profile.',
      ruleUsed: 'documentRule',
      nextStep: 'Confirm whether your resume is ready or upload a resume link in your profile.',
      expected: expectedStr,
      studentValue: 'Status unknown'
    };
  }

  // General documents: marksheet, incomeCertificate, etc.
  if (!profileDocuments || profileDocuments.length === 0) {
    return {
      status: 'Missing info',
      reason: `${requiredType} is not attached to your profile.`,
      ruleUsed: 'documentRule',
      nextStep: `Upload or provide a verified link for your ${requiredType}.`,
      expected: expectedStr,
      studentValue: 'Not provided'
    };
  }

  const found = profileDocuments.find((doc) => {
    const docTypeNorm = doc.type.toLowerCase().replace(/[\s\-_]/g, '');
    const docNameNorm = (doc.name || '').toLowerCase().replace(/[\s\-_]/g, '');
    return (
      docTypeNorm.includes(normalizedRequired) ||
      docNameNorm.includes(normalizedRequired) ||
      normalizedRequired.includes(docTypeNorm)
    );
  });

  if (found) {
    return {
      status: 'Match',
      reason: `${found.name || requiredType} is attached and verified in profile.`,
      ruleUsed: 'documentRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: found.url || found.name || 'Provided'
    };
  }

  return {
    status: 'Missing info',
    reason: `${requiredType} is not attached to your profile.`,
    ruleUsed: 'documentRule',
    nextStep: `Upload or provide a verified link for your ${requiredType}.`,
    expected: expectedStr,
    studentValue: 'Not provided'
  };
}

// ============================================================================
// 5. linkRule
// Present / format valid; "GitHub or portfolio" requirement is satisfied by either
// ============================================================================
export function linkRule(
  links:
    | {
        github?: string;
        linkedin?: string;
        portfolio?: string;
        instagram?: string;
      }
    | null
    | undefined,
  linkKind:
    | 'github'
    | 'portfolio'
    | 'linkedin'
    | 'instagram'
    | 'portfolioOrGithub'
    | 'githubOrPortfolio'
    | string,
  legacyValues?: { githubUrl?: string; portfolioUrl?: string }
): RuleResult {
  const normKind = linkKind.toLowerCase().replace(/[\s\-_]/g, '');
  const isEither =
    normKind.includes('githuborportfolio') ||
    normKind.includes('portfolioorgithub') ||
    normKind.includes('portfolioorgithublink');

  const github = (links?.github || legacyValues?.githubUrl || '').trim();
  const portfolio = (links?.portfolio || legacyValues?.portfolioUrl || '').trim();
  const linkedin = (links?.linkedin || '').trim();
  const instagram = (links?.instagram || '').trim();

  if (isEither) {
    const expectedStr = 'Portfolio or GitHub link required';
    const hasGithub = Boolean(github && github.length > 0);
    const hasPortfolio = Boolean(portfolio && portfolio.length > 0);

    if (!hasGithub && !hasPortfolio) {
      return {
        status: 'Missing info',
        reason: 'Neither Portfolio nor GitHub link is provided in profile.',
        ruleUsed: 'linkRule',
        nextStep: 'Add your GitHub profile or personal portfolio link to your profile.',
        expected: expectedStr,
        studentValue: 'Not provided'
      };
    }

    // If provided, format must be valid
    if (hasGithub && !isValidUrl(github) && !hasPortfolio) {
      return {
        status: 'Mismatch',
        reason: `GitHub link "${github}" is not a valid URL format.`,
        ruleUsed: 'linkRule',
        nextStep: 'Provide a valid GitHub profile URL (e.g. https://github.com/username).',
        expected: expectedStr,
        studentValue: github
      };
    }

    if (hasPortfolio && !isValidUrl(portfolio) && !hasGithub) {
      return {
        status: 'Mismatch',
        reason: `Portfolio link "${portfolio}" is not a valid URL format.`,
        ruleUsed: 'linkRule',
        nextStep: 'Provide a valid portfolio website URL (e.g. https://myportfolio.com).',
        expected: expectedStr,
        studentValue: portfolio
      };
    }

    const providedParts = [
      hasGithub && isValidUrl(github) ? 'GitHub' : '',
      hasPortfolio && isValidUrl(portfolio) ? 'Portfolio' : ''
    ].filter(Boolean);

    return {
      status: 'Match',
      reason: `${providedParts.join(' & ')} link provided in profile.`,
      ruleUsed: 'linkRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: [github, portfolio].filter(Boolean).join(' | ')
    };
  }

  // Single link checks
  let targetUrl = '';
  let label = linkKind;

  if (normKind.includes('github')) {
    targetUrl = github;
    label = 'GitHub';
  } else if (normKind.includes('portfolio')) {
    targetUrl = portfolio;
    label = 'Portfolio';
  } else if (normKind.includes('linkedin')) {
    targetUrl = linkedin;
    label = 'LinkedIn';
  } else if (normKind.includes('instagram')) {
    targetUrl = instagram;
    label = 'Instagram';
  }

  const expectedStr = `${label} link required`;

  if (!targetUrl || targetUrl.length === 0) {
    return {
      status: 'Missing info',
      reason: `${label} link is not provided in profile.`,
      ruleUsed: 'linkRule',
      nextStep: `Add your ${label} profile link to your profile.`,
      expected: expectedStr,
      studentValue: 'Not provided'
    };
  }

  if (!isValidUrl(targetUrl)) {
    return {
      status: 'Mismatch',
      reason: `${label} link "${targetUrl}" is not a valid URL format.`,
      ruleUsed: 'linkRule',
      nextStep: `Provide a valid URL for your ${label} link.`,
      expected: expectedStr,
      studentValue: targetUrl
    };
  }

  return {
    status: 'Match',
    reason: `${label} link is provided and valid.`,
    ruleUsed: 'linkRule',
    nextStep: '',
    expected: expectedStr,
    studentValue: targetUrl
  };
}

// ============================================================================
// 6. countRule
// Matching projects vs required count
// ============================================================================
export function countRule(
  projects: Project[] | null | undefined,
  requiredCount: number,
  filterFn?: (p: Project) => boolean,
  label = 'project'
): RuleResult {
  const expectedStr = `Minimum ${requiredCount} ${label}${requiredCount > 1 ? 's' : ''}`;

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return {
      status: 'Missing info',
      reason: `No projects are listed in profile.`,
      ruleUsed: 'countRule',
      nextStep: `Add at least ${requiredCount} completed ${label}(s) to your profile.`,
      expected: expectedStr,
      studentValue: '0 projects'
    };
  }

  const matching = filterFn ? projects.filter(filterFn) : projects;

  if (matching.length >= requiredCount) {
    return {
      status: 'Match',
      reason: `Found ${matching.length} matching ${label}${matching.length > 1 ? 's' : ''} (meets requirement of ${requiredCount}).`,
      ruleUsed: 'countRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: `${matching.length} projects`
    };
  }

  if (matching.length === 0) {
    return {
      status: 'Missing info',
      reason: `No projects matching ${label} found in profile.`,
      ruleUsed: 'countRule',
      nextStep: `Add at least ${requiredCount} verified ${label}(s) to your profile.`,
      expected: expectedStr,
      studentValue: '0 matching projects'
    };
  }

  return {
    status: 'Mismatch',
    reason: `Found ${matching.length} ${label}${matching.length > 1 ? 's' : ''}, but minimum ${requiredCount} are required.`,
    ruleUsed: 'countRule',
    nextStep: `Add ${requiredCount - matching.length} more ${label}(s) to your profile.`,
    expected: expectedStr,
    studentValue: `${matching.length} projects`
  };
}

// ============================================================================
// 7. tagRule
// Requested domain or tech appears in a project's tags or tech
// ============================================================================
export function tagRule(
  projects: Project[] | null | undefined,
  requestedTag: string
): RuleResult {
  const expectedStr = `Project with domain or technology "${requestedTag}"`;

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return {
      status: 'Missing info',
      reason: `No projects listed in profile to verify tag "${requestedTag}".`,
      ruleUsed: 'tagRule',
      nextStep: `Add a project featuring "${requestedTag}" to your profile.`,
      expected: expectedStr,
      studentValue: 'No projects'
    };
  }

  const targetCanon = canonicalizeSkill(requestedTag);

  const matchedProject = projects.find((p) => {
    const domains = (p.domains || []).map(canonicalizeSkill);
    const tech = (p.tech || p.techStack || []).map(canonicalizeSkill);
    const title = canonicalizeSkill(p.title || '');
    const desc = canonicalizeSkill(p.description || '');

    return (
      domains.some((d) => d.includes(targetCanon) || targetCanon.includes(d)) ||
      tech.some((t) => t.includes(targetCanon) || targetCanon.includes(t)) ||
      title.includes(targetCanon) ||
      desc.includes(targetCanon)
    );
  });

  if (matchedProject) {
    return {
      status: 'Match',
      reason: `Project "${matchedProject.title}" matches tag "${requestedTag}".`,
      ruleUsed: 'tagRule',
      nextStep: '',
      expected: expectedStr,
      studentValue: matchedProject.title
    };
  }

  return {
    status: 'Missing info',
    reason: `No project with tag/technology "${requestedTag}" found in profile.`,
    ruleUsed: 'tagRule',
    nextStep: `Add a project demonstrating experience with "${requestedTag}".`,
    expected: expectedStr,
    studentValue: 'Not found'
  };
}

// ============================================================================
// 8. proofRule
// A link is required on a project but missing
// ============================================================================
export function proofRule(
  project: Project | null | undefined,
  label = 'proof link'
): RuleResult {
  if (!project) {
    return {
      status: 'Missing info',
      reason: `No project specified to verify ${label}.`,
      ruleUsed: 'proofRule',
      nextStep: 'Add project details with proof link in your profile.',
      expected: `${label} required`,
      studentValue: 'No project'
    };
  }

  const proof = (project.proofLink || project.link || '').trim();
  const expectedStr = `Verified ${label} for project "${project.title}"`;

  if (!proof) {
    return {
      status: 'Mismatch',
      reason: `Project "${project.title}" is missing a required ${label}.`,
      ruleUsed: 'proofRule',
      nextStep: `Add a public repository or live demo link to "${project.title}".`,
      expected: expectedStr,
      studentValue: 'No link'
    };
  }

  if (!isValidUrl(proof)) {
    return {
      status: 'Mismatch',
      reason: `Proof link "${proof}" for project "${project.title}" is not a valid URL.`,
      ruleUsed: 'proofRule',
      nextStep: `Provide a valid URL (e.g. https://github.com/user/repo) for project proof link.`,
      expected: expectedStr,
      studentValue: proof
    };
  }

  return {
    status: 'Match',
    reason: `Verified ${label} provided for project "${project.title}".`,
    ruleUsed: 'proofRule',
    nextStep: '',
    expected: expectedStr,
    studentValue: proof
  };
}

// ============================================================================
// 9. availabilityRule
// Checks student availability in weeks against requirement
// ============================================================================
export function availabilityRule(
  studentWeeks: number | null | undefined,
  requiredWeeks: number
): RuleResult {
  const expectedStr = `Available for ${requiredWeeks} weeks`;

  // Strict invariant: empty or unknown availability is Missing info, never Mismatch
  if (
    studentWeeks === undefined ||
    studentWeeks === null ||
    typeof studentWeeks !== 'number' ||
    Number.isNaN(studentWeeks)
  ) {
    return {
      status: 'Missing info',
      reason: 'Availability is not specified in profile.',
      ruleUsed: 'availabilityRule',
      nextStep: `Confirm whether you are available for ${requiredWeeks} weeks in your profile.`,
      expected: expectedStr,
      studentValue: 'Not provided'
    };
  }

  const studentStr = `${studentWeeks} weeks`;

  if (studentWeeks < requiredWeeks) {
    return {
      status: 'Mismatch',
      reason: `Available for ${studentWeeks} weeks, but ${requiredWeeks} weeks are required.`,
      ruleUsed: 'availabilityRule',
      nextStep: `Confirm minimum ${requiredWeeks} weeks availability.`,
      expected: expectedStr,
      studentValue: studentStr
    };
  }

  return {
    status: 'Match',
    reason: `Available for ${studentWeeks} weeks (meets requirement of ${requiredWeeks} weeks).`,
    ruleUsed: 'availabilityRule',
    nextStep: '',
    expected: expectedStr,
    studentValue: studentStr
  };
}

// ============================================================================
// 10. deadlineRule
// Checks opportunity deadline vs current date
// ============================================================================
export function deadlineRule(
  deadline: string | Date | null | undefined,
  currentDate: Date = new Date()
): RuleResult {
  const expectedStr = 'Active application deadline';

  if (!deadline) {
    return {
      status: 'Missing info',
      reason: 'Deadline is not specified.',
      ruleUsed: 'deadlineRule',
      nextStep: 'Check the official opportunity notice for submission deadline.',
      expected: expectedStr,
      studentValue: 'Not specified'
    };
  }

  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;

  if (Number.isNaN(d.getTime())) {
    return {
      status: 'Missing info',
      reason: `Unable to parse deadline date: "${deadline}".`,
      ruleUsed: 'deadlineRule',
      nextStep: 'Verify deadline date format (YYYY-MM-DD).',
      expected: expectedStr,
      studentValue: String(deadline)
    };
  }

  const deadlineFormatted = d.toISOString().slice(0, 10);

  // Set deadline to end of specified day (23:59:59.999) for fair daily comparison
  const endOfDayDeadline = new Date(d);
  endOfDayDeadline.setHours(23, 59, 59, 999);

  if (endOfDayDeadline.getTime() < currentDate.getTime()) {
    return {
      status: 'Mismatch',
      reason: `Submission deadline has passed (${deadlineFormatted}).`,
      ruleUsed: 'deadlineRule',
      nextStep: 'Application period for this opportunity has closed.',
      expected: `Before ${deadlineFormatted}`,
      studentValue: `Expired on ${deadlineFormatted}`
    };
  }

  return {
    status: 'Match',
    reason: `Opportunity is active (deadline: ${deadlineFormatted}).`,
    ruleUsed: 'deadlineRule',
    nextStep: '',
    expected: `Before ${deadlineFormatted}`,
    studentValue: `Open until ${deadlineFormatted}`
  };
}
