import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
  gatewayRegistry,
  askAgentLLM,
  gatewayTracker
} from '../src/lib/llm/index.js';

// Test Schema
const TestOutputSchema = z.object({
  title: z.string(),
  isEligible: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low'])
});
type TestOutput = z.infer<typeof TestOutputSchema>;

/**
 * Mock LLM Provider for unit tests.
 */
class MockLLMProvider implements LLMProvider {
  public readonly name: string;
  public readonly capabilities = {
    supportsJsonMode: true,
    supportsWebSearch: false
  };
  public isConfiguredReturn = true;
  public mockModel = 'mock-model-v1';
  public generateFn: (options: GenerateOptions) => Promise<GenerateResult>;

  constructor(name: string, generateFn?: (options: GenerateOptions) => Promise<GenerateResult>) {
    this.name = name;
    this.generateFn =
      generateFn ||
      (async () => ({
        text: '{"title":"Test","isEligible":true,"confidence":"high"}',
        json: { title: 'Test', isEligible: true, confidence: 'high' },
        sources: ['https://example.com/source'],
        usage: { totalTokens: 42 }
      }));
  }

  isConfigured(): boolean {
    return this.isConfiguredReturn;
  }

  getModel(): string {
    return this.mockModel;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    return this.generateFn(options);
  }
}

