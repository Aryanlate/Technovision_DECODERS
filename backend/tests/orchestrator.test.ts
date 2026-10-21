import { describe, it, expect, beforeEach, vi } from 'vitest';
import { orchestrator, Orchestrator } from '../src/lib/agents/orchestrator.js';
import { agentRegistry } from '../src/lib/agents/index.js';
import { AgentProgressEvent } from '@opportunity-kit/shared';

describe('Agent Framework & Orchestrator Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
  });

  // ==========================================================================
  // Test 1: Registry check
  // ==========================================================================
  it('1. should have all core agents registered in the agent registry', () => {
    const names = agentRegistry.listNames();
    expect(names).toContain('OpportunityReader');
    expect(names).toContain('GitHubAnalyzer');
    expect(names).toContain('LinkedInAnalyzer');
    expect(names).toContain('ResearchAgent');
    expect(names).toContain('VerifierAgent');
    expect(names).toContain('DiscoveryAgent');
  });

  // ==========================================================================
  // Test 2: Orchestrator in DEMO_MODE
  // ==========================================================================
  it('2. should run full multi-agent pipeline in DEMO_MODE and return verified sample results', async () => {
    process.env.DEMO_MODE = 'true';

    const events: AgentProgressEvent[] = [];
    const output = await orchestrator.run(
      {
        opportunityText: '2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks.',
        profile: {
          name: 'Alex Sharma',
          year: 2,
          branch: 'CSE',
          cgpa: 8.2,
          skills: ['HTML', 'CSS', 'Python'],
          projects: [],
          links: {
            github: 'https://github.com/alexsharma',
            linkedin: 'https://linkedin.com/in/alexsharma',
            instagram: '',
            portfolio: ''
          }
        }
      },
      (ev) => events.push(ev)
    );

    expect(output).toBeDefined();
    expect(output.orchestrationId).toMatch(/^orch-/);
    expect(events.length).toBeGreaterThan(0);

    // Verify progress events emitted in proper progression
    const queuedEvents = events.filter((e) => e.status === 'queued');
    const runningEvents = events.filter((e) => e.status === 'running');
    const doneEvents = events.filter((e) => e.status === 'done');

    expect(queuedEvents.length).toBeGreaterThanOrEqual(5);
    expect(runningEvents.length).toBeGreaterThanOrEqual(5);
    expect(doneEvents.length).toBeGreaterThanOrEqual(5);

    // Verify all agents produced results
    expect(output.results['OpportunityReader']?.status).toBe('done');
    expect(output.results['GitHubAnalyzer']?.status).toBe('done');
    expect(output.results['LinkedInAnalyzer']?.status).toBe('done');
    expect(output.results['VerifierAgent']?.status).toBe('done');
    expect(output.results['ResearchAgent']?.status).toBe('done');
    expect(output.results['DiscoveryAgent']?.status).toBe('done');

    // Verify suggestions inbox populated with skills to accept/reject
    expect(output.suggestions.length).toBeGreaterThan(0);
    const gitHubSkillSug = output.suggestions.find((s) => s.agent === 'GitHubAnalyzer');
    expect(gitHubSkillSug).toBeDefined();
    expect(gitHubSkillSug?.status).toBe('pending');
  });

  // ==========================================================================
  // Test 3: Fault tolerance (Failed agent never stops the pipeline)
  // ==========================================================================
  it('3. should isolate agent failures so one failed agent never halts the whole flow', async () => {
    const customOrch = new Orchestrator();

    // Mock GitHubAnalyzer to throw an unhandled exception
    (customOrch as any).githubAnalyzer = {
      name: 'GitHubAnalyzer',
      run: async () => {
        throw new Error('Simulated GitHub API 500 Fatal Crash');
      }
    };

    const output = await customOrch.run({
      opportunityText: 'Simple test opportunity',
      profile: {
        skills: ['HTML'],
        projects: []
      }
    });

    // GitHubAnalyzer should be marked failed
    expect(output.results['GitHubAnalyzer']?.status).toBe('failed');
    expect(output.results['GitHubAnalyzer']?.error).toContain('Simulated GitHub API 500 Fatal Crash');

    // BUT all other agents must still finish successfully!
    expect(output.results['OpportunityReader']?.status).toBe('done');
    expect(output.results['VerifierAgent']?.status).toBe('done');
    expect(output.results['DiscoveryAgent']?.status).toBe('done');
  });

  // ==========================================================================
  // Test 4: Agent filtering
  // ==========================================================================
  it('4. should respect agentFilter to run only specified subset of agents', async () => {
    process.env.DEMO_MODE = 'true';

    const output = await orchestrator.run({
      opportunityText: 'Filter test',
      agentFilter: ['OpportunityReader', 'ResearchAgent']
    });

    expect(output.results['OpportunityReader']).toBeDefined();
    expect(output.results['ResearchAgent']).toBeDefined();
    expect(output.results['GitHubAnalyzer']).toBeUndefined();
    expect(output.results['LinkedInAnalyzer']).toBeUndefined();
  });
});
