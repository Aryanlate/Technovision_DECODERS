import { z } from 'zod';

export interface ProviderCapabilities {
  supportsJsonMode: boolean;
  supportsWebSearch: boolean;
}

export interface ProviderUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface GenerateOptions {
  system?: string;
  prompt: string;
  schema?: z.ZodType<any>;
  tools?: any[];
  temperature?: number;
  timeoutMs?: number;
  needsWebSearch?: boolean;
  model?: string;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
}

export interface GenerateResult {
  text: string;
  json?: any;
  sources?: string[];
  usage?: ProviderUsage;
}

/**
 * Universal interface for all LLM providers in OpportunityKit.
 */
export interface LLMProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  isConfigured(): boolean;
  getModel(): string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
}

export interface AskAgentOptions<T = any> {
  system?: string;
  prompt: string;
  // Input type is intentionally `any`: schemas with `.default()` accept optional
  // input while producing a fully-populated `T` on success.
  schema?: z.ZodType<T, any, any>;
  tools?: any[];
  needsWebSearch?: boolean;
  temperature?: number;
  timeoutMs?: number;
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language?: string;
}

export interface AskAgentResult<T = any> {
  data: T | null;
  rawText: string;
  provider: string;
  model: string;
  sources: string[];
  cached: boolean;
  usage?: ProviderUsage;
  retries?: number;
}

export interface ProviderCallStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rateLimit429Count: number;
  totalTokens: number;
  lastCallTimestamp?: string;
}

export interface ProviderRateLimits {
  rpmLimit: number;
  rpdLimit: number;
  currentRpm: number;
  currentRpd: number;
}

export interface ProviderHealthStatus {
  name: string;
  configured: boolean;
  recentlyWorking?: boolean;
  model: string;
  capabilities: ProviderCapabilities;
  rateLimits: ProviderRateLimits;
  stats: ProviderCallStats;
}
