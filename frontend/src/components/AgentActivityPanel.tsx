'use client';

import React from 'react';
import { AgentStatus } from '@opportunity-kit/shared';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface AgentActivityItem {
  name: string;
  role: string;
  status: AgentStatus;
  providerUsed?: string;
  timeTakenMs?: number;
  message?: string;
}

interface AgentActivityPanelProps {
  activity: AgentActivityItem[];
  isRunning?: boolean;
  totalTimeMs?: number;
  className?: string;
}

export function AgentActivityPanel({
  activity,
  isRunning = false,
  totalTimeMs,
  className = ''
}: AgentActivityPanelProps) {
  const { t } = useTranslation();
  const completedCount = activity.filter((a) => a.status === 'done').length;

  return (
    <div className={`border-2 border-[#111111] bg-white p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#111111] gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-black text-lg tracking-tight uppercase text-[#111111]">
            {t('components.agentActivity.title')}
          </h3>
          {isRunning ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#D98A1F] text-[#111111] border border-[#111111] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
              {t('components.agentActivity.running')}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-mono font-bold uppercase bg-[#F1EEE6] text-[#111111] border border-[#111111]">
              {t('components.agentActivity.complete', { done: completedCount, total: activity.length })}
            </span>
          )}
        </div>

        {totalTimeMs !== undefined && (
          <span className="text-xs font-mono font-bold text-[#555555]">
            {t('components.agentActivity.totalTime', { time: (totalTimeMs / 1000).toFixed(2) })}
          </span>
        )}
      </div>

      {/* Agents Table / List */}
      <div className="divide-y divide-[#E5E0D4] mt-2">
        {activity.map((agent) => {
          let statusBadgeBg = 'bg-[#F1EEE6] text-[#555555]';
          let statusLabel = t('components.agentActivity.statusQueued');

          if (agent.status === 'running') {
            statusBadgeBg = 'bg-[#D98A1F] text-[#111111] font-bold';
            statusLabel = t('components.agentActivity.statusRunning');
          } else if (agent.status === 'done') {
            statusBadgeBg = 'bg-[#2F7D5B] text-white font-bold';
            statusLabel = t('components.agentActivity.statusDone');
          } else if (agent.status === 'failed') {
            statusBadgeBg = 'bg-[#C0453A] text-white font-bold';
            statusLabel = t('components.agentActivity.statusFailed');
          }

          return (
            <div
              key={agent.name}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              {/* Agent Title & Role */}
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-[#111111]">
                    {agent.name}
                  </span>
                  <span className="text-xs font-sans text-[#666666]">
                    — {agent.role}
                  </span>
                </div>
                {agent.message && (
                  <p className="text-[11px] font-mono text-[#777777] mt-0.5 truncate">
                    {agent.message}
                  </p>
                )}
              </div>

              {/* Status, Provider & Time Taken */}
              <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                {agent.providerUsed && (
                  <span className="px-1.5 py-0.5 border border-[#111111] bg-[#F1EEE6] text-[#111111] text-[11px]">
                    {agent.providerUsed}
                  </span>
                )}

                {agent.timeTakenMs !== undefined && (
                  <span className="text-[#555555] min-w-[50px] text-right text-[11px]">
                    {agent.timeTakenMs}ms
                  </span>
                )}

                <span
                  className={`inline-block px-2.5 py-0.5 text-xs uppercase tracking-wider border border-[#111111] ${statusBadgeBg}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
