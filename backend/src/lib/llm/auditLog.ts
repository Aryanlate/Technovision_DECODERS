import fs from 'fs';
import path from 'path';

export interface AgentCallLogEntry {
  timestamp: string;
  agent: string;
  provider: string;
  errorType?: string;
  durationMs: number;
  fallbackUsed: boolean;
  isSlow: boolean;
  isFailed: boolean;
}

export interface AgentMetrics {
  agent: string;
  totalCalls: number;
  totalDurationMs: number;
  averageResponseTimeMs: number;
  lastCallTimestamp?: string;
}

export const SLOW_THRESHOLD_MS = 2500;

const agentMetricsMap = new Map<string, { totalCalls: number; totalDurationMs: number; lastCallTimestamp?: string }>();

// Pre-seed standard agent registry names
const INITIAL_AGENTS = [
  'OpportunityReader',
  'GitHubAnalyzer',
  'LinkedInAnalyzer',
  'VerifierAgent',
  'ResearchAgent',
  'DiscoveryAgent',
  'ResumeLineGenerator'
];

for (const name of INITIAL_AGENTS) {
  agentMetricsMap.set(name, { totalCalls: 0, totalDurationMs: 0 });
}

/**
 * Records duration of an agent invocation to maintain rolling average response times.
 */
export function recordAgentMetric(agent: string, durationMs: number): void {
  const current = agentMetricsMap.get(agent) || { totalCalls: 0, totalDurationMs: 0 };
  current.totalCalls += 1;
  current.totalDurationMs += durationMs;
  current.lastCallTimestamp = new Date().toISOString();
  agentMetricsMap.set(agent, current);
}

/**
 * Returns average response time and execution counts per agent.
 */
export function getAgentMetrics(): AgentMetrics[] {
  const list: AgentMetrics[] = [];
  for (const [agent, data] of agentMetricsMap.entries()) {
    list.push({
      agent,
      totalCalls: data.totalCalls,
      totalDurationMs: data.totalDurationMs,
      averageResponseTimeMs: data.totalCalls > 0 ? Math.round(data.totalDurationMs / data.totalCalls) : 0,
      lastCallTimestamp: data.lastCallTimestamp
    });
  }
  return list;
}

/**
 * Logs each failed or slow agent call to console and a local audit file.
 * STRICT PRIVACY INVARIANT: Never logs personal data, candidate text, or full prompts.
 */
export function logAgentCall(entry: {
  agent: string;
  provider: string;
  errorType?: string;
  durationMs: number;
  fallbackUsed: boolean;
  isFailed?: boolean;
}): void {
  const isSlow = entry.durationMs >= SLOW_THRESHOLD_MS;
  const isFailed = Boolean(entry.isFailed || (entry.errorType && entry.errorType !== 'none'));

  // Only log if it's failed or slow
  if (!isSlow && !isFailed) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logLine = `[AGENT_AUDIT ${timestamp}] Agent=${entry.agent} | Provider=${entry.provider} | Error=${entry.errorType || 'none'} | Duration=${entry.durationMs}ms | FallbackUsed=${entry.fallbackUsed} | Slow=${isSlow} | Failed=${isFailed}`;

  // 1. Console stream
  if (isFailed) {
    console.error(`\x1b[31m${logLine}\x1b[0m`);
  } else {
    console.warn(`\x1b[33m${logLine}\x1b[0m`);
  }

  // 2. Local file persistence
  try {
    const logFilePath = path.resolve(process.cwd(), 'agent-audit.log');
    fs.appendFileSync(logFilePath, `${logLine}\n`, 'utf8');
  } catch (err) {
    // Fail-safe file logging
  }
}
