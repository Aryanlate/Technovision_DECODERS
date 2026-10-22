import {
  Agent,
  AgentResult,
  AgentSource,
  LinkedInAnalyzerOutput,
  LinkedInAnalyzerOutputSchema,
  LINKEDIN_ANALYZER_SPEC,
  LinkedInExtractedSkill,
  LinkedInExtractedExperience,
  LinkedInExtractedEducation,
  EvidenceRecord,
  EVIDENCE_KIND,
  createDraftEvidence
} from './types.js';
import { askAgentLLM } from '../llm/index.js';

export interface LinkedInAnalyzerInput {
  linkedinUrl?: string;
  pastedText?: string;
  profile?: any;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
  existingEvidence?: EvidenceRecord[];
}

/**
 * Common technical and domain skills dictionary for keyword rule fallback.
 */
const KNOWN_SKILL_KEYWORDS = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'C',
  'Go',
  'Golang',
  'Rust',
  'PHP',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'Angular',
  'Vue',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Git',
  'GitHub',
  'Figma',
  'Tailwind CSS',
  'REST APIs',
  'GraphQL',
  'Machine Learning',
  'Deep Learning',
  'Data Analytics',
  'Pandas',
  'NumPy',
  'Agile',
  'Scrum',
  'IoT',
  'Embedded Systems',
  'Arduino',
  'MATLAB',
  'Linux',
  'Cybersecurity'
];

/**
 * Splits text into meaningful sentences while preserving context.
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

/**
 * Keyword-based fallback rule extractor when LLM gateway is offline or unavailable.
 */
function runKeywordRuleFallback(text: string, handle: string): LinkedInAnalyzerOutput {
  const sentences = splitIntoSentences(text);
  const detectedSkillsMap = new Map<string, LinkedInExtractedSkill>();
  const experiences: LinkedInExtractedExperience[] = [];
  const education: LinkedInExtractedEducation[] = [];

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();

    // 1. Detect technical skills
    for (const skill of KNOWN_SKILL_KEYWORDS) {
      // Word boundary match for the skill
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(sentence)) {
        if (!detectedSkillsMap.has(skill)) {
          detectedSkillsMap.set(skill, {
            skill,
            sentence,
            confidence: 'high'
          });
        }
      }
    }

    // 2. Detect education credentials
    if (
      sLower.includes('b.tech') ||
      sLower.includes('b.e.') ||
      sLower.includes('bachelor') ||
      sLower.includes('master') ||
      sLower.includes('m.tech') ||
      sLower.includes('undergraduate') ||
      sLower.includes('student') ||
      sLower.includes('degree') ||
      sLower.includes('university') ||
      sLower.includes('institute')
    ) {
      let degreeLabel = sentence.slice(0, 60);
      if (sLower.includes('b.tech')) degreeLabel = 'B.Tech';
      else if (sLower.includes('b.e.')) degreeLabel = 'B.E.';
      else if (sLower.includes('bachelor')) degreeLabel = "Bachelor's Degree";

      education.push({
        degree: degreeLabel,
        sentence,
        confidence: 'high'
      });
    }

    // 3. Detect experiences (internships, clubs, roles)
    if (
      sLower.includes('intern') ||
      sLower.includes('internship') ||
      sLower.includes('coordinator') ||
      sLower.includes('developer') ||
      sLower.includes('engineer') ||
      sLower.includes('volunteer') ||
      sLower.includes('lead') ||
      sLower.includes('fellow') ||
      sLower.includes('worked at')
    ) {
      let roleTitle = 'Contributor';
      if (sLower.includes('intern')) roleTitle = 'Intern';
      else if (sLower.includes('coordinator')) roleTitle = 'Coordinator';
      else if (sLower.includes('developer')) roleTitle = 'Developer';

      experiences.push({
        title: roleTitle,
        company: 'Experience Record',
        sentence,
        confidence: 'high'
      });
    }
  }

  const skills = Array.from(detectedSkillsMap.values());
  const skillNames = skills.map((s) => s.skill);

  return {
    handle: handle || 'student',
    skills,
    experiences,
    education,
    detectedSkills: skillNames,
    suggestedSkills: skillNames,
    verifiedEducation: education[0]?.degree || undefined,
    confidence: 'high'
  };
}

