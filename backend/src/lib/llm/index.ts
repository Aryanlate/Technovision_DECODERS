import { z } from 'zod';
import {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
  AskAgentOptions,
  AskAgentResult,
  ProviderHealthStatus
} from './types.js';
import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';
import { OpenRouterProvider } from './openrouter.js';
import { OpenAIProvider } from './openai.js';
import { XAIProvider } from './xai.js';
import { getAgentConfig, getFallbackOrder } from './config.js';
import { gatewayTracker } from './tracker.js';
import { normalizeLanguage, languageInstruction } from './language.js';
import { logAgentCall, recordAgentMetric, getAgentMetrics } from './auditLog.js';

export * from './types.js';
export * from './config.js';
export * from './tracker.js';
export * from './language.js';
export * from './auditLog.js';

/**
 * Global Registry of LLM Providers.
 */
class LLMGatewayRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    this.register(new GeminiProvider());
    this.register(new GroqProvider());
    this.register(new OpenRouterProvider());
    this.register(new OpenAIProvider());
    this.register(new XAIProvider());
  }

  register(provider: LLMProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): LLMProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAll(): Map<string, LLMProvider> {
    return this.providers;
  }

  getHealth(): ProviderHealthStatus[] {
    return gatewayTracker.getHealthReport(this.providers);
  }
}

export const gatewayRegistry = new LLMGatewayRegistry();

/**
 * Universal Agent LLM Dispatcher.
 * 
 * Features:
 * 1. Calls assigned provider from AGENT_<NAME>_PROVIDER or DEFAULT_LLM_PROVIDER.
 * 2. Defaults temperature to 0.
 * 3. Requests JSON output and validates it with Zod against schema.
 * 4. Retries once on invalid JSON.
 * 5. Times out after 8 seconds.
 * 6. On HTTP 429 or quota errors waits briefly and retries once, then falls back.
 * 7. Enforces RPM and RPD rate limits per provider so free caps are not exceeded.
 * 8. Caches identical prompts for 10 minutes.
 * 9. Respects capabilities (only sends web-search agents to search-capable providers).
 * 10. If all providers fail, returns null so the agent safely uses rule-based/demo fallback.
 */
