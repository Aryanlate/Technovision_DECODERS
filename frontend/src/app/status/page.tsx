'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SectionTitle } from '../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Sunburst } from '../../components/Sunburst';

interface ProviderStatus {
  name: string;
  configured: boolean;
  recentlyWorking?: boolean;
  model: string;
  capabilities?: {
    supportsWebSearch?: boolean;
    supportsJsonSchema?: boolean;
    supportsSystemPrompt?: boolean;
  };
  rateLimits?: {
    rpmLimit: number;
    rpdLimit: number;
    currentRpm: number;
    currentRpd: number;
  };
  stats?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    rateLimit429Count: number;
    totalTokens: number;
    lastCallTimestamp?: string;
  };
}

interface AgentMetric {
  agent: string;
  totalCalls: number;
  totalDurationMs: number;
  averageResponseTimeMs: number;
  lastCallTimestamp?: string;
}

interface StatusData {
  status: string;
  service?: string;
  timestamp: string;
  demoMode: boolean;
  providers: ProviderStatus[];
  agentMetrics: AgentMetric[];
}

const DEFAULT_PROVIDERS: ProviderStatus[] = [
  {
    name: 'gemini',
    configured: false,
    recentlyWorking: false,
    model: 'gemini-1.5-flash',
    capabilities: { supportsWebSearch: true, supportsJsonSchema: true, supportsSystemPrompt: true },
    rateLimits: { rpmLimit: 15, rpdLimit: 1500, currentRpm: 0, currentRpd: 0 },
    stats: { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rateLimit429Count: 0, totalTokens: 0 }
  },
  {
    name: 'groq',
    configured: false,
    recentlyWorking: false,
    model: 'llama-3.3-70b-versatile',
    capabilities: { supportsWebSearch: false, supportsJsonSchema: true, supportsSystemPrompt: true },
    rateLimits: { rpmLimit: 30, rpdLimit: 14400, currentRpm: 0, currentRpd: 0 },
    stats: { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rateLimit429Count: 0, totalTokens: 0 }
  },
  {
    name: 'openrouter',
    configured: false,
    recentlyWorking: false,
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    capabilities: { supportsWebSearch: false, supportsJsonSchema: true, supportsSystemPrompt: true },
    rateLimits: { rpmLimit: 20, rpdLimit: 200, currentRpm: 0, currentRpd: 0 },
    stats: { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rateLimit429Count: 0, totalTokens: 0 }
  },
  {
    name: 'openai',
    configured: false,
    recentlyWorking: false,
    model: 'gpt-4o-mini',
    capabilities: { supportsWebSearch: false, supportsJsonSchema: true, supportsSystemPrompt: true },
    rateLimits: { rpmLimit: 60, rpdLimit: 10000, currentRpm: 0, currentRpd: 0 },
    stats: { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rateLimit429Count: 0, totalTokens: 0 }
  },
  {
    name: 'xai',
    configured: false,
    recentlyWorking: false,
    model: 'grok-beta',
    capabilities: { supportsWebSearch: false, supportsJsonSchema: true, supportsSystemPrompt: true },
    rateLimits: { rpmLimit: 30, rpdLimit: 1000, currentRpm: 0, currentRpd: 0 },
    stats: { totalCalls: 0, successfulCalls: 0, failedCalls: 0, rateLimit429Count: 0, totalTokens: 0 }
  }
];

