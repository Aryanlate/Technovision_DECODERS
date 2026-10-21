import { askAgentLLM } from './index.js';

export interface LLMRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface LLMResponse<T = any> {
  provider: string;
  model: string;
  data: T;
  rawText?: string;
  confidence: number;
  cached: boolean;
}

/**
 * Backward-compatible LLM Gateway adapter delegating to the unified askAgentLLM gateway.
 */
export class LLMGateway {
  private demoMode: boolean;

  constructor() {
    this.demoMode = process.env.DEMO_MODE === 'true';
  }

  async execute<T>(
    prompt: string,
    options: LLMRequestOptions = {},
    fallbackDemoData: T
  ): Promise<LLMResponse<T>> {
    if (this.demoMode) {
      return {
        provider: 'cache',
        model: 'demo-cache',
        data: fallbackDemoData,
        confidence: 0.98,
        cached: true
      };
    }

    try {
      const res = await askAgentLLM<T>('opportunity_extractor', {
        system: options.systemPrompt,
        prompt,
        temperature: options.temperature ?? 0
      });

      if (res && res.data !== null) {
        return {
          provider: res.provider,
          model: res.model,
          data: res.data,
          rawText: res.rawText,
          confidence: 0.95,
          cached: res.cached
        };
      }
    } catch (err: any) {
      console.warn('[LLMGateway] askAgentLLM call failed:', err?.message || err);
    }

    return {
      provider: 'cache',
      model: 'fallback-cache',
      data: fallbackDemoData,
      confidence: 0.9,
      cached: true
    };
  }
}

export const llmGateway = new LLMGateway();
