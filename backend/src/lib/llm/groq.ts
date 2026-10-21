import { OpenAICompatibleProvider } from './openaiCompatible.js';

/**
 * Groq Provider (High-speed Free Tier Fallback).
 * Uses Llama 3.3 70B (or model specified via GROQ_MODEL).
 */
export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      name: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKeyEnvVar: 'GROQ_API_KEY',
      modelEnvVar: 'GROQ_MODEL',
      defaultModel: 'llama-3.3-70b-versatile',
      capabilities: {
        supportsJsonMode: true,
        supportsWebSearch: false
      }
    });
  }
}