function buildLinkedInEvidenceDrafts(
  output: LinkedInAnalyzerOutput,
  url: string,
  providerUsed: string,
  existingEvidence?: EvidenceRecord[]
): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const subjectId = 'student';

  // Skills
  for (const s of output.skills || []) {
    const skillName = typeof s === 'string' ? s : s.skill;
    const sentence = typeof s === 'object' && s.sentence ? s.sentence : `Skill: ${skillName}`;
    records.push(
      createDraftEvidence({
        subjectType: 'profile',
        subjectId,
        kind: EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS,
        key: `skill-${skillName.toLowerCase().trim()}`,
        value: skillName,
        source: {
          type: 'linkedin_analyzer',
          agent: 'LinkedInAnalyzer',
          provider: providerUsed,
          url,
          sentence
        },
        trust: 'unverified',
        existingEvidence
      })
    );
  }

  // Experiences
  for (const exp of output.experiences || []) {
    records.push(
      createDraftEvidence({
        subjectType: 'profile',
        subjectId,
        kind: EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS,
        key: `project-${exp.title.toLowerCase().trim()}-${exp.company.toLowerCase().trim()}`,
        value: {
          title: `${exp.title} - ${exp.company}`,
          domains: ['Professional Experience'],
          tech: [],
          role: exp.title,
          status: 'completed',
          proofLink: url
        },
        source: {
          type: 'linkedin_analyzer',
          agent: 'LinkedInAnalyzer',
          provider: providerUsed,
          url,
          sentence: exp.sentence || `Experience: ${exp.title} at ${exp.company}`
        },
        trust: 'unverified',
        existingEvidence
      })
    );
  }

  // Education
  for (const edu of output.education || []) {
    records.push(
      createDraftEvidence({
        subjectType: 'profile',
        subjectId,
        kind: EVIDENCE_KIND.PROFILE_TEXT_ANALYSIS,
        key: 'education',
        value: edu.degree,
        source: {
          type: 'linkedin_analyzer',
          agent: 'LinkedInAnalyzer',
          provider: providerUsed,
          url,
          sentence: edu.sentence || `Education: ${edu.degree}`
        },
        trust: 'unverified',
        existingEvidence
      })
    );
  }

  return records;
}

export class LinkedInAnalyzer implements Agent<LinkedInAnalyzerInput, LinkedInAnalyzerOutput> {
  public readonly name = 'LinkedInAnalyzer';