export async function askAgentLLM<T = any>(
  agentName: string,
  options: AskAgentOptions<T>
): Promise<AskAgentResult<T> | null> {
  const overallStart = Date.now();
  const system = options.system || '';
  const prompt = options.prompt;
  const schema = options.schema;
  const needsWebSearch = Boolean(options.needsWebSearch);
  const temperature = options.temperature ?? 0;
  const timeoutMs = options.timeoutMs ?? 8000;

  // Ask the model for AI-written prose in the chosen language. English adds
  // nothing, so English prompts and their cache entries stay unchanged; if no
  // provider answers, the agent keeps its English text as the fallback.
  const language = normalizeLanguage(options.language);
  const languageHint = languageInstruction(language);
  const effectiveSystem = languageHint ? `${system}\n\n${languageHint}`.trim() : system;

  // 1. Check 10-Minute Prompt Cache
  const cacheKey = gatewayTracker.generateCacheKey(agentName, effectiveSystem, prompt, needsWebSearch);
  const cachedData = gatewayTracker.getCached<T>(cacheKey);
  if (cachedData !== null) {
    recordAgentMetric(agentName, Date.now() - overallStart);
    return {
      data: cachedData,
      rawText: JSON.stringify(cachedData),
      provider: 'cache',
      model: '10min-in-memory-cache',
      sources: [],
      cached: true
    };
  }

  // 2. Resolve Candidate Provider Fallback Order
  const agentConfig = getAgentConfig(agentName);
  const fallbackOrder = getFallbackOrder();

  const candidateNames: string[] = [agentConfig.provider];
  for (const name of fallbackOrder) {
    if (!candidateNames.includes(name)) {
      candidateNames.push(name);
    }
  }

  let totalRetries = 0;

  // 3. Iterate through candidate providers
  for (const providerName of candidateNames) {
    const provider = gatewayRegistry.get(providerName);
    if (!provider) continue;

    // Check configuration (must have API key)
    if (!provider.isConfigured()) {
      continue;
    }

    // Check capability: web search required?
    if (needsWebSearch && !provider.capabilities.supportsWebSearch) {
      continue;
    }

    // Check Rate Limits (RPM and RPD)
    const rateCheck = gatewayTracker.canMakeRequest(providerName);
    if (!rateCheck.allowed) {
      console.warn(`[Gateway] Skipping provider ${providerName}: ${rateCheck.reason}`);
      continue;
    }

    const model = agentConfig.provider === providerName && agentConfig.model ? agentConfig.model : provider.getModel();
    const fallbackUsed = candidateNames.indexOf(providerName) > 0;

    // Provider Execution Loop (with 1 retry for 429, and 1 retry for invalid JSON)
    let providerAttempt = 0;
    while (providerAttempt < 2) {
      providerAttempt++;
      gatewayTracker.recordRequestAttempt(providerName);
      const attemptStart = Date.now();

      try {
        const genOptions: GenerateOptions = {
          system: effectiveSystem,
          prompt,
          schema,
          tools: options.tools,
          temperature,
          timeoutMs,
          needsWebSearch,
          model,
          language
        };

        const result: GenerateResult = await provider.generate(genOptions);

        // Validate JSON against Zod schema if schema provided
        if (schema) {
          let parsedData = result.json;

          // If result.json wasn't parsed automatically, try to parse raw text
          if (parsedData === undefined) {
            try {
              parsedData = JSON.parse(result.text);
            } catch {
              // Strip markdown fences if present
              const fenceMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              if (fenceMatch) {
                try {
                  parsedData = JSON.parse(fenceMatch[1]);
                } catch {
                  // Still invalid
                }
              }
            }
          }

          const zodCheck = schema.safeParse(parsedData);
          if (!zodCheck.success) {
            // Invalid JSON output -> Retry ONCE on this provider with strict prompt hint
            if (providerAttempt === 1) {
              totalRetries++;
              console.warn(
                `[Gateway] ${providerName} returned invalid JSON schema. Retrying once with strict JSON prompt...`
              );
              const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous output did not conform to the required JSON schema. Output ONLY valid, parseable JSON strictly matching the schema with no conversational preamble or markdown formatting.`;

              // Run single JSON retry
              try {
                const retryResult = await provider.generate({
                  ...genOptions,
                  prompt: retryPrompt
                });

                let retryParsed = retryResult.json;
                if (retryParsed === undefined) {
                  try {
                    retryParsed = JSON.parse(retryResult.text);
                  } catch {
                    const m = retryResult.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (m) retryParsed = JSON.parse(m[1]);
                  }
                }

                const retryZodCheck = schema.safeParse(retryParsed);
                if (retryZodCheck.success) {
                  const durationMs = Date.now() - attemptStart;
                  gatewayTracker.recordCallResult(providerName, true, false, retryResult.usage);
                  gatewayTracker.setCached(cacheKey, retryZodCheck.data);
                  recordAgentMetric(agentName, Date.now() - overallStart);
                  logAgentCall({
                    agent: agentName,
                    provider: providerName,
                    durationMs,
                    fallbackUsed,
                    isFailed: false
                  });
                  return {
                    data: retryZodCheck.data,
                    rawText: retryResult.text,
                    provider: providerName,
                    model,
                    sources: retryResult.sources || [],
                    cached: false,
                    usage: retryResult.usage,
                    retries: totalRetries
                  };
                }
              } catch (retryErr: any) {
                console.warn(`[Gateway] JSON retry failed on ${providerName}:`, retryErr.message);
              }
            }

            // If schema validation still failed, log failure and break to next provider
            const failDurationMs = Date.now() - attemptStart;
            gatewayTracker.recordCallResult(providerName, false, false);
            logAgentCall({
              agent: agentName,
              provider: providerName,
              errorType: 'invalid_json_schema',
              durationMs: failDurationMs,
              fallbackUsed,
              isFailed: true
            });
            break;
          }

          // Valid JSON response
          const durationMs = Date.now() - attemptStart;
          gatewayTracker.recordCallResult(providerName, true, false, result.usage);
          gatewayTracker.setCached(cacheKey, zodCheck.data);
          recordAgentMetric(agentName, Date.now() - overallStart);
          logAgentCall({
            agent: agentName,
            provider: providerName,
            durationMs,
            fallbackUsed,
            isFailed: false
          });

          return {
            data: zodCheck.data,
            rawText: result.text,
            provider: providerName,
            model,
            sources: result.sources || [],
            cached: false,
            usage: result.usage,
            retries: totalRetries
          };
        }

        // Schema not requested; return text output
        const durationMs = Date.now() - attemptStart;
        gatewayTracker.recordCallResult(providerName, true, false, result.usage);
        gatewayTracker.setCached(cacheKey, result.text as any);
        recordAgentMetric(agentName, Date.now() - overallStart);
        logAgentCall({
          agent: agentName,
          provider: providerName,
          durationMs,
          fallbackUsed,
          isFailed: false
        });

        return {
          data: result.text as any,
          rawText: result.text,
          provider: providerName,
          model,
          sources: result.sources || [],
          cached: false,
          usage: result.usage,
          retries: totalRetries
        };
      } catch (err: any) {
        const is429 = err.status === 429 || /429|quota|rate limit/i.test(err.message);
        const isTimeout = err.isTimeout || /timed out/i.test(err.message);
        const errDurationMs = Date.now() - attemptStart;
        const errType = is429 ? '429_rate_limit' : isTimeout ? 'timeout' : (err.code || 'provider_error');

        logAgentCall({
          agent: agentName,
          provider: providerName,
          errorType: errType,
          durationMs: errDurationMs,
          fallbackUsed,
          isFailed: true
        });

        console.warn(`[Gateway] ${providerName} error (attempt ${providerAttempt}):`, err.message);

        // On HTTP 429 or quota errors: wait briefly and retry once
        if (is429 && providerAttempt === 1) {
          totalRetries++;
          gatewayTracker.recordCallResult(providerName, false, true);
          console.warn(`[Gateway] 429 rate limit encountered on ${providerName}. Pausing 750ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 750));
          continue; // Retry loop
        }

        gatewayTracker.recordCallResult(providerName, false, is429);
        // Break out of retry loop on timeout or fatal error to try next candidate in fallback order
        break;
      }
    }
  }

  // If all providers failed or were unconfigured, return null safely
  const totalDurationMs = Date.now() - overallStart;
  recordAgentMetric(agentName, totalDurationMs);
  logAgentCall({
    agent: agentName,
    provider: candidateNames[0] || 'all_candidates',
    errorType: 'all_providers_failed',
    durationMs: totalDurationMs,
    fallbackUsed: true,
    isFailed: true
  });

  console.warn(`[Gateway] All candidate providers failed for agent "${agentName}". Returning null for offline/rule fallback.`);
  return null;
}
