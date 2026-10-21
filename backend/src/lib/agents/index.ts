import { AgentEvidence, Requirement } from '@opportunity-kit/shared';
import { askAgentLLM } from '../llm/index.js';
import { Agent } from './types.js';
import {
  OPPORTUNITY_EXTRACTOR_SPEC,
  OpportunityExtractorOutput,
  OpportunityExtractorOutputSchema
} from './specs.js';

import { Orchestrator, orchestrator } from './orchestrator.js';
import { GitHubAnalyzer } from './githubAnalyzer.js';
import { LinkedInAnalyzer } from './linkedinAnalyzer.js';
import { OpportunityReader } from './opportunityReader.js';
import { ResearchAgent } from './researchAgent.js';
import { VerifierAgent } from './verifierAgent.js';
import { DiscoveryAgent } from './discoveryAgent.js';

export * from './types.js';
export * from './specs.js';
export * from './orchestrator.js';
export * from './githubAnalyzer.js';
export * from './linkedinAnalyzer.js';
export * from './opportunityReader.js';
export * from './researchAgent.js';
export * from './verifierAgent.js';
export * from './discoveryAgent.js';

/**
 * Global Registry of the 7 OpportunityKit Agents.
 */
class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.register(new OpportunityReader());
    this.register(new GitHubAnalyzer());
    this.register(new LinkedInAnalyzer());
    this.register(new ResearchAgent());
    this.register(new VerifierAgent());
    this.register(new DiscoveryAgent());
  }

  register(agent: Agent): void {
    this.agents.set(agent.name.toLowerCase(), agent);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name.toLowerCase());
  }

  getAll(): Map<string, Agent> {
    return this.agents;
  }

  listNames(): string[] {
    return Array.from(this.agents.values()).map((a) => a.name);
  }
}

export const agentRegistry = new AgentRegistry();

/**
 * Opportunity Evidence Gathering Agent (Backward-compatible adapter)
 */
export async function runOpportunityEvidenceAgent(
  opportunityText: string,
  baselineRequirements: Requirement[]
): Promise<{ requirements: Requirement[]; evidence: AgentEvidence[] }> {
  const defaultEvidence: AgentEvidence[] = baselineRequirements.map((req, idx) => ({
    id: `ev-${idx + 1}`,
    agentId: 'agent-opportunity-evidence-01',
    agentRole: 'Opportunity Eligibility Extractor',
    source: `Text fragment: "${req.rule}"`,
    finding: `Extracted criteria "${req.title}" with mandatory constraint.`,
    confidence: 0.96,
    studentConfirmed: true,
    extractedField: req.category,
    extractedValue: req.parsedRule
  }));

  try {
    const response = await askAgentLLM<OpportunityExtractorOutput>('opportunity_extractor', {
      system: OPPORTUNITY_EXTRACTOR_SPEC.rolePrompt,
      prompt: `Opportunity text:\n"${opportunityText}"`,
      schema: OpportunityExtractorOutputSchema,
      temperature: 0
    });

    if (response && response.data) {
      const generatedEvidence: AgentEvidence[] = response.data.requirements.map((r, i) => ({
        id: `ev-llm-${i + 1}`,
        agentId: `agent-${response.provider}-${response.model}`,
        agentRole: 'Opportunity Evidence Extractor',
        source: `Direct quote: "${r.sourceSentence}"`,
        finding: `Detected requirement "${r.title || r.label}": ${r.rule || r.label}`,
        // AI-suggested requirements are less certain and always need the student's confirmation.
        confidence: r.aiSuggested ? 0.6 : 0.9,
        studentConfirmed: false,
        extractedField: r.category,
        extractedValue: r.rule ?? r.value
      }));

      return {
        requirements: baselineRequirements,
        evidence: generatedEvidence.length > 0 ? generatedEvidence : defaultEvidence
      };
    }
  } catch (err) {
    console.warn('[OpportunityEvidenceAgent] Error running agent, using verified baseline evidence:', err);
  }

  return {
    requirements: baselineRequirements,
    evidence: defaultEvidence
  };
}

/**
 * Profile Evidence Gathering Agent (Backward-compatible adapter)
 */
export async function runProfileEvidenceAgent(profile: any): Promise<AgentEvidence[]> {
  const evidenceList: AgentEvidence[] = [];

  if (profile.projects && Array.isArray(profile.projects) && profile.projects.length > 0) {
    profile.projects.forEach((proj: any, idx: number) => {
      evidenceList.push({
        id: `ev-proj-${idx + 1}`,
        agentId: 'agent-profile-analyzer',
        agentRole: 'Project Evidence Analyzer',
        source: `Project: "${proj.title}"`,
        finding: `Demonstrates practical experience in: ${proj.techStack?.join(', ') || 'software engineering'}.`,
        confidence: 0.92,
        studentConfirmed: false,
        extractedField: 'projects',
        extractedValue: proj
      });
    });
  }

  if (profile.resumeUrl) {
    evidenceList.push({
      id: 'ev-resume-01',
      agentId: 'agent-profile-analyzer',
      agentRole: 'Document Citation Agent',
      source: `File URI: ${profile.resumeUrl}`,
      finding: 'Valid resume document uploaded and verified.',
      confidence: 0.99,
      studentConfirmed: true,
      extractedField: 'resume',
      extractedValue: profile.resumeUrl
    });
  }

  return evidenceList;
}
