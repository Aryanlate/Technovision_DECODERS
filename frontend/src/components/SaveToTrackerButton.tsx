'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NewTrackerItemInput, TrackerItem } from '@opportunity-kit/shared';
import { addTrackerItem } from '../lib/trackerStore';
import { Button } from './Button';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface SaveToTrackerButtonProps {
  /** Exactly what will be stored — built by buildTrackerDraft(). */
  draft: NewTrackerItemInput;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSaved?: (item: TrackerItem) => void;
}

/**
 * "Save to tracker" action. Saves the opportunity, source, deadline, the
 * readiness score at this moment, the status and a notes field.
 */
export const SaveToTrackerButton: React.FC<SaveToTrackerButtonProps> = ({
  draft,
  size = 'sm',
  className = '',
  onSaved
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (state !== 'idle') return;
    setState('saving');
    setError(null);
    try {
      const item = await addTrackerItem(draft);
      setState('saved');
      onSaved?.(item);
    } catch (err) {
      console.warn('[Tracker] Save failed:', err);
      setState('idle');
      setError(t('components.saveToTracker.error'));
    }
  };

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <Button
        variant={state === 'saved' ? 'outline' : 'solid'}
        size={size}
        onClick={handleSave}
        loading={state === 'saving'}
        disabled={state === 'saved'}
        aria-live="polite"
      >
        {state === 'saved' ? t('components.saveToTracker.saved') : t('components.saveToTracker.save')}
      </Button>

      {state === 'saved' && (
        <Link href="/tracker" className="text-[11px] font-mono font-bold underline text-[#2F7D5B]">
          {t('components.saveToTracker.openTracker')}
        </Link>
      )}

      {error && (
        <span role="alert" className="text-[11px] font-mono font-bold text-[#C0453A]">
          {error}
        </span>
      )}
    </span>
  );
};
