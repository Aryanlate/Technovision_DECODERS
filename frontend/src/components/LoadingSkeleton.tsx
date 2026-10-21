'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/LanguageProvider';

/**
 * Editorial Loading Skeleton Components
 * Crisp rectangular wireframe skeletons matching the editorial aesthetic.
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="border border-[#111111] bg-white divide-y divide-[#111111] animate-pulse">
      <div className="p-3 bg-[#F1EEE6] h-10 border-b border-[#111111]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 grid grid-cols-5 gap-4">
          <div className="h-4 bg-[#111111]/10 rounded-none w-3/4" />
          <div className="h-4 bg-[#111111]/10 rounded-none w-5/6" />
          <div className="h-4 bg-[#111111]/10 rounded-none w-2/3" />
          <div className="h-6 bg-[#111111]/10 rounded-none w-20 mx-auto" />
          <div className="h-4 bg-[#111111]/10 rounded-none w-full" />
        </div>
      ))}
    </div>
  );
};

export const SummarySkeleton: React.FC = () => {
  return (
    <div className="border border-[#111111] bg-[#F1EEE6] p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-[#111111]">
        <div className="h-6 bg-[#111111]/15 w-1/3" />
        <div className="h-6 bg-[#111111]/15 w-24" />
      </div>
      <div className="grid grid-cols-3 gap-4 py-2">
        <div className="h-16 bg-white border border-[#111111]" />
        <div className="h-16 bg-white border border-[#111111]" />
        <div className="h-16 bg-white border border-[#111111]" />
      </div>
      <div className="h-4 bg-[#111111]/10 border border-[#111111]" />
    </div>
  );
};

export interface FailureAlertProps {
  type: 'empty_paste' | 'unparseable' | 'invalid_link' | 'missing_profile' | 'agent_timeout' | 'rate_limit';
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const FailureAlert: React.FC<FailureAlertProps> = ({
  type,
  message,
  onAction,
  actionLabel
}) => {
  const { t } = useTranslation();
  const configs = {
    empty_paste: {
      title: t('components.failureAlert.emptyPaste.title'),
      desc: message || t('components.failureAlert.emptyPaste.desc'),
      badge: t('components.failureAlert.emptyPaste.badge'),
      border: 'border-[#111111]',
      bg: 'bg-white'
    },
    unparseable: {
      title: t('components.failureAlert.unparseable.title'),
      desc: message || t('components.failureAlert.unparseable.desc'),
      badge: t('components.failureAlert.unparseable.badge'),
      border: 'border-[#D98A1F]',
      bg: 'bg-[#D98A1F]/5'
    },
    invalid_link: {
      title: t('components.failureAlert.invalidLink.title'),
      desc: message || t('components.failureAlert.invalidLink.desc'),
      badge: t('components.failureAlert.invalidLink.badge'),
      border: 'border-[#C0453A]',
      bg: 'bg-[#C0453A]/5'
    },
    missing_profile: {
      title: t('components.failureAlert.missingProfile.title'),
      desc: message || t('components.failureAlert.missingProfile.desc'),
      badge: t('components.failureAlert.missingProfile.badge'),
      border: 'border-[#D98A1F]',
      bg: 'bg-[#D98A1F]/5'
    },
    agent_timeout: {
      title: t('components.failureAlert.agentTimeout.title'),
      desc: message || t('components.failureAlert.agentTimeout.desc'),
      badge: t('components.failureAlert.agentTimeout.badge'),
      border: 'border-[#111111]',
      bg: 'bg-white'
    },
    rate_limit: {
      title: t('components.failureAlert.rateLimit.title'),
      desc: message || t('components.failureAlert.rateLimit.desc'),
      badge: t('components.failureAlert.rateLimit.badge'),
      border: 'border-[#D98A1F]',
      bg: 'bg-[#D98A1F]/5'
    }
  }[type];

  return (
    <div className={`p-4 border-2 ${configs.border} ${configs.bg} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-headline text-sm uppercase tracking-tight text-[#111111]">
          {configs.title}
        </h4>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#111111] text-[#F1EEE6]">
          {configs.badge}
        </span>
      </div>
      <p className="font-body text-base text-[#111111]/85 leading-relaxed">
        {configs.desc}
      </p>
      {onAction && actionLabel && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-mono font-bold uppercase underline hover:text-[#2F7D5B] focus:ring-1 focus:ring-[#111111]"
          >
            {actionLabel} →
          </button>
        </div>
      )}
    </div>
  );
};
