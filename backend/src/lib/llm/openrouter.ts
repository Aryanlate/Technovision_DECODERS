import { OpenAICompatibleProvider } from './openaiCompatible.js';

/**
 * OpenRouter Provider (Free Community Models Fallback).
 * Prefers models ending in :free (e.g. meta-llama/llama-3.3-70b-instruct:free).
 */
export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      name: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKeyEnvVar: 'OPENROUTER_API_KEY',
      modelEnvVar: 'OPENROUTER_MODEL',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      capabilities: {
        supportsJsonMode: true,
        supportsWebSearch: false
      },
      customHeaders: {
        'HTTP-Referer': 'https://opportunitykit.setu.edu',
        'X-Title': 'OpportunityKit (SETU 2026 Hackathon)'
      }
    });
  }
}
