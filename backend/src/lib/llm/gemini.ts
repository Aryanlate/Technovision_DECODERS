import { LLMProvider, ProviderCapabilities, GenerateOptions, GenerateResult } from './types.js';

/**
 * Google Gemini Provider (Primary Free Tier with Google Search Grounding).
 * Uses Gemini 1.5 Flash (or model specified via GEMINI_MODEL).
 */
export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini';
  public readonly capabilities: ProviderCapabilities = {
    supportsJsonMode: true,
    supportsWebSearch: true
  };

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
  }

  getModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[gemini] Missing GEMINI_API_KEY environment variable');
    }

    const model = options.model || this.getModel();
    const timeoutMs = options.timeoutMs ?? 8000;
    const temperature = options.temperature ?? 0;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${apiKey}`;

    // Construct Gemini request body
    const contents: any[] = [];
    if (options.system) {
      contents.push({
        role: 'user',
        parts: [{ text: `SYSTEM INSTRUCTIONS:\n${options.system}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will strictly follow these system instructions and schema constraints.' }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: options.prompt }]
    });

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature
      }
    };

    // JSON Mode configuration
    const isJsonRequested = Boolean(options.schema) || options.prompt.toLowerCase().includes('json');
    if (isJsonRequested) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    // Google Search Grounding for live research / employer verification
    if (options.needsWebSearch) {
      requestBody.tools = [
        {
          googleSearch: {}
        }
      ];
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const error: any = new Error(
          `[gemini] API request failed with status ${response.status}: ${errorText.substring(0, 300)}`
        );
        error.status = response.status;
        error.provider = 'gemini';
        throw error;
      }

      const data: any = await response.json();
      const candidate = data.candidates?.[0];
      const rawText: string = candidate?.content?.parts?.[0]?.text || '';

      // Extract JSON if present
      let json: any = undefined;
      try {
        json = JSON.parse(rawText);
      } catch {
        // Fallback: strip markdown code fences if wrapped in ```json ... ```
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            json = JSON.parse(jsonMatch[1]);
          } catch {
            // Ignore
          }
        }
      }

      // Extract Google Search grounding sources
      const sources: string[] = [];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri && !sources.includes(chunk.web.uri)) {
          sources.push(chunk.web.uri);
        }
      }

      // Also extract any explicit URLs in the text
      const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
      let match: RegExpExecArray | null;
      while ((match = urlRegex.exec(rawText)) !== null) {
        if (!sources.includes(match[1])) {
          sources.push(match[1]);
        }
      }

      const usageMetadata = data.usageMetadata;

      return {
        text: rawText,
        json,
        sources,
        usage: {
          promptTokens: usageMetadata?.promptTokenCount,
          completionTokens: usageMetadata?.candidatesTokenCount,
          totalTokens: usageMetadata?.totalTokenCount
        }
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      if (err.name === 'AbortError') {
        const timeoutError: any = new Error(`[gemini] Request timed out after ${timeoutMs}ms`);
        timeoutError.isTimeout = true;
        timeoutError.provider = 'gemini';
        throw timeoutError;
      }
      throw err;
    }
  }
}
