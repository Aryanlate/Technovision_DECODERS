import crypto from 'crypto';
import { ProviderCallStats, ProviderRateLimits, ProviderHealthStatus, LLMProvider } from './types.js';
import { getProviderRateLimits } from './config.js';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Tracks rate limits, call statistics, and prompt response caching.
 */
export class GatewayTracker {
  // Provider stats
  private stats: Map<string, ProviderCallStats> = new Map();

  // Sliding window timestamps for RPM (timestamps in ms)
  private rpmTimestamps: Map<string, number[]> = new Map();

  // Daily counter for RPD
  private rpdDate: string = new Date().toISOString().slice(0, 10);
  private rpdCounts: Map<string, number> = new Map();

  // In-memory 10-minute prompt cache
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.cleanExpiredCacheInterval();
  }

  private cleanExpiredCacheInterval() {
    // Periodically evict expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref?.();
  }

  /**
   * Resets daily counters if date has rolled over.
   */
  private checkDailyRollover() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.rpdDate) {
      this.rpdDate = today;
      this.rpdCounts.clear();
    }
  }

  /**
   * Generates a cache key for identical prompts using SHA-256 digest.
   */
  generateCacheKey(agentName: string, system: string = '', prompt: string = '', needsSearch: boolean = false): string {
    const content = `${agentName}|${needsSearch ? 'search' : 'plain'}|${system}|${prompt}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Retrieves an entry from cache if within 10-minute TTL.
   */
  getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Stores an entry in cache for 10 minutes.
   */
  setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Checks if a provider has room within its RPM and RPD limits.
   */
  canMakeRequest(providerName: string): { allowed: boolean; reason?: string; limits: ProviderRateLimits } {
    this.checkDailyRollover();
    const limits = getProviderRateLimits(providerName);
    const now = Date.now();

    // Clean up RPM timestamps older than 60 seconds
    const timestamps = (this.rpmTimestamps.get(providerName) || []).filter((t) => now - t < 60000);
    this.rpmTimestamps.set(providerName, timestamps);

    const currentRpm = timestamps.length;
    const currentRpd = this.rpdCounts.get(providerName) || 0;

    const rateLimits: ProviderRateLimits = {
      rpmLimit: limits.rpm,
      rpdLimit: limits.rpd,
      currentRpm,
      currentRpd
    };

    if (currentRpm >= limits.rpm) {
      return {
        allowed: false,
        reason: `RPM limit reached (${currentRpm}/${limits.rpm})`,
        limits: rateLimits
      };
    }

    if (currentRpd >= limits.rpd) {
      return {
        allowed: false,
        reason: `RPD limit reached (${currentRpd}/${limits.rpd})`,
        limits: rateLimits
      };
    }

    return { allowed: true, limits: rateLimits };
  }

  /**
   * Records an outgoing request attempt against rate limit windows.
   */
  recordRequestAttempt(providerName: string): void {
    const now = Date.now();
    const timestamps = this.rpmTimestamps.get(providerName) || [];
    timestamps.push(now);
    this.rpmTimestamps.set(providerName, timestamps);

    const currentRpd = this.rpdCounts.get(providerName) || 0;
    this.rpdCounts.set(providerName, currentRpd + 1);
  }

  /**
   * Records the outcome of an LLM request for visibility and auditing.
   */
  recordCallResult(
    providerName: string,
    success: boolean,
    is429: boolean = false,
    tokens: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {}
  ): void {
    const current = this.stats.get(providerName) || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rateLimit429Count: 0,
      totalTokens: 0
    };

    current.totalCalls += 1;
    if (success) {
      current.successfulCalls += 1;
    } else {
      current.failedCalls += 1;
    }

    if (is429) {
      current.rateLimit429Count += 1;
    }

    current.totalTokens += tokens.totalTokens || (tokens.promptTokens || 0) + (tokens.completionTokens || 0);
    current.lastCallTimestamp = new Date().toISOString();

    this.stats.set(providerName, current);
  }

  /**
   * Returns current statistics for a provider.
   */
  getStats(providerName: string): ProviderCallStats {
    return (
      this.stats.get(providerName) || {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        rateLimit429Count: 0,
        totalTokens: 0
      }
    );
  }

  /**
   * Returns health and rate limit status across all registered providers.
   */
  getHealthReport(providers: Map<string, LLMProvider>): ProviderHealthStatus[] {
    const report: ProviderHealthStatus[] = [];

    for (const [name, provider] of providers.entries()) {
      const limits = getProviderRateLimits(name);
      const now = Date.now();
      const timestamps = (this.rpmTimestamps.get(name) || []).filter((t) => now - t < 60000);
      const currentRpm = timestamps.length;
      const currentRpd = this.rpdCounts.get(name) || 0;

      const stats = this.getStats(name);
      const configured = provider.isConfigured();
      const recentlyWorking = configured && (stats.successfulCalls > 0 || (stats.failedCalls === 0 && stats.rateLimit429Count === 0));

      report.push({
        name,
        configured,
        recentlyWorking,
        model: provider.getModel(),
        capabilities: provider.capabilities,
        rateLimits: {
          rpmLimit: limits.rpm,
          rpdLimit: limits.rpd,
          currentRpm,
          currentRpd
        },
        stats
      });
    }

    return report;
  }
}

export const gatewayTracker = new GatewayTracker();
