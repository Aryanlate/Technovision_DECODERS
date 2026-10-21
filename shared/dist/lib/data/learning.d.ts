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
export declare const LEARNING_DATA: Record<string, SkillLearningInfo>;
/**
 * Returns curated free learning links and typical hours for a given skill.
 * Case-insensitive and alias-aware.
 */
export declare function getLearningForSkill(skillName: string): SkillLearningInfo | null;
//# sourceMappingURL=learning.d.ts.map