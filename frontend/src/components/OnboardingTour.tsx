'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import {
  ONBOARDING_REPLAY_EVENT,
  hasSeenTour,
  markTourSeen
} from '../lib/onboarding';

interface TourStep {
  title: string;
  body: string;
  href: string;
  ctaKey: string;
}

/**
 * Three-step first-visit guide: create a profile, paste an opportunity, read the
 * result. Skippable, and replayable from the footer.
 */
export const OnboardingTour: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  const steps: TourStep[] = [
    { title: t('onboarding.step1Title'), body: t('onboarding.step1Body'), href: '/profile', ctaKey: 'onboarding.openProfile' },
    { title: t('onboarding.step2Title'), body: t('onboarding.step2Body'), href: '/check', ctaKey: 'onboarding.openCheck' },
    { title: t('onboarding.step3Title'), body: t('onboarding.step3Body'), href: '/result', ctaKey: 'onboarding.openResult' }
  ];

  // Show once on the first visit.
  useEffect(() => {
    if (!hasSeenTour()) setOpen(true);
  }, []);

  // The footer can ask for a replay at any time.
  useEffect(() => {
    const replay = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_REPLAY_EVENT, replay);
    return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (open) primaryRef.current?.focus();
  }, [open, index]);

  const dismiss = useCallback(() => {
    markTourSeen();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const goToStepPage = () => {
    router.push(step.href);
    dismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 no-print">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-lg bg-[#F1EEE6] text-[#111111] border border-[#111111] p-5 sm:p-6"
      >
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#111111]/60">
          {t('onboarding.progress', { current: index + 1, total: steps.length })}
        </p>

        <h2 id="onboarding-title" className="mt-2 font-headline text-2xl uppercase tracking-tight">
          {t('onboarding.title')}
        </h2>

        <div className="mt-4 border-t border-b border-[#111111] py-4">
          <h3 className="font-headline text-lg uppercase tracking-tight">{step.title}</h3>
          <p className="mt-1.5 font-body text-base text-[#111111]/90 leading-relaxed">{step.body}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            ref={primaryRef}
            type="button"
            onClick={() => (isLast ? dismiss() : setIndex((i) => i + 1))}
            className="px-4 py-2 bg-[#111111] text-[#F1EEE6] border border-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
          >
            {isLast ? t('onboarding.finish') : t('onboarding.next')}
          </button>

          <button
            type="button"
            onClick={goToStepPage}
            className="px-4 py-2 bg-white text-[#111111] border border-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#111111]/5 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
          >
            {step.ctaKey ? t(step.ctaKey) : t('common.start')}
          </button>

          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#111111]"
            >
              {t('onboarding.back')}
            </button>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="ml-auto px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#111111]/70 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#111111]"
          >
            {t('onboarding.skip')}
          </button>
        </div>

        {/* Step dots: a visible, accessible progress hint. */}
        <div className="mt-4 flex items-center gap-2" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 border border-[#111111] ${i === index ? 'bg-[#111111]' : 'bg-transparent'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
