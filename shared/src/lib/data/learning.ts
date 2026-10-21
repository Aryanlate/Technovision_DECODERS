import rawLearningData from '../../data/learning.json';

export interface LearningLink {
  title: string;
  url: string;
  hours: number;
}

export interface SkillLearningInfo {
  skill: string;
  hours: number;
  links: LearningLink[];
}

export const LEARNING_DATA: Record<string, SkillLearningInfo> = rawLearningData as Record<
  string,
  SkillLearningInfo
>;

/** Skill alias dictionary to normalize search terms. */
const SKILL_ALIASES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  react: 'React',
  reactjs: 'React',
  node: 'Node',
  nodejs: 'Node',
  'node.js': 'Node',
  express: 'Express',
  expressjs: 'Express',
  'express.js': 'Express',
  next: 'Next.js',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  html: 'HTML',
  html5: 'HTML',
  css: 'CSS',
  css3: 'CSS',
  sql: 'SQL',
  git: 'Git',
  github: 'Git',
  arduino: 'Arduino',
  iot: 'IoT',
  'internet of things': 'IoT',
  ml: 'Machine Learning',
  'machine learning': 'Machine Learning',
  docker: 'Docker',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  linux: 'Linux',
  java: 'Java',
  'c++': 'C++',
  cpp: 'C++',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'embedded c': 'Embedded C',
  embeddedc: 'Embedded C'
};

/**
 * Returns curated free learning links and typical hours for a given skill.
 * Case-insensitive and alias-aware.
 */
export function getLearningForSkill(skillName: string): SkillLearningInfo | null {
  if (!skillName || typeof skillName !== 'string') return null;
  const clean = skillName.trim().toLowerCase();

  // 1. Direct match on normalized name
  const canonicalName = SKILL_ALIASES[clean];
  if (canonicalName && LEARNING_DATA[canonicalName]) {
    return LEARNING_DATA[canonicalName];
  }

  // 2. Case-insensitive lookup in keys
  for (const [key, val] of Object.entries(LEARNING_DATA)) {
    if (key.toLowerCase() === clean) {
      return val;
    }
  }

  // 3. Substring match
  for (const [key, val] of Object.entries(LEARNING_DATA)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return val;
    }
  }

  return null;
}
