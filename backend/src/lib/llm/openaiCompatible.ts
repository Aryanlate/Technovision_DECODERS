import { LLMProvider, ProviderCapabilities, GenerateOptions, GenerateResult } from './types.js';

export interface OpenAICompatibleConfig {
  name: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  defaultModel: string;
  modelEnvVar: string;
  capabilities?: Partial<ProviderCapabilities>;
  customHeaders?: Record<string, string>;
}

/**
 * Shared OpenAI-compatible client.
 * Connects to any provider implementing the standard /v1/chat/completions endpoint
 * (Groq, OpenRouter, OpenAI, xAI).
 */
export class OpenAICompatibleProvider implements LLMProvider {
  public readonly name: string;
  public readonly capabilities: ProviderCapabilities;
  private baseUrl: string;
  private apiKeyEnvVar: string;
  private defaultModel: string;
  private modelEnvVar: string;
  private customHeaders: Record<string, string>;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKeyEnvVar = config.apiKeyEnvVar;
    this.defaultModel = config.defaultModel;
    this.modelEnvVar = config.modelEnvVar;
    this.customHeaders = config.customHeaders || {};
    this.capabilities = {
      supportsJsonMode: config.capabilities?.supportsJsonMode ?? true,
      supportsWebSearch: config.capabilities?.supportsWebSearch ?? false
    };
  }

  isConfigured(): boolean {
    const key = process.env[this.apiKeyEnvVar];
    return typeof key === 'string' && key.trim().length > 0;
  }

  getModel(): string {
    return process.env[this.modelEnvVar] || this.defaultModel;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = process.env[this.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(`[${this.name}] Provider is not configured. Missing ${this.apiKeyEnvVar}`);
    }

    const model = options.model || this.getModel();
    const timeoutMs = options.timeoutMs ?? 8000;
    const temperature = options.temperature ?? 0;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (options.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: options.prompt });

    const requestBody: any = {
      model,
      messages,
      temperature
    };

    if (this.capabilities.supportsJsonMode && (options.schema || options.prompt.toLowerCase().includes('json'))) {
      requestBody.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `${this.baseUrl}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...this.customHeaders
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const error: any = new Error(
          `[${this.name}] API request failed with status ${response.status}: ${errorText.substring(0, 300)}`
        );
        error.status = response.status;
        error.provider = this.name;
        throw error;
      }

      const data: any = await response.json();
      const rawText: string = data.choices?.[0]?.message?.content || '';

      let json: any = undefined;
      try {
        json = JSON.parse(rawText);
      } catch {
        // Not valid JSON or plaintext
      }

      // Extract any URL citations from choices or message
      const sources: string[] = [];
      const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
      let match: RegExpExecArray | null;
      while ((match = urlRegex.exec(rawText)) !== null) {
        if (!sources.includes(match[1])) {
          sources.push(match[1]);
        }
      }

      return {
        text: rawText,
        json,
        sources,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      if (err.name === 'AbortError') {
        const timeoutError: any = new Error(`[${this.name}] Request timed out after ${timeoutMs}ms`);
        timeoutError.isTimeout = true;
        timeoutError.provider = this.name;
        throw timeoutError;
      }
      throw err;
    }
  }
}