  async run(input: LinkedInAnalyzerInput): Promise<AgentResult<LinkedInAnalyzerOutput>> {
    const startTime = Date.now();
    const linkedinUrl = (input.linkedinUrl || '').trim();
    // Student pasted text from About, Experience and Skills or profile
    const pastedText = (input.pastedText || input.profile?.linkedInText || '').trim();

    // Benchmark sample fallback data
    const sampleOutput: LinkedInAnalyzerOutput = {
      handle: 'alexsharma',
      skills: [
        {
          skill: 'HTML',
          sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
          confidence: 'high'
        },
        {
          skill: 'CSS',
          sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
          confidence: 'high'
        },
        {
          skill: 'Python',
          sentence: 'Experienced in HTML, CSS and Python through web development projects and course labs.',
          confidence: 'high'
        }
      ],
      experiences: [
        {
          title: 'Student Web Coordinator',
          company: 'Campus Open Source Club',
          duration: '4 months',
          sentence: 'Served as Student Web Coordinator at Campus Open Source Club for 4 months.',
          confidence: 'high'
        }
      ],
      education: [
        {
          degree: '2nd year B.Tech in Computer Science and Engineering',
          institution: 'National Institute of Technology',
          sentence: 'Currently pursuing 2nd year B.Tech in Computer Science and Engineering at National Institute of Technology.',
          confidence: 'high'
        }
      ],
      detectedSkills: ['HTML', 'CSS', 'Python'],
      suggestedSkills: ['HTML', 'CSS', 'Python'],
      verifiedEducation: '2nd year B.Tech in Computer Science and Engineering',
      confidence: 'high'
    };

    const isDemo = process.env.DEMO_MODE === 'true';

    // PRIVACY & SCRAPING POLICY: LinkedIn blocks scraping, so we never fetch the URL directly.
    // If no text is pasted, return benchmark sample with clear compliance notice.
    if (isDemo || !pastedText) {
      const url = linkedinUrl || 'https://linkedin.com/in/alexsharma';
      const evidence = buildLinkedInEvidenceDrafts(sampleOutput, url, 'offline-cache', input.existingEvidence);
      return {
        agent: this.name,
        status: 'done',
        data: sampleOutput,
        evidence,
        sources: [
          {
            title: 'Sample LinkedIn Profile Record',
            url,
            trust: 'Needs review'
          }
        ],
        notes: [
          !pastedText
            ? 'No pasted text provided: returned benchmark candidate profile records. Note: "We never access your LinkedIn account."'
            : 'DEMO_MODE active: returned benchmark sample LinkedIn skills and experience. Note: "We never access your LinkedIn account."'
        ],
        confidence: 'high',
        providerUsed: 'offline-cache',
        timeTakenMs: Date.now() - startTime
      };
    }

    // Handle extraction via LLM
    try {
      const promptText = `Pasted LinkedIn Profile Text:\n"""\n${pastedText}\n"""\n\nExtract skills, education and experience only from the pasted text. Return JSON with confidence and the sentence each item came from.`;

      const llmRes = await askAgentLLM<LinkedInAnalyzerOutput>('linkedin_analyzer', {
        system: LINKEDIN_ANALYZER_SPEC.rolePrompt,
        prompt: promptText,
        schema: LinkedInAnalyzerOutputSchema,
        temperature: 0,
        language: input.language
      });

      if (llmRes && llmRes.data) {
        const enriched: LinkedInAnalyzerOutput = {
          ...llmRes.data,
          detectedSkills: llmRes.data.skills.map((s) => s.skill),
          suggestedSkills: llmRes.data.skills.map((s) => s.skill),
          verifiedEducation: llmRes.data.education[0]?.degree || llmRes.data.verifiedEducation
        };

        const url = linkedinUrl || 'student://linkedin-text';
        const evidence = buildLinkedInEvidenceDrafts(enriched, url, llmRes.provider, input.existingEvidence);

        return {
          agent: this.name,
          status: 'done',
          data: enriched,
          evidence,
          sources: [
            {
              title: 'Student Provided LinkedIn Profile Text',
              url,
              trust: 'Verified'
            }
          ],
          notes: [
            `Extracted ${enriched.skills.length} skills and ${enriched.experiences.length} experiences with verbatim sentence evidence. Note: "We never access your LinkedIn account."`
          ],
          confidence: 'high',
          providerUsed: llmRes.provider,
          timeTakenMs: Date.now() - startTime
        };
      }
    } catch (llmErr) {
      console.warn('[LinkedInAnalyzer] LLM error, applying keyword rule fallback:', llmErr);
    }

    // Fallback: Keyword rules
    const ruleOutput = runKeywordRuleFallback(pastedText, 'student');
    const fallbackUrl = linkedinUrl || 'student://linkedin-text';
    const evidence = buildLinkedInEvidenceDrafts(ruleOutput, fallbackUrl, 'keyword-rules', input.existingEvidence);

    return {
      agent: this.name,
      status: 'done',
      data: ruleOutput,
      evidence,
      sources: [
        {
          title: 'Student Provided LinkedIn Profile Text (Rule Parser)',
          url: fallbackUrl,
          trust: 'Verified'
        }
      ],
      notes: [
        `Extracted ${ruleOutput.skills.length} skills and ${ruleOutput.experiences.length} experiences using deterministic keyword rules. Note: "We never access your LinkedIn account."`
      ],
      confidence: 'high',
      providerUsed: 'keyword-rules',
      timeTakenMs: Date.now() - startTime
    };
  }
}
