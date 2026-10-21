import { OpenAICompatibleProvider } from './openaiCompatible.js';

/**
 * xAI / Grok Provider (Optional Paid Tier for users with xAI API credits).
 * Uses Grok Beta (or model specified via XAI_MODEL).
 */
export class XAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      name: 'xai',
      baseUrl: 'https://api.x.ai/v1',
      apiKeyEnvVar: 'XAI_API_KEY',
      modelEnvVar: 'XAI_MODEL',
      defaultModel: 'grok-beta',
      capabilities: {
        supportsJsonMode: true,
        supportsWebSearch: false
      }
    });
  }
}
