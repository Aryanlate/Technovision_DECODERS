import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubAnalyzer, extractGitHubUsername, fetchGitHubUserFacts } from '../src/lib/agents/githubAnalyzer.js';
import { LinkedInAnalyzer } from '../src/lib/agents/linkedinAnalyzer.js';
import { GITHUB_ANALYZER_SPEC, LINKEDIN_ANALYZER_SPEC } from '../src/lib/agents/specs.js';

describe('GitHubAnalyzer & LinkedInAnalyzer Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEMO_MODE;
    delete process.env.GITHUB_TOKEN;
  });

  // ==========================================================================
  // Test 1: GitHub Username Extraction
  // ==========================================================================
  it('1. should extract clean GitHub username from various URL formats', () => {
    expect(extractGitHubUsername('https://github.com/alexsharma')).toBe('alexsharma');
    expect(extractGitHubUsername('http://github.com/alexsharma/')).toBe('alexsharma');
    expect(extractGitHubUsername('github.com/alexsharma')).toBe('alexsharma');
    expect(extractGitHubUsername('alexsharma')).toBe('alexsharma');
    expect(extractGitHubUsername('')).toBeNull();
  });

  // ==========================================================================
  // Test 2: GitHubAnalyzer Demo Mode
  // ==========================================================================
  it('2. should return cached benchmark sample in DEMO_MODE with suggestedSkills and suggestedProjects', async () => {
    process.env.DEMO_MODE = 'true';
    const analyzer = new GitHubAnalyzer();
    const result = await analyzer.run({ githubUrl: 'https://github.com/alexsharma' });

    expect(result.status).toBe('done');
    expect(result.data).toBeDefined();
    expect(result.data?.username).toBe('alexsharma');
    expect(result.data?.suggestedSkills.length).toBeGreaterThan(0);
    expect(result.data?.suggestedProjects.length).toBeGreaterThan(0);

    // Verify schema adherence: every skill cites at least one repo name as evidence
    for (const skillItem of result.data!.suggestedSkills) {
      expect(skillItem.skill).toBeDefined();
      expect(Array.isArray(skillItem.evidence)).toBe(true);
      expect(skillItem.evidence.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(skillItem.confidence);
    }

    // Verify projects schema adherence
    for (const proj of result.data!.suggestedProjects) {
      expect(proj.title).toBeDefined();
      expect(Array.isArray(proj.tech)).toBe(true);
      expect(proj.proofLink).toContain('github.com');
      expect(['high', 'medium', 'low']).toContain(proj.confidence);
    }
  });

  // ==========================================================================
  // Test 3: GitHubAnalyzer Public API Fetching & 10-Minute Caching
  // ==========================================================================
  it('3. should fetch facts with plain code and cache results for 10 minutes', async () => {
    const mockRepos = [
      {
        name: 'campus-delivery',
        description: 'Campus ordering app',
        language: 'TypeScript',
        topics: ['react', 'nodejs'],
        stargazers_count: 14,
        html_url: 'https://github.com/testuser/campus-delivery',
        updated_at: '2026-10-12T00:00:00Z',
        fork: false
      },
      {
        name: 'iot-sensor',
        description: 'IoT sensor network',
        language: 'C++',
        topics: ['iot', 'arduino'],
        stargazers_count: 8,
        html_url: 'https://github.com/testuser/iot-sensor',
        updated_at: '2026-09-01T00:00:00Z',
        fork: false
      }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRepos
    } as any);

    const { facts, error } = await fetchGitHubUserFacts('testuser');
    expect(error).toBeUndefined();
    expect(facts).toBeDefined();
    expect(facts?.username).toBe('testuser');
    expect(facts?.repos.length).toBe(2);
    expect(facts?.topLanguages).toContain('TypeScript');
    expect(facts?.topLanguages).toContain('C++');
    expect(facts?.totalStars).toBe(22);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Call second time within 10 minutes -> must read from in-memory cache without fetch
    const secondCall = await fetchGitHubUserFacts('testuser');
    expect(secondCall.facts).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached, no second network request
  });

  // ==========================================================================
  // Test 4: GitHubAnalyzer Error Handling (Rate Limit & 404 User Not Found)
  // ==========================================================================
  it('4. should handle rate limits and non-existent users with clear messages', async () => {
    // Test 404 user not found
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as any);

    const notFoundRes = await fetchGitHubUserFacts('nonexistent-user-xyz');
    expect(notFoundRes.facts).toBeNull();
    expect(notFoundRes.error).toContain("GitHub user 'nonexistent-user-xyz' not found or profile is private");

    // Test 403 rate limit
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    } as any);

    const rateLimitRes = await fetchGitHubUserFacts('ratelimited-user');
    expect(rateLimitRes.facts).toBeNull();
    expect(rateLimitRes.error).toContain('GitHub API rate limit exceeded');
  });

  // ==========================================================================
  // Test 5: GitHubAnalyzer Rule Fallback maps languages and topics to skills
  // ==========================================================================
  it('5. should fall back to deterministic rule mapping languages and topics to skills when LLM unavailable', async () => {
    const mockRepos = [
      {
        name: 'web-portfolio',
        description: 'Personal web app',
        language: 'HTML',
        topics: ['css', 'javascript'],
        stargazers_count: 3,
        html_url: 'https://github.com/alexsharma/web-portfolio',
        updated_at: '2026-10-01T00:00:00Z',
        fork: false
      }
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRepos
    } as any);

    const analyzer = new GitHubAnalyzer();
    const result = await analyzer.run({ githubUrl: 'https://github.com/alexsharma' });

    expect(result.status).toBe('done');
    expect(result.data).toBeDefined();
    // Rule mapping should map HTML and CSS
    const skills = result.data?.suggestedSkills.map((s) => s.skill) || [];
    expect(skills).toContain('HTML');
    expect(skills).toContain('CSS');

    // Evidence citation must list the repo
    const htmlSkill = result.data?.suggestedSkills.find((s) => s.skill === 'HTML');
    expect(htmlSkill?.evidence).toContain('web-portfolio');
  });

  // ==========================================================================
  // Test 6: LinkedInAnalyzer Privacy Guarantee (Never Fetches URL)
  // ==========================================================================
  it('6. should never fetch the LinkedIn URL directly due to scraping blocks', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const analyzer = new LinkedInAnalyzer();

    await analyzer.run({ linkedinUrl: 'https://linkedin.com/in/alexsharma' });

    // Ensure no HTTP request was dispatched to linkedin.com
    const linkedinFetchCall = fetchSpy.mock.calls.find((call) =>
      String(call[0]).includes('linkedin.com')
    );
    expect(linkedinFetchCall).toBeUndefined();
  });

  // ==========================================================================
  // Test 7: LinkedInAnalyzer Keyword Rule Fallback with Sentence Citations
  // ==========================================================================
  it('7. should extract skills, education, and experience from pasted text with exact sentence citations and privacy note', async () => {
    const pastedText = `Currently a 2nd year B.Tech Computer Science student at National Institute of Technology.
Proficient in HTML, CSS and Python through software development coursework.
Worked as Student Web Coordinator at Campus Open Source Club for 6 months.`;

    const analyzer = new LinkedInAnalyzer();
    const result = await analyzer.run({
      linkedinUrl: 'https://linkedin.com/in/alexsharma',
      pastedText
    });

    expect(result.status).toBe('done');
    expect(result.data).toBeDefined();

    // Verify skills with sentence citations
    const skills = result.data?.skills || [];
    expect(skills.length).toBeGreaterThanOrEqual(3);
    const skillNames = skills.map((s) => s.skill);
    expect(skillNames).toContain('HTML');
    expect(skillNames).toContain('CSS');
    expect(skillNames).toContain('Python');

    const htmlSkill = skills.find((s) => s.skill === 'HTML');
    expect(htmlSkill?.sentence).toContain('Proficient in HTML, CSS and Python');

    // Verify education with sentence citation
    const edu = result.data?.education || [];
    expect(edu.length).toBeGreaterThanOrEqual(1);
    expect(edu[0].sentence).toContain('B.Tech');

    // Verify experience with sentence citation
    const exp = result.data?.experiences || [];
    expect(exp.length).toBeGreaterThanOrEqual(1);
    expect(exp[0].sentence).toContain('Campus Open Source Club');

    // Verify privacy note in notes
    const combinedNotes = result.notes.join(' ');
    expect(combinedNotes).toContain('We never access your LinkedIn account');
  });
});
