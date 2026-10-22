'use client';

import React from 'react';
import { RequirementStatus } from '@opportunity-kit/shared';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export type BadgeStatus =
  | RequirementStatus
  | 'Match'
  | 'Mismatch'
  | 'Missing info'
  | 'Neutral'
  | 'Verified'
  | 'Needs review'
  | 'Unverified'
  | 'Low risk'
  | 'Medium risk'
  | 'High risk'
  | 'AI-suggested'
  | 'Confirmed by you'
  | 'Verified source'
  | 'Stale'
  | 'Conflict';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/** Maps a badge status onto its dictionary key so the word is always translated. */
const STATUS_I18N_KEY: Record<string, string> = {
  Match: 'match',
  Mismatch: 'mismatch',
  'Missing info': 'missingInfo',
  Neutral: 'neutral',
  Verified: 'verified',
  'Needs review': 'needsReview',
  Unverified: 'unverified',
  'Low risk': 'lowRisk',
  'Medium risk': 'mediumRisk',
  'High risk': 'highRisk',
  'AI-suggested': 'aiSuggested',
  'Confirmed by you': 'confirmedByYou',
  'Verified source': 'verifiedSource',
  Stale: 'stale',
  Conflict: 'conflict'
};

/**
 * Editorial Badge Component
 * Guarantees every badge displays both an icon and an explicit word (never just a color),
 * with thin black borders and zero gradients/shadows as required by the Master Context.
 */
export const Badge: React.FC<BadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const getBadgeConfig = () => {
    switch (status) {
      case 'Match':
        return {
          bg: 'bg-[#2F7D5B]',
          text: 'text-white',
          label: 'MATCH',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )
        };
      case 'Mismatch':
        return {
          bg: 'bg-[#C0453A]',
          text: 'text-white',
          label: 'MISMATCH',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )
        };
      case 'Missing info':
        return {
          bg: 'bg-[#D98A1F]',
          text: 'text-[#111111]',
          label: 'MISSING INFO',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )
        };
      case 'Verified':
        return {
          bg: 'bg-[#2F7D5B]',
          text: 'text-white',
          label: 'VERIFIED',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          )
        };
      case 'Needs review':
        return {
          bg: 'bg-[#D98A1F]',
          text: 'text-[#111111]',
          label: 'NEEDS REVIEW',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12.5" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )
        };
      case 'Unverified':
        return {
          bg: 'bg-[#C0453A]',
          text: 'text-white',
          label: 'UNVERIFIED',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10.3 4.3L2.8 17.5a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" />
              <line x1="12" y1="9" x2="12" y2="13.5" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )
        };
      case 'Low risk':
        return {
          bg: 'bg-[#2F7D5B]',
          text: 'text-white',
          label: 'LOW RISK',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          )
        };
      case 'Medium risk':
        return {
          bg: 'bg-[#D98A1F]',
          text: 'text-[#111111]',
          label: 'MEDIUM RISK',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <line x1="12" y1="8.5" x2="12" y2="13" />
              <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
            </svg>
          )
        };
      case 'High risk':
        return {
          bg: 'bg-[#C0453A]',
          text: 'text-white',
          label: 'HIGH RISK',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10.3 4.3L2.8 17.5a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" />
              <line x1="12" y1="9" x2="12" y2="13.5" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )
        };
      case 'AI-suggested':
        return {
          bg: 'bg-white',
          text: 'text-[#111111]',
          label: 'AI-SUGGESTED · CONFIRM',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" />
            </svg>
          )
        };
      case 'Confirmed by you':
        return {
          bg: 'bg-[#2F7D5B]',
          text: 'text-white',
          label: 'CONFIRMED BY YOU',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          )
        };
      case 'Verified source':
        return {
          bg: 'bg-white',
          text: 'text-[#111111]',
          label: 'VERIFIED SOURCE',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
            </svg>
          )
        };
      case 'Stale':
        return {
          bg: 'bg-[#D98A1F]',
          text: 'text-[#111111]',
          label: 'STALE',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15.5 14" />
            </svg>
          )
        };
      case 'Conflict':
        return {
          bg: 'bg-[#C0453A]',
          text: 'text-white',
          label: 'CONFLICT',
          icon: (
            <svg
              className="w-3.5 h-3.5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l9 16H3l9-16z" />
              <line x1="12" y1="9" x2="12" y2="14" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-[#111111]',
          text: 'text-[#F1EEE6]',
          label: String(status).toUpperCase(),
          icon: (
            <span className="w-2 h-2 rounded-full bg-current inline-block" aria-hidden="true" />
          )
        };
    }
  };

  const config = getBadgeConfig();

  // The visible word and the screen-reader announcement both use the chosen
  // language; the colour never carries the meaning on its own.
  const i18nKey = STATUS_I18N_KEY[String(status)];
  const label = i18nKey ? t(`status.${i18nKey}`) : String(status);

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 tracking-wider',
    md: 'text-xs px-3.5 py-1 gap-1.5 tracking-wider',
    lg: 'text-sm px-4.5 py-1.5 gap-2 tracking-widest font-extrabold'
  }[size];

  return (
    <span
      role="status"
      aria-label={t('a11y.statusBadge', { status: label })}
      className={`inline-flex items-center font-bold uppercase border border-[#111111] select-none ${config.bg} ${config.text} ${sizeStyles} ${className}`}
      {...props}
    >
      {showIcon && <span className="shrink-0">{config.icon}</span>}
      <span className="leading-none">{label}</span>
    </span>
  );
};

/**
 * Backward compatibility alias for existing usages
 */
export const StatusBadge = Badge;
