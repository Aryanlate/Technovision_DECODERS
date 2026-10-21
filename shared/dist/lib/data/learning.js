"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEARNING_DATA = void 0;
exports.getLearningForSkill = getLearningForSkill;
const learning_json_1 = __importDefault(require("../../data/learning.json"));
exports.LEARNING_DATA = learning_json_1.default;
/** Skill alias dictionary to normalize search terms. */
const SKILL_ALIASES = {
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
function getLearningForSkill(skillName) {
    if (!skillName || typeof skillName !== 'string')
        return null;
    const clean = skillName.trim().toLowerCase();
    // 1. Direct match on normalized name
    const canonicalName = SKILL_ALIASES[clean];
    if (canonicalName && exports.LEARNING_DATA[canonicalName]) {
        return exports.LEARNING_DATA[canonicalName];
    }
    // 2. Case-insensitive lookup in keys
    for (const [key, val] of Object.entries(exports.LEARNING_DATA)) {
        if (key.toLowerCase() === clean) {
            return val;
        }
    }
    // 3. Substring match
    for (const [key, val] of Object.entries(exports.LEARNING_DATA)) {
        if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
            return val;
        }
    }
    return null;
}
//# sourceMappingURL=learning.js.map