'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sunburst } from './Sunburst';
import { isDemoMode, setDemoMode } from '../lib/flags';
import { requestTourReplay } from '../lib/onboarding';
import { trackEvent } from '../lib/analytics';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import { SHOW_SHORTCUTS_EVENT } from './KeyboardShortcuts';

const FOOTER_LINKS: { labelKey: string; href: string }[] = [
  { labelKey: 'nav.check', href: '/check' },
  { labelKey: 'nav.profile', href: '/profile' },
  { labelKey: 'result.title', href: '/result' },
  { labelKey: 'nav.discover', href: '/discover' },
  { labelKey: 'nav.tracker', href: '/tracker' },
  { labelKey: 'nav.college', href: '/college' },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'nav.privacy', href: '/privacy' },
  { labelKey: 'nav.status', href: '/status' },
  { labelKey: 'nav.styleguide', href: '/styleguide' }
];

/**
 * Editorial Footer Component
 * Features the Invariant Guarantee, Core Principles, navigation links,
 * the tour replay control and the Demo Mode toggle.
 */
export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [demoActive, setDemoActive] = useState(true);

  useEffect(() => {
    setDemoActive(isDemoMode());

    const handleDemoChange = (e: any) => {
      if (e.detail?.enabled !== undefined) {
        setDemoActive(e.detail.enabled);
      } else {
        setDemoActive(isDemoMode());
      }
    };

    window.addEventListener('opportunitykit_demo_mode_changed', handleDemoChange);
    return () => window.removeEventListener('opportunitykit_demo_mode_changed', handleDemoChange);
  }, []);

  const handleToggleDemo = () => {
    const nextVal = !demoActive;
    setDemoActive(nextVal);
    setDemoMode(nextVal);
    trackEvent('demo_mode_toggled', { enabled: nextVal });
  };

  const openShortcuts = () => {
    window.dispatchEvent(new CustomEvent(SHOW_SHORTCUTS_EVENT));
  };

  return (
    <footer className="border-t border-[#111111] bg-[#F1EEE6] mt-auto py-10 px-4 sm:px-6 text-xs font-mono uppercase text-[#111111] no-print">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Editorial Top Column: Invariants, Principles, and Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8 border-b border-[#111111]">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <span className="font-bold flex items-center gap-1.5 text-[#111111]">
              <Sunburst size={14} />
              {t('footer.corePrinciple')}
            </span>
            <p className="normal-case font-body text-base text-[#111111]/90 leading-relaxed">
              {t('footer.corePrincipleBody')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <span className="font-bold text-[#111111]">{t('footer.invariantTitle')}</span>
            <p className="normal-case font-body text-base text-[#111111]/90 leading-relaxed">
              {t('footer.invariantBody')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-[#111111]">{t('footer.index')}</span>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
              {FOOTER_LINKS.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && <span aria-hidden="true">•</span>}
                  <Link
                    href={link.href}
                    className="hover:underline underline-offset-4 focus:ring-1 focus:ring-[#111111]"
                  >
                    {t(link.labelKey)}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Presentation Mode & Experience Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 bg-white border border-[#111111] p-3.5">
              <span className="font-bold text-[#111111] flex items-center justify-between">
                <span>{t('footer.presentationMode')}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 border border-[#111111] ${
                    demoActive ? 'bg-[#2F7D5B] text-white' : 'bg-[#111111]/10 text-[#111111]'
                  }`}
                >
                  {demoActive ? t('footer.active') : t('footer.off')}
                </span>
              </span>

              <p className="normal-case font-body text-xs text-[#111111]/80 leading-snug">
                {t(demoActive ? 'footer.presentationOn' : 'footer.presentationOff')}
              </p>

              <button
                type="button"
                onClick={handleToggleDemo}
                aria-pressed={demoActive}
                id="demo-mode-toggle-btn"
                className={`mt-1 w-full text-xs font-mono font-bold py-1.5 px-3 border border-[#111111] transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#111111] ${
                  demoActive
                    ? 'bg-[#111111] text-[#F1EEE6] hover:bg-black'
                    : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${demoActive ? 'bg-[#2F7D5B] animate-pulse' : 'bg-[#C0453A]'}`} aria-hidden="true" />
                <span>{t(demoActive ? 'footer.demoOn' : 'footer.demoOff')}</span>
              </button>
            </div>

            {/* Tour replay + keyboard shortcut help */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={requestTourReplay}
                title={t('onboarding.replayHint')}
                className="flex-1 text-[11px] font-mono font-bold py-1.5 px-3 border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
              >
                {t('onboarding.replay')}
              </button>
              <button
                type="button"
                onClick={openShortcuts}
                className="text-[11px] font-mono font-bold py-1.5 px-3 border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
              >
                {t('shortcuts.open')}
              </button>
            </div>
          </div>
        </div>

        {/* Editorial Colophon Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#111111]/80 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <Sunburst size={16} className="text-[#111111]" />
            <span className="font-headline tracking-tight uppercase text-sm text-[#111111]">
              OPPORTUNITYKIT
            </span>
            <span aria-hidden="true">—</span>
            <span>{t('footer.colophon')}</span>
          </div>

          <div>
            <span>{t('footer.aesthetic')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
