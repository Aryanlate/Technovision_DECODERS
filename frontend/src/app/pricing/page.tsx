'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  computeSustainabilityModel,
  DEFAULT_SUSTAINABILITY_ASSUMPTIONS,
  SustainabilityAssumptions
} from '@opportunity-kit/shared';
import {
  SectionTitle,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Sunburst,
  useToast
} from '../../components';
import {
  getUserPlan,
  setUserPlan,
  getUsageStats,
  processMockPayment,
  UsageStats
} from '../../lib/plans';
import { trackEvent } from '../../lib/analytics';
import { getFeatureFlags } from '../../lib/flags';
import { useTranslation } from '../../lib/i18n/LanguageProvider';

export default function PricingPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium' | 'college'>('free');
  const [usage, setUsage] = useState<UsageStats>({
    plan: 'free',
    used: 3,
    limit: 5,
    remaining: 2,
    isUnlimited: false,
    isExceeded: false
  });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester'>('monthly');

  // "How we stay sustainable" model (Part 29). Every number here is an
  // assumption, and the derived figures are recomputed live as they change.
  const sustainabilityEnabled = getFeatureFlags().ENABLE_SUSTAINABILITY_MODEL;
  const [assumptions, setAssumptions] = useState<SustainabilityAssumptions>(
    DEFAULT_SUSTAINABILITY_ASSUMPTIONS
  );
  const sustainability = useMemo(() => computeSustainabilityModel(assumptions), [assumptions]);

  const setAssumption = (key: keyof SustainabilityAssumptions, raw: string) => {
    const num = parseFloat(raw);
    setAssumptions((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };
  const rupees = (value: number) => `Rs ${value.toFixed(2)}`;

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<'premium' | 'college'>('premium');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  useEffect(() => {
    const updateStats = () => {
      setCurrentPlan(getUserPlan());
      setUsage(getUsageStats());
    };
    updateStats();

    const handlePlanChange = () => updateStats();
    window.addEventListener('opportunitykit_plan_changed', handlePlanChange);
    window.addEventListener('opportunitykit_usage_updated', handlePlanChange);

    return () => {
      window.removeEventListener('opportunitykit_plan_changed', handlePlanChange);
      window.removeEventListener('opportunitykit_usage_updated', handlePlanChange);
    };
  }, []);

  const premiumPrice = billingCycle === 'monthly' ? 79 : 49;
  const premiumPeriodText =
    billingCycle === 'monthly'
      ? t('pricing.premium.periodMonthly')
      : t('pricing.premium.periodSemester');

  const handleOpenCheckout = (plan: 'premium' | 'college') => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
    trackEvent('checkout_modal_opened', { plan, billingCycle });
  };

  const handleConfirmMockPayment = async () => {
    setIsProcessingPayment(true);
    const amount = selectedPlanForCheckout === 'premium' ? premiumPrice : 24999;

    try {
      const res = await processMockPayment(selectedPlanForCheckout, amount, billingCycle === 'monthly' ? 'monthly' : 'annual');
      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setCurrentPlan(selectedPlanForCheckout);
      setUsage(getUsageStats());
      const activatedPlanName =
        selectedPlanForCheckout === 'premium' ? t('pricing.premium.name') : t('pricing.college.name');
      toast.success(
        t('pricing.toast.upgraded', { plan: activatedPlanName, orderId: res.orderId }),
        t('pricing.toast.paymentSuccessTitle')
      );
    } catch {
      setIsProcessingPayment(false);
      toast.error(t('pricing.toast.paymentFailedBody'), t('pricing.toast.paymentFailedTitle'));
    }
  };

  const handleResetToFree = () => {
    setUserPlan('free');
    setCurrentPlan('free');
    setUsage(getUsageStats());
    toast.info(t('pricing.toast.planResetBody'), t('pricing.toast.planResetTitle'));
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Page Header */}
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag={t('pricing.tag')}
          withMotif
          size="huge"
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />
      </div>

      {/* 2. Usage Counter & Upgrade Notice */}
      <section className="p-5 border-2 border-[#111111] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#111111]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D5B] animate-pulse" />
            <h3 className="font-headline text-base uppercase tracking-tight text-[#111111]">
              {t('pricing.usageHeading')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 border border-[#111111] bg-[#F1EEE6]">
              {t('pricing.currentPlan', { plan: currentPlan.toUpperCase() })}
            </span>
            {currentPlan !== 'free' && (
              <button
                type="button"
                onClick={handleResetToFree}
                className="text-xs font-mono underline hover:text-[#C0453A]"
                title={t('pricing.resetToFreeHint')}
              >
                {t('pricing.resetToFree')}
              </button>
            )}
          </div>
        </div>

        {/* Counter Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span>
              {usage.isUnlimited
                ? t('pricing.usageUnlimited')
                : t('pricing.usageCount', { used: usage.used, limit: usage.limit })}
            </span>
            <span>
              {usage.isUnlimited
                ? t('pricing.remainingUnlimited')
                : t('pricing.remainingChecks', { remaining: usage.remaining })}
            </span>
          </div>

          <div className="w-full h-3 border border-[#111111] bg-[#F1EEE6] overflow-hidden p-0.5">
            <div
              style={{
                width: usage.isUnlimited ? '100%' : `${Math.min(100, (usage.used / usage.limit) * 100)}%`
              }}
              className={`h-full border-r border-[#111111] transition-all duration-300 ${
                usage.isUnlimited
                  ? 'bg-[#2F7D5B]'
                  : usage.used >= usage.limit
                  ? 'bg-[#C0453A]'
                  : 'bg-[#111111]'
              }`}
            />
          </div>
        </div>

        {/* Friendly Non-Blocking Upgrade Prompt */}
        <div className="p-3 border border-[#111111] bg-[#F1EEE6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#2F7D5B] font-bold text-sm">💡</span>
            <p className="font-body text-sm text-[#111111]">
              {usage.isUnlimited
                ? t('pricing.promptUnlimited')
                : usage.used >= usage.limit
                ? t('pricing.promptExceeded')
                : t('pricing.promptRemaining')}
            </p>
          </div>

          {!usage.isUnlimited && (
            <Button
              variant="solid"
              size="sm"
              onClick={() => handleOpenCheckout('premium')}
              id="upgrade-usage-prompt-btn"
              className="shrink-0"
            >
              {t('pricing.upgradeUsage', { price: premiumPrice })}
            </Button>
          )}
        </div>
      </section>

      {/* 3. Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
          {t('pricing.billingCycleLabel')}
        </span>
        <div className="inline-flex border border-[#111111] bg-white p-1">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-[#111111] text-[#F1EEE6]'
                : 'text-[#111111] hover:bg-[#111111]/10'
            }`}
          >
            {t('pricing.monthlyOption')}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('semester')}
            className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 ${
              billingCycle === 'semester'
                ? 'bg-[#111111] text-[#F1EEE6]'
                : 'text-[#111111] hover:bg-[#111111]/10'
            }`}
          >
            <span>{t('pricing.semesterOption')}</span>
            <span className="bg-[#2F7D5B] text-white text-[9px] px-1 py-0.2">{t('pricing.saveBadge')}</span>
          </button>
        </div>
      </div>

      {/* 4. Three Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* PLAN 1: Free Starter */}
        <Card
          variant={currentPlan === 'free' ? 'cream' : 'white'}
          className={`flex flex-col justify-between ${
            currentPlan === 'free' ? 'ring-2 ring-[#111111]' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75">
                {t('pricing.free.tagline')}
              </span>
              {currentPlan === 'free' && <Badge status="Match" size="sm" />}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline text-4xl sm:text-5xl text-[#111111]">
                {t('pricing.free.price')}
              </span>
              <span className="text-xs font-mono uppercase text-[#111111]/70">
                {t('pricing.free.period')}
              </span>
            </div>

            <CardTitle className="mt-2">{t('pricing.free.name')}</CardTitle>
            <CardDescription>
              {t('pricing.free.description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-2.5 text-xs font-mono text-[#111111]/90">
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.free.feature1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.free.feature2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.free.feature3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.free.feature4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.free.feature5')}</span>
              </li>
              <li className="flex items-start gap-2 text-[#111111]/45">
                <span>✕</span>
                <span className="line-through">{t('pricing.free.feature6')}</span>
              </li>
              <li className="flex items-start gap-2 text-[#111111]/45">
                <span>✕</span>
                <span className="line-through">{t('pricing.free.feature7')}</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter>
            {currentPlan === 'free' ? (
              <Button variant="outline" size="md" className="w-full justify-center" disabled>
                {t('pricing.checkCurrentPlan')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={handleResetToFree}
                className="w-full justify-center"
              >
                {t('pricing.downgradeToFree')}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* PLAN 2: Student Premium */}
        <Card
          variant={currentPlan === 'premium' ? 'cream' : 'white'}
          className={`flex flex-col justify-between border-2 border-[#111111] relative ${
            currentPlan === 'premium' ? 'ring-2 ring-[#2F7D5B]' : ''
          }`}
        >
          <div className="absolute -top-3.5 left-6 bg-[#111111] text-[#F1EEE6] text-[11px] font-mono font-bold px-3 py-0.5 uppercase tracking-wider border border-[#111111]">
            {t('pricing.premium.badge')}
          </div>

          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2F7D5B]">
                {t('pricing.premium.tagline')}
              </span>
              {currentPlan === 'premium' && (
                <span className="text-[10px] font-mono font-bold bg-[#2F7D5B] text-white px-2 py-0.5 border border-[#111111]">
                  {t('pricing.premium.active')}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline text-4xl sm:text-5xl text-[#111111]">
                {t('pricing.premium.price', { price: premiumPrice })}
              </span>
              <span className="text-xs font-mono uppercase text-[#111111]/70">
                {premiumPeriodText}
              </span>
            </div>

            <CardTitle className="mt-2">{t('pricing.premium.name')}</CardTitle>
            <CardDescription>
              {t('pricing.premium.description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-2.5 text-xs font-mono text-[#111111]">
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span className="font-bold">{t('pricing.premium.feature1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.premium.feature2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.premium.feature3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.premium.feature4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.premium.feature5')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.premium.feature6')}</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter>
            {currentPlan === 'premium' ? (
              <Button variant="solid" size="md" className="w-full justify-center" disabled>
                {t('pricing.premium.activeButton')}
              </Button>
            ) : (
              <Button
                variant="solid"
                size="md"
                onClick={() => handleOpenCheckout('premium')}
                id="upgrade-premium-btn"
                className="w-full justify-center text-sm py-2.5"
              >
                {t('pricing.premium.upgradeButton')}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* PLAN 3: College License */}
        <Card
          variant={currentPlan === 'college' ? 'cream' : 'white'}
          className={`flex flex-col justify-between ${
            currentPlan === 'college' ? 'ring-2 ring-[#111111]' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75">
                {t('pricing.college.tagline')}
              </span>
              {currentPlan === 'college' && <Badge status="Match" size="sm" />}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline text-3xl sm:text-4xl text-[#111111]">
                {t('pricing.college.priceLabel')}
              </span>
              <span className="text-xs font-mono uppercase text-[#111111]/70">
                {t('pricing.college.period')}
              </span>
            </div>

            <CardTitle className="mt-2">{t('pricing.college.name')}</CardTitle>
            <CardDescription>
              {t('pricing.college.description')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-2.5 text-xs font-mono text-[#111111]/90">
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span className="font-bold">{t('pricing.college.feature1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.college.feature2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.college.feature3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.college.feature4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2F7D5B] font-bold">✓</span>
                <span>{t('pricing.college.feature5')}</span>
              </li>
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Link href="/college" className="w-full">
              <Button
                variant={currentPlan === 'college' ? 'solid' : 'outline'}
                size="md"
                id="explore-college-portal-btn"
                className="w-full justify-center"
              >
                {t('pricing.college.viewDashboard')}
              </Button>
            </Link>
            {currentPlan !== 'college' && (
              <button
                type="button"
                onClick={() => handleOpenCheckout('college')}
                className="text-[11px] font-mono underline hover:text-[#2F7D5B] text-center"
              >
                {t('pricing.college.simulateActivate')}
              </button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* 5. "Why It Pays For Itself" Section */}
      <section className="space-y-6 pt-4 border-t border-[#111111]">
        <SectionTitle
          tag={t('pricing.valueTag')}
          size="default"
          title={t('pricing.valueTitle')}
          subtitle={t('pricing.valueSubtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Students */}
          <div className="p-6 border border-[#111111] bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Sunburst size={18} className="text-[#2F7D5B]" />
              <h3 className="font-headline text-base uppercase text-[#111111]">
                {t('pricing.value1Title')}
              </h3>
            </div>
            <p className="font-body text-base text-[#111111]/85 leading-relaxed">
              {t('pricing.value1Body')}
            </p>
            <span className="inline-block text-xs font-mono font-bold text-[#2F7D5B] pt-2 border-t border-[#111111]/10">
              {t('pricing.value1Point')}
            </span>
          </div>

          {/* Card 2: Placement Cells */}
          <div className="p-6 border border-[#111111] bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Sunburst size={18} className="text-[#111111]" />
              <h3 className="font-headline text-base uppercase text-[#111111]">
                {t('pricing.value2Title')}
              </h3>
            </div>
            <p className="font-body text-base text-[#111111]/85 leading-relaxed">
              {t('pricing.value2Body')}
            </p>
            <span className="inline-block text-xs font-mono font-bold text-[#111111] pt-2 border-t border-[#111111]/10">
              {t('pricing.value2Point')}
            </span>
          </div>

          {/* Card 3: Explainable Precision */}
          <div className="p-6 border border-[#111111] bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Sunburst size={18} className="text-[#D98A1F]" />
              <h3 className="font-headline text-base uppercase text-[#111111]">
                {t('pricing.value3Title')}
              </h3>
            </div>
            <p className="font-body text-base text-[#111111]/85 leading-relaxed">
              {t('pricing.value3Body')}
            </p>
            <span className="inline-block text-xs font-mono font-bold text-[#2F7D5B] pt-2 border-t border-[#111111]/10">
              {t('pricing.value3Point')}
            </span>
          </div>
        </div>
      </section>

      {/* 5b. "How we stay sustainable" — assumptions + derived figures */}
      {sustainabilityEnabled && (
        <section className="space-y-6 pt-4 border-t border-[#111111]">
          <SectionTitle
            tag={t('sustainability.tag')}
            size="default"
            title={t('sustainability.title')}
            subtitle={t('sustainability.subtitle')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assumptions — editable so the working can be checked */}
            <Card variant="white" className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#111111]">
                <h3 className="font-headline text-base uppercase text-[#111111]">
                  {t('sustainability.assumptionsHeading')}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase bg-[#D98A1F] text-[#111111] px-2 py-0.5 border border-[#111111]">
                  {t('sustainability.tag')}
                </span>
              </div>

              <div className="space-y-3.5">
                {/* a1: average cost per AI call */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a1" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a1')} <span className="text-[#111111]/60">(Rs)</span>
                  </label>
                  <input
                    id="sus-a1"
                    type="number"
                    step="0.05"
                    min="0"
                    value={assumptions.avgCostPerAiCallInr}
                    onChange={(e) => setAssumption('avgCostPerAiCallInr', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a2: AI calls per check */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a2" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a2')}
                  </label>
                  <input
                    id="sus-a2"
                    type="number"
                    step="1"
                    min="0"
                    value={assumptions.aiCallsPerCheck}
                    onChange={(e) => setAssumption('aiCallsPerCheck', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a3: share of checks with no AI (shown as a percentage) */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a3" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a3')} <span className="text-[#111111]/60">(%)</span>
                  </label>
                  <input
                    id="sus-a3"
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={Math.round(assumptions.shareChecksWithoutAi * 100)}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value);
                      setAssumptions((prev) => ({
                        ...prev,
                        shareChecksWithoutAi: isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct)) / 100
                      }));
                    }}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a4: free plan limit */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a4" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a4')}
                  </label>
                  <input
                    id="sus-a4"
                    type="number"
                    step="1"
                    min="0"
                    value={assumptions.freeChecksPerMonth}
                    onChange={(e) => setAssumption('freeChecksPerMonth', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a5: assumed checks per student per month */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a5" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a5')}
                  </label>
                  <input
                    id="sus-a5"
                    type="number"
                    step="1"
                    min="0"
                    value={assumptions.avgChecksPerStudentPerMonth}
                    onChange={(e) => setAssumption('avgChecksPerStudentPerMonth', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a6: fixed monthly cost */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a6" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a6')}
                  </label>
                  <input
                    id="sus-a6"
                    type="number"
                    step="500"
                    min="0"
                    value={assumptions.monthlyFixedCostInr}
                    onChange={(e) => setAssumption('monthlyFixedCostInr', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a7: hosting per student */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a7" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a7')}
                  </label>
                  <input
                    id="sus-a7"
                    type="number"
                    step="0.1"
                    min="0"
                    value={assumptions.monthlyInfraPerStudentInr}
                    onChange={(e) => setAssumption('monthlyInfraPerStudentInr', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a8: Premium price */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a8" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a8')}
                  </label>
                  <input
                    id="sus-a8"
                    type="number"
                    step="10"
                    min="0"
                    value={assumptions.premiumPriceInr}
                    onChange={(e) => setAssumption('premiumPriceInr', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                {/* a9: assumed free students */}
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="sus-a9" className="text-sm text-[#111111]/85 flex-1">
                    {t('sustainability.a9')}
                  </label>
                  <input
                    id="sus-a9"
                    type="number"
                    step="100"
                    min="0"
                    value={assumptions.assumedFreeStudents}
                    onChange={(e) => setAssumption('assumedFreeStudents', e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#111111]/20 text-[11px] font-mono text-[#111111]/70 space-y-1">
                <p>
                  {t('sustainability.a1')}: {t('sustainability.vPerCall', { value: assumptions.avgCostPerAiCallInr.toFixed(2) })} ·{' '}
                  {t('sustainability.vCalls', { value: assumptions.aiCallsPerCheck })} ·{' '}
                  {t('sustainability.vShare', { value: Math.round((1 - assumptions.shareChecksWithoutAi) * 100) })}
                </p>
                <p>
                  {t('sustainability.vChecks', { value: assumptions.freeChecksPerMonth })} ·{' '}
                  {t('sustainability.vStudents', { value: assumptions.assumedFreeStudents })}
                </p>
              </div>
            </Card>

            {/* Derived figures in plain language. Polite live region: the numbers
                change as the assumptions above are edited, so announce them. */}
            <Card role="status" aria-live="polite" variant="cream" className="p-6 space-y-5">
              <h3 className="font-headline text-base uppercase text-[#111111] pb-3 border-b border-[#111111]">
                {t('sustainability.computedHeading')}
              </h3>

              {/* Average cost per check */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                    {t('sustainability.avgCostPerCheck')}
                  </span>
                  <span className="font-headline text-2xl text-[#2F7D5B]">
                    {rupees(sustainability.avgCostPerCheckInr)}
                  </span>
                </div>
                <p className="font-body text-sm text-[#111111]/85">
                  {t('sustainability.avgCostPerCheckBody', {
                    aiShare: Math.round((1 - assumptions.shareChecksWithoutAi) * 100),
                    cost: rupees(sustainability.avgCostPerCheckInr)
                  })}
                </p>
              </div>

              {/* Monthly cost per student */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                    {t('sustainability.monthlyCost')}
                  </span>
                  <span className="font-headline text-2xl text-[#111111]">
                    {rupees(sustainability.monthlyCostPerStudentInr)}
                  </span>
                </div>
                <p className="font-body text-sm text-[#111111]/85">
                  {t('sustainability.monthlyCostBody', {
                    checks: assumptions.avgChecksPerStudentPerMonth,
                    cost: rupees(sustainability.monthlyCostPerStudentInr)
                  })}
                </p>
              </div>

              {/* Break-even */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                    {t('sustainability.breakEven')}
                  </span>
                  <span className="font-headline text-2xl text-[#111111]">
                    {Number.isFinite(sustainability.breakEvenPremiumStudents)
                      ? sustainability.breakEvenPremiumStudents
                      : '—'}
                  </span>
                </div>
                <p className="font-body text-sm text-[#111111]/85">
                  {Number.isFinite(sustainability.breakEvenPremiumStudents)
                    ? t('sustainability.breakEvenBody', {
                        free: assumptions.assumedFreeStudents,
                        cost: rupees(assumptions.monthlyFixedCostInr + sustainability.freeTierMonthlyCostInr),
                        margin: rupees(sustainability.premiumContributionInr),
                        students: sustainability.breakEvenPremiumStudents
                      })
                    : t('sustainability.breakEvenUnreachable')}
                </p>
              </div>

              {/* Formula + worked example */}
              <div className="pt-3 border-t border-[#111111]/20 space-y-2">
                <p className="text-[11px] font-mono text-[#111111]/70">{t('sustainability.formulaNote')}</p>
                <div className="p-3 border border-[#111111] bg-white space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70 block">
                    {t('sustainability.exampleHeading')}
                  </span>
                  <p className="text-sm font-mono text-[#111111]">
                    {t('sustainability.exampleBody', {
                      cost: rupees(sustainability.avgCostPerCheckInr),
                      students: Number.isFinite(sustainability.breakEvenPremiumStudents)
                        ? sustainability.breakEvenPremiumStudents
                        : '—'
                    })}
                  </p>
                </div>
              </div>

              {/* Assumptions disclaimer */}
              <p className="text-[11px] font-mono text-[#C0453A] pt-2 border-t border-[#111111]/20">
                ⚠ {t('sustainability.disclaimer')}
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 6. MOCK CHECKOUT SCREEN (Structured for Razorpay Integration) */}
      {/* ==================================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F1EEE6] border-2 border-[#111111] max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#111111] pb-3">
              <div className="flex items-center gap-2">
                <Sunburst size={18} className="text-[#111111]" />
                <h3 className="font-headline text-base uppercase text-[#111111]">
                  {t('pricing.checkout.title')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-sm font-mono font-bold px-2 py-0.5 border border-[#111111] hover:bg-[#111111] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 border border-[#111111] bg-white space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-[#111111]/70">
                <span>{t('pricing.checkout.orderId')}</span>
                <span className="font-bold">order_SETU_{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between items-center text-[#111111]">
                <span className="font-bold uppercase">
                  {selectedPlanForCheckout === 'premium' ? t('pricing.premium.name') : t('pricing.checkout.collegeName')}
                </span>
                <span className="font-bold text-sm">
                  {t('pricing.checkout.amount', { price: selectedPlanForCheckout === 'premium' ? premiumPrice : 24999 })}
                </span>
              </div>
              <div className="text-[11px] text-[#111111]/75 pt-1 border-t border-[#111111]/10">
                {selectedPlanForCheckout === 'premium'
                  ? t('pricing.checkout.premiumSummary', { cycle: billingCycle === 'monthly' ? t('pricing.checkout.cycleMonthly') : t('pricing.checkout.cycleSemester') })
                  : t('pricing.checkout.collegeSummary')}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                {t('pricing.checkout.selectPayment')}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 text-xs font-mono font-bold border border-[#111111] text-center transition-colors ${
                    paymentMethod === 'upi'
                      ? 'bg-[#111111] text-[#F1EEE6]'
                      : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                  }`}
                >
                  {t('pricing.checkout.upi')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 text-xs font-mono font-bold border border-[#111111] text-center transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-[#111111] text-[#F1EEE6]'
                      : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                  }`}
                >
                  {t('pricing.checkout.card')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-2.5 text-xs font-mono font-bold border border-[#111111] text-center transition-colors ${
                    paymentMethod === 'netbanking'
                      ? 'bg-[#111111] text-[#F1EEE6]'
                      : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                  }`}
                >
                  {t('pricing.checkout.netbanking')}
                </button>
              </div>
            </div>

            {/* Razorpay Gateway Architectural Note */}
            <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-xs font-mono text-[#111111]">
              <span className="font-bold block uppercase text-[#2F7D5B] mb-0.5">
                {t('pricing.checkout.razorpayTitle')}
              </span>
              <p className="text-[11px] text-[#111111]/85">
                {t('pricing.checkout.razorpayBody')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#111111]">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCheckoutOpen(false)}
                disabled={isProcessingPayment}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="solid"
                size="md"
                onClick={handleConfirmMockPayment}
                disabled={isProcessingPayment}
                id="confirm-mock-payment-btn"
                className="bg-[#2F7D5B] text-white hover:bg-[#256348]"
              >
                {isProcessingPayment ? t('pricing.checkout.processing') : t('pricing.checkout.pay', { price: selectedPlanForCheckout === 'premium' ? premiumPrice : 24999 })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
