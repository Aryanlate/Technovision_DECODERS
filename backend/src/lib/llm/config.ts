/**
 * Configuration manager for OpportunityKit LLM Gateway.
 * Reads per-agent provider and model settings, fallback chains, and rate limits.
 */

export interface AgentLLMConfig {
  provider: string;
  model?: string;
}

export interface ProviderLimits {
  rpm: number;
  rpd: number;
}

/**
 * Default fallback chain across providers (free tier first, then paid).
 */
export const DEFAULT_FALLBACK_ORDER = ['gemini', 'groq', 'openrouter', 'openai', 'xai'];

/**
 * Returns the configured fallback order from LLM_FALLBACK_ORDER env var.
 */
export function getFallbackOrder(): string[] {
  const envVal = process.env.LLM_FALLBACK_ORDER?.trim();
  if (!envVal) return DEFAULT_FALLBACK_ORDER;
  return envVal
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Normalizes an agent name into an environment variable key format:
 * e.g. "opportunity_extractor" -> "OPPORTUNITY_EXTRACTOR"
 */
function normalizeAgentEnvKey(agentName: string): string {
  return agentName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

/**
 * Reads per-agent settings from AGENT_<NAME>_PROVIDER and AGENT_<NAME>_MODEL.
 * Falls back to DEFAULT_LLM_PROVIDER (defaults to 'gemini').
 */
export function getAgentConfig(agentName: string): AgentLLMConfig {
  const key = normalizeAgentEnvKey(agentName);
  const provider =
    process.env[`AGENT_${key}_PROVIDER`]?.trim().toLowerCase() ||
    process.env.DEFAULT_LLM_PROVIDER?.trim().toLowerCase() ||
    'gemini';

  const model = process.env[`AGENT_${key}_MODEL`]?.trim() || undefined;

  return { provider, model };
}

/**
 * Returns rate limits for a given provider (RPM and RPD).
 * Reads PROVIDER_<NAME>_RPM_LIMIT and PROVIDER_<NAME>_RPD_LIMIT with safe free-tier defaults.
 */
export function getProviderRateLimits(providerName: string): ProviderLimits {
  const key = providerName.toUpperCase();

  const defaultLimits: Record<string, ProviderLimits> = {
    gemini: { rpm: 15, rpd: 1500 },
    groq: { rpm: 30, rpd: 14400 },
    openrouter: { rpm: 20, rpd: 200 },
    openai: { rpm: 60, rpd: 5000 },
    xai: { rpm: 60, rpd: 5000 }
  };

  const defaults = defaultLimits[providerName.toLowerCase()] || { rpm: 20, rpd: 500 };

  const rpm = parseInt(process.env[`PROVIDER_${key}_RPM_LIMIT`] || '', 10) || defaults.rpm;
  const rpd = parseInt(process.env[`PROVIDER_${key}_RPD_LIMIT`] || '', 10) || defaults.rpd;

  return { rpm, rpd };
}