const DEFAULT_AGENTS: AgentMetric[] = [
  { agent: 'OpportunityReader', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'GitHubAnalyzer', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'LinkedInAnalyzer', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'VerifierAgent', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'ResearchAgent', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'DiscoveryAgent', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 },
  { agent: 'ResumeLineGenerator', totalCalls: 0, totalDurationMs: 0, averageResponseTimeMs: 0 }
];

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchStatus = async () => {
    setIsLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${backendUrl}/api/status`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const json: StatusData = await res.json();
        setData(json);
        setIsBackendOnline(true);
        setLastChecked(new Date().toLocaleTimeString());
        setIsLoading(false);
        return;
      }
    } catch {
      // Backend offline or unreachable
    }

    // Try fallback /health endpoint if /api/status is not responding
    try {
      const healthRes = await fetch(`${backendUrl}/health`, { cache: 'no-store' });
      if (healthRes.ok) {
        const healthJson = await healthRes.json();
        setData({
          status: 'ok',
          service: 'OpportunityKit Backend',
          timestamp: new Date().toISOString(),
          demoMode: Boolean(healthJson.demoMode),
          providers: DEFAULT_PROVIDERS,
          agentMetrics: DEFAULT_AGENTS
        });
        setIsBackendOnline(true);
        setLastChecked(new Date().toLocaleTimeString());
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    setIsBackendOnline(false);
    setData({
      status: 'offline',
      service: 'In-Browser Local Fallback',
      timestamp: new Date().toISOString(),
      demoMode: true,
      providers: DEFAULT_PROVIDERS,
      agentMetrics: DEFAULT_AGENTS
    });
    setLastChecked(new Date().toLocaleTimeString());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const providers = data?.providers && data.providers.length > 0 ? data.providers : DEFAULT_PROVIDERS;
  const agentMetrics = data?.agentMetrics && data.agentMetrics.length > 0 ? data.agentMetrics : DEFAULT_AGENTS;
  const isDemo = data ? data.demoMode : true;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionTitle
            tag="SYSTEM AUDIT & OBSERVABILITY"
            withMotif
            size="huge"
            title="SYSTEM STATUS & AGENT HEALTH"
            subtitle="Transparent live monitoring of configured LLM providers, rolling agent latency metrics, and demo execution mode."
          />
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs font-mono text-[#111111]/70">
              Checked: {lastChecked}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </Button>
        </div>
      </div>

      {/* 2. System Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Backend Connectivity */}
        <div className="p-4 border border-[#111111] bg-white space-y-1">
          <div className="text-[11px] font-mono uppercase font-bold text-[#111111]/70">
            Backend Service
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge status={isBackendOnline ? 'Match' : 'Mismatch'} size="sm" />
            <span className="font-headline text-base uppercase text-[#111111]">
              {isBackendOnline ? 'ONLINE & ACTIVE' : 'OFFLINE / ASLEEP'}
            </span>
          </div>
          <p className="text-xs font-mono text-[#111111]/75 pt-1">
            {isBackendOnline ? 'Serving Express API & Agent Gateway' : 'Running pure TypeScript rule engine locally'}
          </p>
        </div>

        {/* Demo Mode Status (Explicit Requirement) */}
        <div className="p-4 border border-[#111111] bg-white space-y-1">
          <div className="text-[11px] font-mono uppercase font-bold text-[#111111]/70">
            Execution Mode
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge status={isDemo ? 'Missing info' : 'Match'} size="sm" />
            <span className="font-headline text-base uppercase text-[#111111]">
              {isDemo ? 'DEMO MODE: ON' : 'LIVE API MODE: ON'}
            </span>
          </div>
          <p className="text-xs font-mono text-[#111111]/75 pt-1">
            {isDemo
              ? 'Returns deterministic sample results with zero API consumption'
              : 'Dispatches live requests to configured provider gateways'}
          </p>
        </div>

        {/* Security & Secret Key Invariant (Explicit Requirement: Never show keys) */}
        <div className="p-4 border border-[#111111] bg-[#F1EEE6] space-y-1">
          <div className="text-[11px] font-mono uppercase font-bold text-[#2F7D5B]">
            Security Invariant
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Sunburst size={16} className="text-[#2F7D5B]" />
            <span className="font-headline text-sm uppercase text-[#111111]">
              ZERO KEY EXPOSURE
            </span>
          </div>
          <p className="text-xs font-mono text-[#111111]/80 pt-1">
            Provider credentials are held in server environment variables only and never rendered client-side.
          </p>
        </div>
      </div>

      {/* 3. AI Providers Configuration & Health Table */}
      <Card variant="white" className="border-2 border-[#111111]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>AI PROVIDERS CONFIGURATION &amp; STATUS</CardTitle>
              <CardDescription>
                Live configuration check and recent health telemetry across all registered LLM gateways.
              </CardDescription>
            </div>
            <div className="text-xs font-mono text-[#111111]/70">
              {providers.filter((p) => p.configured).length} of {providers.length} configured
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto border border-[#111111] bg-white">
            <table className="w-full border-collapse text-left font-body text-sm">
              <thead>
                <tr className="border-b border-[#111111] bg-[#F1EEE6] text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                  <th scope="col" className="p-3 border-r border-[#111111]">Provider</th>
                  <th scope="col" className="p-3 border-r border-[#111111] text-center">Configured</th>
                  <th scope="col" className="p-3 border-r border-[#111111] text-center">Recently Working</th>
                  <th scope="col" className="p-3 border-r border-[#111111]">Active Model</th>
                  <th scope="col" className="p-3 border-r border-[#111111]">Rate Limits</th>
                  <th scope="col" className="p-3 text-right">Calls (Success/Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]">
                {providers.map((p) => {
                  const isWorking = Boolean(p.recentlyWorking || (p.configured && (p.stats?.successfulCalls || 0) > 0));
                  const hasErrors = (p.stats?.failedCalls || 0) > 0;

                  return (
                    <tr key={p.name} className="hover:bg-[#111111]/5 transition-colors">
                      {/* Provider Name */}
                      <td className="p-3 border-r border-[#111111] font-bold text-xs uppercase font-headline text-[#111111]">
                        {p.name}
                      </td>

                      {/* Configured Status (Badge) */}
                      <td className="p-3 border-r border-[#111111] text-center">
                        <Badge
                          status={p.configured ? 'Match' : 'Mismatch'}
                          size="sm"
                        />
                      </td>

                      {/* Recently Working Status (Badge) */}
                      <td className="p-3 border-r border-[#111111] text-center">
                        {p.configured ? (
                          isWorking ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2F7D5B] text-white border border-[#111111]">
                              WORKING
                            </span>
                          ) : hasErrors ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#C0453A] text-white border border-[#111111]">
                              ERRORS
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#D98A1F] text-white border border-[#111111]">
                              STANDBY
                            </span>
                          )
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-mono text-[#111111]/60 bg-[#F1EEE6] border border-[#111111]/20">
                            UNCONFIGURED
                          </span>
                        )}
                      </td>

                      {/* Active Model */}
                      <td className="p-3 border-r border-[#111111] font-mono text-xs text-[#111111]">
                        {p.model}
                        {p.capabilities?.supportsWebSearch && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.2 bg-[#2F7D5B]/10 text-[#2F7D5B] border border-[#2F7D5B]/30 font-bold uppercase">
                            Web Search
                          </span>
                        )}
                      </td>

                      {/* Rate Limits */}
                      <td className="p-3 border-r border-[#111111] font-mono text-xs text-[#111111]/80">
                        {p.rateLimits ? (
                          <span>{p.rateLimits.rpmLimit} RPM / {p.rateLimits.rpdLimit} RPD</span>
                        ) : (
                          <span className="italic text-[#111111]/50">Standard</span>
                        )}
                      </td>

                      {/* Call Stats */}
                      <td className="p-3 font-mono text-xs text-right text-[#111111]">
                        <span className="font-bold text-[#2F7D5B]">{p.stats?.successfulCalls ?? 0}</span>
                        {' / '}
                        <span>{p.stats?.totalCalls ?? 0}</span>
                        {Boolean(p.stats?.rateLimit429Count) && (
                          <span className="ml-1 text-[10px] text-[#C0453A] font-bold">
                            ({p.stats?.rateLimit429Count} 429s)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Average Response Time Per Agent */}
      <Card variant="cream" className="border-2 border-[#111111]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>AVERAGE RESPONSE TIME PER AGENT</CardTitle>
              <CardDescription>
                Rolling round-trip latency statistics tracked in the gateway and orchestrator pipeline.
              </CardDescription>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#111111] text-[#F1EEE6] px-2 py-0.5 border border-[#111111]">
              SLOW THRESHOLD &gt; 2500ms
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agentMetrics.map((m) => {
              const isSlow = m.averageResponseTimeMs >= 2500;
              const hasCalls = m.totalCalls > 0;

              return (
                <div
                  key={m.agent}
                  className={`p-4 border border-[#111111] bg-white space-y-2 flex flex-col justify-between ${
                    isSlow ? 'border-[#C0453A]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-headline text-xs uppercase tracking-tight text-[#111111] truncate" title={m.agent}>
                        {m.agent}
                      </span>
                      {hasCalls ? (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border ${
                            isSlow
                              ? 'bg-[#C0453A] text-white border-[#C0453A]'
                              : 'bg-[#2F7D5B]/10 text-[#2F7D5B] border-[#2F7D5B]/30'
                          }`}
                        >
                          {isSlow ? 'SLOW' : 'FAST'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[#111111]/50 bg-[#F1EEE6] px-1 py-0.2 border border-[#111111]/20">
                          IDLE
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-headline text-2xl text-[#111111]">
                        {hasCalls ? `${m.averageResponseTimeMs}` : '—'}
                      </span>
                      <span className="text-xs font-mono text-[#111111]/70 uppercase">
                        {hasCalls ? 'ms avg' : 'no calls yet'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#111111]/10 flex items-center justify-between text-[11px] font-mono text-[#111111]/70">
                    <span>Invocations:</span>
                    <span className="font-bold text-[#111111]">{m.totalCalls}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Privacy & Audit Assurance */}
      <div className="p-4 border border-[#111111] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <span className="font-bold uppercase text-[#111111] block">
            Strict Privacy Logging Invariant:
          </span>
          <span className="text-[#111111]/80">
            Failed and slow agent calls are audited by duration and error classification only. Personal candidate data and prompt text are never logged.
          </span>
        </div>
        <Link href="/" className="shrink-0">
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
