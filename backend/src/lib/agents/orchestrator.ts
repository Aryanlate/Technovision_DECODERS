import crypto from 'crypto';
import {
  Agent,
  AgentResult,
  AgentProgressEvent,
  AgentSuggestion,
  OrchestratorRunInput,
  OrchestratorRunOutput,
  ProgressCallback,
  StudentProfile
} from './types.js';
import { OpportunityReader } from './opportunityReader.js';
import { GitHubAnalyzer } from './githubAnalyzer.js';
import { LinkedInAnalyzer } from './linkedinAnalyzer.js';
import { ResearchAgent } from './researchAgent.js';
import { VerifierAgent } from './verifierAgent.js';
import { DiscoveryAgent } from './discoveryAgent.js';

/**
 * Plain TypeScript Orchestrator (Not an LLM).
 * 
 * Features:
 * 1. Plans and runs agents in structured dependency order.
 * 2. Runs independent agents in parallel (e.g. OpportunityReader, GitHubAnalyzer, LinkedInAnalyzer).
 * 3. Emits progress events (queued, running, done, failed) via callback.
 * 4. Fault-tolerant: never lets one failed agent stop the whole flow.
 * 5. Generates structured Suggestions for the Suggestions Inbox.
 */
export class Orchestrator {
  private opportunityReader = new OpportunityReader();
  private githubAnalyzer = new GitHubAnalyzer();
  private linkedinAnalyzer = new LinkedInAnalyzer();
  private researchAgent = new ResearchAgent();
  private verifierAgent = new VerifierAgent();
  private discoveryAgent = new DiscoveryAgent();

