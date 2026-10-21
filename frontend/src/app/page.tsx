'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SAMPLE_STUDENT_PROFILE,
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_OPPORTUNITY_TITLE,
  SAMPLE_CHECKLIST,
  evaluateProfileAgainstOpportunity
} from '@opportunity-kit/shared';
import {
  saveStoredProfile,
  saveStoredChecklist,
  saveStoredEvaluation
} from '../lib/storage';
import { setDemoMode } from '../lib/flags';
import { trackEvent } from '../lib/analytics';
import { SectionTitle } from '../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Sunburst } from '../components/Sunburst';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import { statusLabel } from '../lib/i18n/rules';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  // Run the Sample Demo Handler
  // Loads sample profile, sample opportunity, runs evaluation with cached results,
  // and navigates to the result page so presentations work 100% offline with no internet.
  const handleRunSampleDemo = () => {
    setIsRunningDemo(true);
    trackEvent('run_sample_demo_started');

    // 1. Enable presentation demo mode
    setDemoMode(true);

    // 2. Load benchmark profile (Alex Sharma)
    saveStoredProfile(SAMPLE_STUDENT_PROFILE);

    // 3. Load benchmark checklist (Summer Engineering Intern)
    saveStoredChecklist(SAMPLE_CHECKLIST);

    // 4. Compute deterministic evaluation
    const demoResult = evaluateProfileAgainstOpportunity(
      SAMPLE_CHECKLIST.requirements,
      SAMPLE_STUDENT_PROFILE,
      SAMPLE_OPPORTUNITY_TITLE,
      SAMPLE_OPPORTUNITY_TEXT
    );
    saveStoredEvaluation(demoResult);

    trackEvent('run_sample_demo_completed', {
      matches: demoResult.counts.matches,
      mismatches: demoResult.counts.mismatches,
      missingInfo: demoResult.counts.missingInfo
    });

    // 5. Navigate to /result
    setTimeout(() => {
      router.push('/result');
    }, 400);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION */}
      {/* Required Line: "Know if you qualify, what you miss, and what to do next" */}
      {/* ==================================================================== */}
      <section className="pt-4 sm:pt-8 pb-10 border-b border-[#111111] space-y-6">
        <div className="flex items-center gap-2">
          <Sunburst size={16} className="text-[#111111]" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 bg-[#111111]/5 px-2.5 py-1 border border-[#111111]/20">
            {t('home.badge')}
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-[#111111] leading-[1.05]">
            {t('home.title')}
          </h1>
          <p className="font-body text-base sm:text-lg text-[#111111]/85 max-w-3xl leading-relaxed">
            {t('home.lede')}
          </p>
        </div>

        {/* Hero Actions Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button
            variant="solid"
            size="lg"
            onClick={handleRunSampleDemo}
            id="run-sample-demo-btn"
            disabled={isRunningDemo}
            className="text-base px-6 py-3.5 focus:ring-2 focus:ring-[#111111]"
          >
            {isRunningDemo ? t('home.loadingDemo') : t('home.runDemo')}
          </Button>

          <Link href="/check">
            <Button
              variant="outline"
              size="lg"
              className="text-base px-6 py-3.5 focus:ring-2 focus:ring-[#111111]"
            >
              {t('home.ctaPaste')}
            </Button>
          </Link>

          <Link href="/profile">
            <Button
              variant="outline"
              size="lg"
              className="text-base px-6 py-3.5 focus:ring-2 focus:ring-[#111111]"
            >
              {t('home.ctaProfile')}
            </Button>
          </Link>
        </div>

        {/* Presentation Guarantee Notice */}
        <div className="p-3 border border-[#111111] bg-white flex items-center justify-between text-xs font-mono text-[#111111]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2F7D5B] animate-pulse" />
            <span className="font-bold uppercase">{t('home.presentationReady')}</span>
            <span>{t('home.offlineNote')}</span>
          </div>
          <span className="hidden sm:inline font-bold uppercase text-[10px] bg-[#F1EEE6] px-2 py-0.5 border border-[#111111]">
            {t('home.demoModeEnabled')}
          </span>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. 5-STEP HOW IT WORKS STRIP */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <SectionTitle
          tag={t('home.howTag')}
          title={t('home.howTitle')}
          subtitle={t('home.howSubtitle')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="p-5 border border-[#111111] bg-white flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]/60 block uppercase">
                {t('home.stepLabel', { number: '01' })}
              </span>
              <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                {t('home.step1Title')}
              </h3>
              <p className="font-body text-base text-[#111111]/80 leading-relaxed">
                {t('home.step1Body')}
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#2F7D5B] block pt-2 border-t border-[#111111]/10">
              {t('home.step1Note')}
            </span>
          </div>

          {/* Step 2 */}
          <div className="p-5 border border-[#111111] bg-white flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]/60 block uppercase">
                {t('home.stepLabel', { number: '02' })}
              </span>
              <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                {t('home.step2Title')}
              </h3>
              <p className="font-body text-base text-[#111111]/80 leading-relaxed">
                {t('home.step2Body')}
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#111111] block pt-2 border-t border-[#111111]/10">
              {t('home.step2Note')}
            </span>
          </div>

          {/* Step 3 */}
          <div className="p-5 border border-[#111111] bg-white flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]/60 block uppercase">
                {t('home.stepLabel', { number: '03' })}
              </span>
              <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                {t('home.step3Title')}
              </h3>
              <p className="font-body text-base text-[#111111]/80 leading-relaxed">
                {t('home.step3Body')}
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#111111] block pt-2 border-t border-[#111111]/10">
              {t('home.step3Note')}
            </span>
          </div>

          {/* Step 4 */}
          <div className="p-5 border border-[#111111] bg-white flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]/60 block uppercase">
                {t('home.stepLabel', { number: '04' })}
              </span>
              <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                {t('home.step4Title')}
              </h3>
              <p className="font-body text-base text-[#111111]/80 leading-relaxed">
                {t('home.step4Body', { missingInfo: statusLabel(t, 'Missing info') })}
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#2F7D5B] block pt-2 border-t border-[#111111]/10">
              {t('home.step4Note')}
            </span>
          </div>

          {/* Step 5 */}
          <div className="p-5 border border-[#111111] bg-white flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]/60 block uppercase">
                {t('home.stepLabel', { number: '05' })}
              </span>
              <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                {t('home.step5Title')}
              </h3>
              <p className="font-body text-base text-[#111111]/80 leading-relaxed">
                {t('home.step5Body')}
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#2F7D5B] block pt-2 border-t border-[#111111]/10">
              {t('home.step5Note')}
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. SAMPLE RESULT PREVIEW */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#111111] pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
              {t('home.sampleTag')}
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#111111] mt-1">
              {t('home.sampleTitle')}
            </h2>
          </div>
          <Button
            variant="solid"
            size="sm"
            onClick={handleRunSampleDemo}
          >
            {t('home.launchResult')}
          </Button>
        </div>

        {/* Live Preview Card */}
        <Card variant="cream" className="p-6 space-y-6">
          {/* SummaryBar Preview */}
          <div className="space-y-3 pb-5 border-b border-[#111111]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                  {t('home.candidateLine')}
                </span>
                <h3 className="font-headline text-xl sm:text-2xl uppercase tracking-tight text-[#111111] mt-1">
                  {t('home.summaryLine', {
                    match: statusLabel(t, 'Match'),
                    mismatch: statusLabel(t, 'Mismatch'),
                    missingInfo: statusLabel(t, 'Missing info')
                  })}
                </h3>
              </div>
              <Badge status="Mismatch" size="md" />
            </div>

            {/* Proportional Segmented Progress Bar */}
            <div className="w-full h-4 border border-[#111111] bg-white flex overflow-hidden p-0.5">
              <div style={{ width: '50%' }} className="h-full bg-[#2F7D5B] border-r border-[#111111]" title={t('home.tooltipCount', { count: 3, status: statusLabel(t, 'Match'), percent: '50' })} />
              <div style={{ width: '16.7%' }} className="h-full bg-[#C0453A] border-r border-[#111111]" title={t('home.tooltipCount', { count: 1, status: statusLabel(t, 'Mismatch'), percent: '16.7' })} />
              <div style={{ width: '33.3%' }} className="h-full bg-[#D98A1F]" title={t('home.tooltipCount', { count: 2, status: statusLabel(t, 'Missing info'), percent: '33.3' })} />
            </div>
          </div>

          {/* Table Preview (Key Rows) */}
          <div className="overflow-x-auto border border-[#111111] bg-white">
            <table className="w-full text-left font-body text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#111111] bg-[#F1EEE6] text-xs font-mono font-bold uppercase">
                  <th className="p-3 border-r border-[#111111]">{t('home.tableRequirement')}</th>
                  <th className="p-3 border-r border-[#111111]">{t('home.tableAsks')}</th>
                  <th className="p-3 border-r border-[#111111]">{t('home.tableCredentials')}</th>
                  <th className="p-3 border-r border-[#111111] text-center">{t('home.tableStatus')}</th>
                  <th className="p-3">{t('home.tableRule')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111] text-xs font-mono">
                {/* Match Row */}
                <tr className="hover:bg-[#111111]/5">
                  <td className="p-3 border-r border-[#111111] font-bold uppercase font-headline">
                    {t('home.rowYear')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-[#111111]/80">
                    {t('home.rowYearAsks')}
                  </td>
                  <td className="p-3 border-r border-[#111111] font-bold text-[#111111]">
                    {t('home.rowYearValue')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-center">
                    <Badge status="Match" size="sm" />
                  </td>
                  <td className="p-3 text-[#111111]/90">
                    {t('home.ruleYear')}
                  </td>
                </tr>

                {/* Mismatch Row */}
                <tr className="bg-[#C0453A]/5 hover:bg-[#C0453A]/10">
                  <td className="p-3 border-r border-[#111111] font-bold uppercase font-headline">
                    {t('home.rowSkills')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-[#111111]/80">
                    {t('home.rowSkillsAsks')}
                  </td>
                  <td className="p-3 border-r border-[#111111] font-bold text-[#111111]">
                    {t('home.rowSkillsValue')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-center">
                    <Badge status="Mismatch" size="sm" />
                  </td>
                  <td className="p-3 text-[#111111]/90">
                    {t('home.ruleSkills')}
                  </td>
                </tr>

                {/* Missing Info Row */}
                <tr className="bg-[#D98A1F]/5 hover:bg-[#D98A1F]/10">
                  <td className="p-3 border-r border-[#111111] font-bold uppercase font-headline">
                    {t('home.rowPortfolio')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-[#111111]/80">
                    {t('home.rowPortfolioAsks')}
                  </td>
                  <td className="p-3 border-r border-[#111111] italic text-[#111111]/50">
                    {t('home.rowPortfolioValue')}
                  </td>
                  <td className="p-3 border-r border-[#111111] text-center">
                    <Badge status="Missing info" size="sm" />
                  </td>
                  <td className="p-3 text-[#111111]/90">
                    {t('home.rulePortfolio')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs font-mono text-[#111111]/70">
              {t('home.notice')}
            </p>
            <Button variant="solid" size="sm" onClick={handleRunSampleDemo}>
              {t('home.testAudit')}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
