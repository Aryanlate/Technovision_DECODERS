import { OpenAICompatibleProvider } from './openaiCompatible.js';

/**
 * OpenAI Provider (Optional Paid Tier for users with API credits).
 * Uses GPT-4o Mini (or model specified via OPENAI_MODEL).
 */
export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyEnvVar: 'OPENAI_API_KEY',
      modelEnvVar: 'OPENAI_MODEL',
      defaultModel: 'gpt-4o-mini',
      capabilities: {
        supportsJsonMode: true,
        supportsWebSearch: false
      }
    });
  }
}