  /**
   * Executes the full multi-agent workflow.
   */
  async run(
    input: OrchestratorRunInput,
    onProgress?: ProgressCallback
  ): Promise<OrchestratorRunOutput> {
    const orchestrationStartTime = Date.now();
    const orchestrationId = `orch-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    const results: Record<string, AgentResult> = {};
    const events: AgentProgressEvent[] = [];
    const suggestions: AgentSuggestion[] = [];

    const emit = (event: AgentProgressEvent) => {
      events.push(event);
      if (onProgress) {
        try {
          onProgress(event);
        } catch {
          // Prevent listener errors from stopping execution
        }
      }
    };

    // Planned agents
    const allAgentNames = [
      'OpportunityReader',
      'GitHubAnalyzer',
      'LinkedInAnalyzer',
      'VerifierAgent',
      'ResearchAgent',
      'DiscoveryAgent'
    ];

    const activeAgentNames = input.agentFilter && input.agentFilter.length > 0
      ? allAgentNames.filter((name) => input.agentFilter!.includes(name))
      : allAgentNames;

    // 1. Emit Initial "queued" event for all planned agents
    for (const name of activeAgentNames) {
      emit({
        agent: name,
        status: 'queued',
        message: 'Queued in orchestrator pipeline'
      });
    }

    const runSafe = async (
      agentName: string,
      agentFn: () => Promise<AgentResult>
    ): Promise<AgentResult> => {
      emit({
        agent: agentName,
        status: 'running',
        message: 'Processing...'
      });

      const start = Date.now();
      try {
        const result = await agentFn();
        const duration = Date.now() - start;

        emit({
          agent: agentName,
          status: result.status,
          timeTakenMs: duration,
          providerUsed: result.providerUsed,
          message: result.notes?.[0] || 'Finished'
        });

        results[agentName] = result;
        return result;
      } catch (err: any) {
        const duration = Date.now() - start;
        const failedResult: AgentResult = {
          agent: agentName,
          status: 'failed',
          data: null,
          sources: [],
          notes: [`Agent encountered error: ${err?.message || err}`],
          confidence: 'low',
          providerUsed: 'none',
          timeTakenMs: duration,
          error: err?.message || 'Agent execution failed'
        };

        emit({
          agent: agentName,
          status: 'failed',
          timeTakenMs: duration,
          providerUsed: 'none',
          message: failedResult.error
        });

        results[agentName] = failedResult;
        return failedResult;
      }
    };

    // ------------------------------------------------------------------------
    // STAGE 1: Parallel Opportunity Extraction & Candidate Discovery
    // ------------------------------------------------------------------------
    const stage1Promises: Promise<any>[] = [];

    if (activeAgentNames.includes('OpportunityReader')) {
      stage1Promises.push(
        runSafe('OpportunityReader', () =>
          this.opportunityReader.run({
            opportunityText: input.opportunityText,
            language: input.language
          })
        )
      );
    }

    if (activeAgentNames.includes('GitHubAnalyzer')) {
      stage1Promises.push(
        runSafe('GitHubAnalyzer', () =>
          this.githubAnalyzer.run({
            githubUrl: input.profile?.links?.github,
            profileSkills: input.profile?.skills,
            projects: input.profile?.projects,
            language: input.language
          })
        )
      );
    }

    if (activeAgentNames.includes('LinkedInAnalyzer')) {
      stage1Promises.push(
        runSafe('LinkedInAnalyzer', () =>
          this.linkedinAnalyzer.run({
            linkedinUrl: input.profile?.links?.linkedin,
            pastedText: (input as any).linkedInText || (input.profile as any)?.linkedInText,
            profile: input.profile,
            language: input.language
          })
        )
      );
    }

    await Promise.all(stage1Promises);

    // ------------------------------------------------------------------------
    // STAGE 2: Grounded Live Research (fills gaps the listing leaves open)
    // ------------------------------------------------------------------------
    const oppResult = results['OpportunityReader']?.data;
    const detectedOrg = oppResult?.title || 'Sponsoring Organization';

    if (activeAgentNames.includes('ResearchAgent')) {
      await runSafe('ResearchAgent', () =>
        this.researchAgent.run({
          organizationName: detectedOrg,
          opportunityTitle: oppResult?.title,
          opportunityText: input.opportunityText,
          language: input.language
        })
      );
    }

    // ------------------------------------------------------------------------
    // STAGE 3: Verification (labels every source). Runs after research so it can
    // label the researched sources as well as any links in the listing.
    // ------------------------------------------------------------------------
    if (activeAgentNames.includes('VerifierAgent')) {
      const researchedSources = (results['ResearchAgent']?.sources || []).map((s) => ({
        title: s.title,
        url: s.url
      }));

      await runSafe('VerifierAgent', () =>
        this.verifierAgent.run({
          profile: input.profile,
          opportunityText: input.opportunityText,
          sources: researchedSources
        })
      );
    }

    // ------------------------------------------------------------------------
    // STAGE 4: Related Opportunity Discovery
    // ------------------------------------------------------------------------
    if (activeAgentNames.includes('DiscoveryAgent')) {
      await runSafe('DiscoveryAgent', () =>
        this.discoveryAgent.run({
          profile: input.profile,
          opportunityTitle: oppResult?.title,
          language: input.language
        })
      );
    }

    // ------------------------------------------------------------------------
    // EXTRACT SUGGESTIONS FOR THE SUGGESTIONS INBOX
    // ------------------------------------------------------------------------
    const existingSkills = new Set((input.profile?.skills || []).map((s) => s.toLowerCase().trim()));

    // 1. Suggestions from GitHub (Skills & Verified Projects)
    const githubData = results['GitHubAnalyzer']?.data;
    if (githubData) {
      // Skills from GitHub
      const ghSkills = githubData.suggestedSkills || [];
      for (const item of ghSkills) {
        const skillName = typeof item === 'string' ? item : item.skill;
        const evidenceRepos = Array.isArray(item?.evidence) ? item.evidence.join(', ') : 'GitHub repository';
        const norm = (skillName || '').toLowerCase().trim();
        if (norm && !existingSkills.has(norm)) {
          existingSkills.add(norm); // Deduplicate
          suggestions.push({
            id: `sug-gh-skill-${suggestions.length + 1}`,
            agent: 'GitHubAnalyzer',
            type: 'skill',
            title: `Add Skill: ${skillName}`,
            description: `Cited from repository evidence: ${evidenceRepos}`,
            value: skillName,
            confidence: item.confidence || 'high',
            sources: results['GitHubAnalyzer']?.sources || [],
            status: 'pending'
          });
        }
      }

      // Projects from GitHub
      const ghProjects = githubData.suggestedProjects || [];
      const existingProjectTitles = new Set(
        (input.profile?.projects || []).map((p: any) => (p.title || '').toLowerCase().trim())
      );
      for (const proj of ghProjects) {
        const pNorm = (proj.title || '').toLowerCase().trim();
        if (pNorm && !existingProjectTitles.has(pNorm)) {
          existingProjectTitles.add(pNorm);
          suggestions.push({
            id: `sug-gh-proj-${suggestions.length + 1}`,
            agent: 'GitHubAnalyzer',
            type: 'project',
            title: `Add Project: ${proj.title}`,
            description: `${proj.domain || 'Software'} project built with ${proj.tech?.join(', ') || 'code'}. Proof: ${proj.proofLink}`,
            value: {
              title: proj.title,
              domains: [proj.domain || 'Software Engineering'],
              tech: proj.tech || [],
              role: 'Developer / Author',
              status: 'completed',
              proofLink: proj.proofLink
            },
            confidence: proj.confidence || 'high',
            sources: results['GitHubAnalyzer']?.sources || [],
            status: 'pending'
          });
        }
      }
    }

    // 2. Suggestions from LinkedIn (Skills & Experiences)
    const linkedinData = results['LinkedInAnalyzer']?.data;
    if (linkedinData) {
      // Skills from LinkedIn
      const liSkills = linkedinData.skills || (linkedinData.suggestedSkills || []).map((s: string) => ({ skill: s, sentence: 'Extracted from LinkedIn text', confidence: 'high' }));
      for (const item of liSkills) {
        const skillName = typeof item === 'string' ? item : item.skill;
        const sentence = typeof item === 'object' && item.sentence ? ` "${item.sentence}"` : '';
        const norm = (skillName || '').toLowerCase().trim();
        if (norm && !existingSkills.has(norm)) {
          existingSkills.add(norm);
          suggestions.push({
            id: `sug-li-skill-${suggestions.length + 1}`,
            agent: 'LinkedInAnalyzer',
            type: 'skill',
            title: `Add Skill: ${skillName}`,
            description: `Extracted from LinkedIn text:${sentence}`,
            value: skillName,
            confidence: (item as any).confidence || 'high',
            sources: results['LinkedInAnalyzer']?.sources || [],
            status: 'pending'
          });
        }
      }

      // Experiences from LinkedIn
      const liExperiences = linkedinData.experiences || [];
      for (const exp of liExperiences) {
        suggestions.push({
          id: `sug-li-exp-${suggestions.length + 1}`,
          agent: 'LinkedInAnalyzer',
          type: 'project',
          title: `Add Experience: ${exp.title} at ${exp.company}`,
          description: `Extracted from sentence: "${exp.sentence}"${exp.duration ? ` (${exp.duration})` : ''}`,
          value: {
            title: `${exp.title} - ${exp.company}`,
            domains: ['Professional Experience'],
            tech: [],
            role: exp.title,
            status: 'completed',
            proofLink: input.profile?.links?.linkedin || 'https://linkedin.com'
          },
          confidence: exp.confidence || 'high',
          sources: results['LinkedInAnalyzer']?.sources || [],
          status: 'pending'
        });
      }
    }

    const totalTimeMs = Date.now() - orchestrationStartTime;

    return {
      orchestrationId,
      timestamp,
      results,
      events,
      suggestions,
      totalTimeMs
    };
  }
}

export const orchestrator = new Orchestrator();