describe('LLM Gateway & askAgentLLM Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Test 1: Valid JSON response
  // ==========================================================================
  it('1. should return validated JSON data when provider responds with valid schema', async () => {
    const mockPrimary = new MockLLMProvider('mock-primary', async () => ({
      text: '{"title":"Summer Intern","isEligible":true,"confidence":"high"}',
      json: { title: 'Summer Intern', isEligible: true, confidence: 'high' },
      sources: ['https://careers.example.com'],
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }));

    gatewayRegistry.register(mockPrimary);

    // Point test agent to mock-primary
    process.env.AGENT_TEST_EXTRACTOR_PROVIDER = 'mock-primary';

    const result = await askAgentLLM<TestOutput>('test_extractor', {
      system: 'You are an evidence extractor.',
      prompt: 'Extract criteria from listing: Summer Intern 2026',
      schema: TestOutputSchema,
      temperature: 0
    });

    expect(result).not.toBeNull();
    expect(result?.data).toEqual({
      title: 'Summer Intern',
      isEligible: true,
      confidence: 'high'
    });
    expect(result?.provider).toBe('mock-primary');
    expect(result?.cached).toBe(false);
    expect(result?.sources).toContain('https://careers.example.com');
  });

  // ==========================================================================
  // Test 2: Invalid JSON then retry
  // ==========================================================================
  it('2. should retry once on invalid JSON and succeed if second attempt produces valid schema', async () => {
    let callCount = 0;
    const mockRetryProvider = new MockLLMProvider('mock-retry', async (opts) => {
      callCount++;
      if (callCount === 1) {
        // First attempt returns invalid non-JSON output
        return {
          text: 'Sure, here is your answer: The student looks eligible for this internship!',
          sources: []
        };
      }
      // Second attempt (retry) returns valid schema
      return {
        text: '{"title":"Retry Success","isEligible":true,"confidence":"medium"}',
        json: { title: 'Retry Success', isEligible: true, confidence: 'medium' },
        sources: ['https://example.com/retry-proof']
      };
    });

    gatewayRegistry.register(mockRetryProvider);
    process.env.AGENT_TEST_RETRY_PROVIDER = 'mock-retry';

    const result = await askAgentLLM<TestOutput>('test_retry', {
      system: 'Extract JSON criteria',
      prompt: 'Check opportunity criteria with retry simulation ' + Date.now(),
      schema: TestOutputSchema
    });

    expect(callCount).toBe(2);
    expect(result).not.toBeNull();
    expect(result?.data?.title).toBe('Retry Success');
    expect(result?.retries).toBe(1);
    expect(result?.provider).toBe('mock-retry');
  });

  // ==========================================================================
  // Test 3: Timeout then fallback to next provider
  // ==========================================================================
  it('3. should fall back to next provider when primary provider times out', async () => {
    // Primary provider throws timeout
    const mockTimeoutPrimary = new MockLLMProvider('mock-timeout-p1', async () => {
      const err: any = new Error('[mock-timeout-p1] Request timed out after 8000ms');
      err.isTimeout = true;
      throw err;
    });

    // Fallback provider succeeds
    const mockFallbackP2 = new MockLLMProvider('mock-fallback-p2', async () => ({
      text: '{"title":"Fallback Internship","isEligible":true,"confidence":"high"}',
      json: { title: 'Fallback Internship', isEligible: true, confidence: 'high' },
      sources: ['https://fallback.example.com']
    }));

    gatewayRegistry.register(mockTimeoutPrimary);
    gatewayRegistry.register(mockFallbackP2);

    process.env.AGENT_TEST_TIMEOUT_PROVIDER = 'mock-timeout-p1';
    process.env.LLM_FALLBACK_ORDER = 'mock-fallback-p2';

    const result = await askAgentLLM<TestOutput>('test_timeout', {
      prompt: 'Prompt testing timeout fallback ' + Date.now(),
      schema: TestOutputSchema
    });

    expect(result).not.toBeNull();
    expect(result?.provider).toBe('mock-fallback-p2');
    expect(result?.data?.title).toBe('Fallback Internship');
  });

  // ==========================================================================
  // Test 4: All providers failing -> returns null
  // ==========================================================================
  it('4. should return null safely when all candidate providers fail', async () => {
    const mockFailing1 = new MockLLMProvider('mock-fail-1', async () => {
      throw new Error('500 Internal Server Error');
    });

    const mockFailing2 = new MockLLMProvider('mock-fail-2', async () => {
      const err: any = new Error('429 Quota Exceeded');
      err.status = 429;
      throw err;
    });

    gatewayRegistry.register(mockFailing1);
    gatewayRegistry.register(mockFailing2);

    process.env.AGENT_TEST_FAILALL_PROVIDER = 'mock-fail-1';
    process.env.LLM_FALLBACK_ORDER = 'mock-fail-2';

    const result = await askAgentLLM<TestOutput>('test_failall', {
      prompt: 'Prompt testing all failing ' + Date.now(),
      schema: TestOutputSchema
    });

    // Gateway must return null so agents safely fall back to deterministic rule engine
    expect(result).toBeNull();
  });

  // ==========================================================================
  // Test 5: 10-Minute Prompt Cache
  // ==========================================================================
  it('5. should return cached result on identical prompt within 10-minute TTL', async () => {
    let executionCalls = 0;
    const mockCacheProvider = new MockLLMProvider('mock-cache-p', async () => {
      executionCalls++;
      return {
        text: '{"title":"Cached Item","isEligible":true,"confidence":"high"}',
        json: { title: 'Cached Item', isEligible: true, confidence: 'high' }
      };
    });

    gatewayRegistry.register(mockCacheProvider);
    process.env.AGENT_TEST_CACHE_PROVIDER = 'mock-cache-p';

    const promptText = 'Exact identical prompt for cache test ' + Date.now();

    // Call 1
    const res1 = await askAgentLLM<TestOutput>('test_cache', {
      prompt: promptText,
      schema: TestOutputSchema
    });
    expect(executionCalls).toBe(1);
    expect(res1?.cached).toBe(false);

    // Call 2 (identical prompt)
    const res2 = await askAgentLLM<TestOutput>('test_cache', {
      prompt: promptText,
      schema: TestOutputSchema
    });
    // Should NOT have called provider again
    expect(executionCalls).toBe(1);
    expect(res2?.cached).toBe(true);
    expect(res2?.data?.title).toBe('Cached Item');
  });

  // ==========================================================================
  // Test 6: Web Search Capability Gating
  // ==========================================================================
  it('6. should only route search-needing agents to providers that support web search', async () => {
    const noSearchProvider = new MockLLMProvider('mock-no-search');
    // supportsWebSearch is false by default on mock

    const searchProvider = new MockLLMProvider('mock-with-search');
    (searchProvider as any).capabilities = {
      supportsJsonMode: true,
      supportsWebSearch: true
    };

    gatewayRegistry.register(noSearchProvider);
    gatewayRegistry.register(searchProvider);

    process.env.AGENT_TEST_SEARCH_PROVIDER = 'mock-no-search';
    process.env.LLM_FALLBACK_ORDER = 'mock-with-search';

    const result = await askAgentLLM<TestOutput>('test_search', {
      prompt: 'Search grounded prompt ' + Date.now(),
      needsWebSearch: true,
      schema: TestOutputSchema
    });

    expect(result).not.toBeNull();
    // Must have bypassed mock-no-search because it lacked supportsWebSearch capability
    expect(result?.provider).toBe('mock-with-search');
  });

  // ==========================================================================
  // Test 7: Provider Health Report Security (Never leak API keys)
  // ==========================================================================
  it('7. should report health with configuration status and rate limits without exposing API keys', () => {
    const health = gatewayRegistry.getHealth();
    expect(Array.isArray(health)).toBe(true);
    expect(health.length).toBeGreaterThan(0);

    for (const item of health) {
      expect(typeof item.name).toBe('string');
      expect(typeof item.configured).toBe('boolean');
      expect(typeof item.model).toBe('string');
      expect(typeof item.capabilities.supportsJsonMode).toBe('boolean');
      expect(typeof item.capabilities.supportsWebSearch).toBe('boolean');
      expect(typeof item.rateLimits.rpmLimit).toBe('number');
      expect(typeof item.rateLimits.rpdLimit).toBe('number');
      expect(typeof item.stats.totalCalls).toBe('number');

      // CRITICAL: Ensure no API keys or secret tokens are leaked anywhere
      const serialized = JSON.stringify(item);
      expect(serialized).not.toContain('apiKey');
      expect(serialized).not.toContain('AIza'); // Common Google key prefix
      expect(serialized).not.toContain('gsk_'); // Common Groq key prefix
      expect(serialized).not.toContain('sk-'); // Common OpenAI key prefix
    }
  });

  // ==========================================================================
  // Test 8: Call Counter and Token Visibility
  // ==========================================================================
  it('8. should increment call counters and record rate limit status for visibility', () => {
    gatewayTracker.recordCallResult('gemini', true, false, { promptTokens: 50, completionTokens: 100, totalTokens: 150 });
    const stats = gatewayTracker.getStats('gemini');
    expect(stats.totalCalls).toBeGreaterThan(0);
    expect(stats.successfulCalls).toBeGreaterThan(0);
    expect(stats.totalTokens).toBeGreaterThanOrEqual(150);
  });
});

