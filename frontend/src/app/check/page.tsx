'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Checklist,
  Requirement,
  RequirementKind,
  StudentProfile,
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_OPPORTUNITY_TITLE,
  SAMPLE_STUDENT_PROFILE,
  SAMPLE_OPPORTUNITIES,
  detectOpportunityType,
  parseOpportunityToChecklist,
  evaluateProfileAgainstOpportunity,
  AgentSuggestion,
  AgentProgressEvent
} from '@opportunity-kit/shared';
import {
  storageHelper,
  hasStoredProfile,
  getStoredProfile,
  saveStoredProfile,
  getStoredChecklist,
  saveStoredChecklist,
  saveStoredEvaluation
} from '../../lib/storage';
import { wakeBackend, runAgentOrchestration, BackendConnectionStatus } from '../../lib/api';
import { SectionTitle } from '../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Badge } from '../../components/Badge';
import { FailureAlert } from '../../components/LoadingSkeleton';
import { AgentActivityPanel, AgentActivityItem } from '../../components/AgentActivityPanel';
import { SuggestionsInbox } from '../../components/SuggestionsInbox';
import { ScamWarningPanel } from '../../components/ScamWarning';
import { useTranslation } from '../../lib/i18n/LanguageProvider';
import { PASTE_BOX_ID } from '../../lib/shortcuts';

export default function CheckPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Opportunity state
  const [opportunityTitle, setOpportunityTitle] = useState(SAMPLE_OPPORTUNITY_TITLE);
  const [opportunityText, setOpportunityText] = useState(SAMPLE_OPPORTUNITY_TEXT);
  const [typeSelection, setTypeSelection] = useState<'auto' | 'internship' | 'scholarship' | 'competition' | 'custom'>('auto');

  // Checklist state
  const [checklist, setChecklist] = useState<Checklist>({
    opportunityType: 'internship',
    title: SAMPLE_OPPORTUNITY_TITLE,
    requirements: [],
    sources: ['Pasted Opportunity Text'],
    warnings: []
  });

  // Profile & prompt state
  const [profile, setProfile] = useState<StudentProfile>(SAMPLE_STUDENT_PROFILE);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Agent framework and backend wake state
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>('waking');
  const [isOffline, setIsOffline] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [totalOrchestrationTimeMs, setTotalOrchestrationTimeMs] = useState<number | undefined>(undefined);
  const [agentActivity, setAgentActivity] = useState<AgentActivityItem[]>([
    { name: 'OpportunityReader', role: 'Eligibility Criteria Extractor', status: 'queued' },
    { name: 'GitHubAnalyzer', role: 'Repository & Tech Stack Scanner', status: 'queued' },
    { name: 'LinkedInAnalyzer', role: 'Experience & Credential Verifier', status: 'queued' },
    { name: 'VerifierAgent', role: 'Evidence Cross-Check Engine', status: 'queued' },
    { name: 'ResearchAgent', role: 'Grounded Live Web Research', status: 'queued' },
    { name: 'DiscoveryAgent', role: 'Related Opportunity Matcher', status: 'queued' }
  ]);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);

  // Requirement editing / adding state
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editReqForm, setEditReqForm] = useState<Partial<Requirement>>({});
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [newReqForm, setNewReqForm] = useState<{
    label: string;
    kind: RequirementKind;
    value: string;
    required: boolean;
    sourceSentence: string;
  }>({
    label: '',
    kind: 'skills',
    value: '',
    required: true,
    sourceSentence: ''
  });

  // 1. Initial Load: wake backend, check stored profile and parse initial text
  useEffect(() => {
    // Wake backend on page load to spin up cold Render free-tier instance
    setBackendStatus('waking');
    wakeBackend().then((res) => {
      setBackendStatus(res.status);
      if (res.status === 'offline') {
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }
    });

    const profileExists = hasStoredProfile();
    const loadedProfile = getStoredProfile();
    setProfile(loadedProfile);

    // Profile is missing if not explicitly saved and has no name/skills
    if (!profileExists && (!loadedProfile || !loadedProfile.name || loadedProfile.name === 'Student')) {
      setIsProfileMissing(true);
    } else {
      setIsProfileMissing(false);
    }

    // Load previously customized checklist if present, otherwise parse sample text
    const storedChecklist = getStoredChecklist();
    if (storedChecklist && storedChecklist.requirements && storedChecklist.requirements.length > 0) {
      setChecklist(storedChecklist);
      if (storedChecklist.title) setOpportunityTitle(storedChecklist.title);
    } else {
      reparseText(SAMPLE_OPPORTUNITY_TEXT, SAMPLE_OPPORTUNITY_TITLE, 'auto');
    }
  }, []);

  // 2. Parse text into structured checklist
  const reparseText = (
    text: string,
    title: string,
    typeMode: 'auto' | 'internship' | 'scholarship' | 'competition' | 'custom'
  ) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setChecklist({
        opportunityType: typeMode === 'auto' ? 'internship' : typeMode,
        title: title || 'Custom Opportunity',
        requirements: [],
        sources: ['Pasted Opportunity Text'],
        warnings: []
      });
      return;
    }

    const effectiveType = typeMode === 'auto' ? detectOpportunityType(text, title) : typeMode;
    const { checklist: parsed, warnings } = parseOpportunityToChecklist(text, title);

    const updatedChecklist: Checklist = {
      ...parsed,
      opportunityType: effectiveType,
      title: title || `${effectiveType.toUpperCase()} Opportunity`,
      warnings
    };

    setChecklist(updatedChecklist);
    saveStoredChecklist(updatedChecklist);
  };

  const handleTextChange = (newText: string) => {
    setOpportunityText(newText);
    reparseText(newText, opportunityTitle, typeSelection);
  };

  const handleTypeChange = (newType: 'auto' | 'internship' | 'scholarship' | 'competition' | 'custom') => {
    setTypeSelection(newType);
    reparseText(opportunityText, opportunityTitle, newType);
  };

  // Sample loading handlers
  const handleLoadSample = (sampleIndex = 0) => {
    const sample = SAMPLE_OPPORTUNITIES[sampleIndex] || SAMPLE_OPPORTUNITIES[0];
    setOpportunityTitle(sample.title);
    setOpportunityText(sample.text);
    setTypeSelection('auto');
    reparseText(sample.text, sample.title, 'auto');

    setNotification(t('check.noticeLoadedSample', { title: sample.title }));
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearText = () => {
    setOpportunityTitle('');
    setOpportunityText('');
    setChecklist({
      opportunityType: 'internship',
      title: 'Opportunity',
      requirements: [],
      sources: [],
      warnings: []
    });
  };

  // Profile setup helper from prompt
  const handleLoadSampleProfile = () => {
    setProfile(SAMPLE_STUDENT_PROFILE);
    saveStoredProfile(SAMPLE_STUDENT_PROFILE);
    setIsProfileMissing(false);
    setNotification(t('check.noticeLoadedProfile'));
    setTimeout(() => setNotification(null), 3000);
  };

  // Requirement CRUD
  const handleDeleteRequirement = (id: string) => {
    const updatedReqs = checklist.requirements.filter((r) => r.id !== id);
    const updatedChecklist: Checklist = {
      ...checklist,
      requirements: updatedReqs
    };
    setChecklist(updatedChecklist);
    saveStoredChecklist(updatedChecklist);
  };

  const handleStartEditRequirement = (req: Requirement) => {
    setEditingReqId(req.id);
    let valStr = '';
    if (Array.isArray(req.value)) {
      valStr = req.value.join(', ');
    } else if (req.value !== undefined && req.value !== null) {
      valStr = String(req.value);
    }

    setEditReqForm({
      ...req,
      value: valStr
    });
  };

  const handleSaveEditRequirement = (id: string) => {
    const updatedReqs = checklist.requirements.map((r) => {
      if (r.id !== id) return r;

      let parsedValue: any = editReqForm.value;
      if (editReqForm.kind === 'skills' || editReqForm.kind === 'year') {
        if (typeof editReqForm.value === 'string') {
          parsedValue = editReqForm.value
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          if (editReqForm.kind === 'year') {
            parsedValue = parsedValue.map((y: string) => parseInt(y, 10)).filter((n: number) => !isNaN(n));
          }
        }
      } else if (editReqForm.kind === 'cgpa' || editReqForm.kind === 'availability' || editReqForm.kind === 'projectCount') {
        parsedValue = parseFloat(String(editReqForm.value)) || editReqForm.value;
      }

      return {
        ...r,
        label: editReqForm.label || r.label,
        kind: editReqForm.kind || r.kind,
        value: parsedValue,
        required: editReqForm.required !== undefined ? editReqForm.required : r.required,
        sourceSentence: editReqForm.sourceSentence || r.sourceSentence
      };
    });

    const updatedChecklist: Checklist = { ...checklist, requirements: updatedReqs };
    setChecklist(updatedChecklist);
    saveStoredChecklist(updatedChecklist);
    setEditingReqId(null);
  };

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqForm.label.trim()) return;

    let parsedValue: any = newReqForm.value.trim();
    if (newReqForm.kind === 'skills' || newReqForm.kind === 'year') {
      parsedValue = newReqForm.value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (newReqForm.kind === 'year') {
        parsedValue = parsedValue.map((y: string) => parseInt(y, 10)).filter((n: number) => !isNaN(n));
      }
    } else if (newReqForm.kind === 'cgpa' || newReqForm.kind === 'availability' || newReqForm.kind === 'projectCount') {
      parsedValue = parseFloat(newReqForm.value) || 0;
    }

    const newReq: Requirement = {
      id: `req-custom-${Date.now()}`,
      label: newReqForm.label.trim(),
      kind: newReqForm.kind,
      value: parsedValue,
      required: newReqForm.required,
      sourceSentence: newReqForm.sourceSentence.trim() || t('check.manuallyAdded'),
      title: newReqForm.label.trim()
    };

    const updatedChecklist: Checklist = {
      ...checklist,
      requirements: [...checklist.requirements, newReq]
    };

    setChecklist(updatedChecklist);
    saveStoredChecklist(updatedChecklist);

    // Reset form
    setNewReqForm({
      label: '',
      kind: 'skills',
      value: '',
      required: true,
      sourceSentence: ''
    });
    setIsAddingReq(false);
  };

  // 3. Compare with My Profile
  const handleCompare = () => {
    if (!checklist.requirements || checklist.requirements.length === 0) {
      alert(t('check.compareNoRequirements'));
      return;
    }

    // Save checklist
    saveStoredChecklist(checklist);

    // Evaluate against profile
    const activeProfile = isProfileMissing ? SAMPLE_STUDENT_PROFILE : profile;
    const evalResult = evaluateProfileAgainstOpportunity(
      checklist.requirements,
      activeProfile,
      checklist.title || opportunityTitle || 'Opportunity Checklist',
      opportunityText
    );

    // Store evaluation
    saveStoredEvaluation(evalResult);

    // Navigate to results
    router.push('/result');
  };

  // 4. Run Multi-Agent Orchestration
  const handleRunAgents = async () => {
    setIsAgentRunning(true);
    setAgentActivity((prev) =>
      prev.map((a) => ({ ...a, status: 'running', message: 'Analyzing evidence...' }))
    );

    try {
      const activeProfile = isProfileMissing ? SAMPLE_STUDENT_PROFILE : profile;
      const result = await runAgentOrchestration(
        {
          opportunityText,
          profile: activeProfile
        },
        (progressEv: AgentProgressEvent) => {
          setAgentActivity((prev) =>
            prev.map((a) =>
              a.name === progressEv.agent
                ? {
                    ...a,
                    status: progressEv.status,
                    providerUsed: progressEv.providerUsed || a.providerUsed,
                    timeTakenMs: progressEv.timeTakenMs || a.timeTakenMs,
                    message: progressEv.message || a.message
                  }
                : a
            )
          );
        }
      );

      if (result.isOfflineFallback) {
        setIsOffline(true);
      }

      setTotalOrchestrationTimeMs(result.totalTimeMs);
      setSuggestions(result.suggestions || []);

      // Synchronize agent activity with final results
      setAgentActivity((prev) =>
        prev.map((a) => {
          const res = result.results[a.name];
          if (res) {
            return {
              ...a,
              status: res.status,
              providerUsed: res.providerUsed,
              timeTakenMs: res.timeTakenMs,
              message: res.notes?.[0] || 'Done'
            };
          }
          return a;
        })
      );

      setNotification(
        t('check.noticeAgentsDone', { seconds: (result.totalTimeMs / 1000).toFixed(2) })
      );
    } catch (err: any) {
      console.warn('Agent orchestration error:', err);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleAcceptSuggestion = (sug: AgentSuggestion) => {
    const currentProfile = getStoredProfile();
    let updated = { ...currentProfile };

    if (sug.type === 'skill') {
      const skillName = String(sug.value).trim();
      const skills = Array.isArray(updated.skills) ? [...updated.skills] : [];
      if (!skills.some((s) => s.toLowerCase() === skillName.toLowerCase())) {
        skills.push(skillName);
        updated.skills = skills;
      }
    } else if (sug.type === 'link') {
      if (sug.value?.field === 'github' && !updated.links?.github) {
        updated.links = {
          ...updated.links,
          github: 'https://github.com/alexsharma'
        };
      }
    }

    saveStoredProfile(updated);
    setProfile(updated);
    setNotification(t('check.noticeAcceptedSuggestion', { title: sug.title }));
    setSuggestions((prev) =>
      prev.map((item) => (item.id === sug.id ? { ...item, status: 'accepted' as const } : item))
    );
  };

  const handleRejectSuggestion = (sugId: string) => {
    setSuggestions((prev) =>
      prev.map((item) => (item.id === sugId ? { ...item, status: 'rejected' as const } : item))
    );
  };

  const detectedType = detectOpportunityType(opportunityText, opportunityTitle);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag={t('check.tag')}
          title={t('check.title')}
          subtitle={t('check.subtitle')}
        />
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-[#2F7D5B] text-xs font-mono font-bold flex items-center justify-between">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification(null)} className="underline text-xs">
            {t('check.dismiss')}
          </button>
        </div>
      )}

      {/* Backend Waking State Banner */}
      {backendStatus === 'waking' && (
        <div
          id="waking-agents-banner"
          className="p-3.5 border-2 border-[#D98A1F] bg-[#D98A1F]/10 text-[#111111] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D98A1F] animate-ping" />
            <span className="font-bold uppercase tracking-wider text-sm">
              {t('check.wakingUp')}
            </span>
            <span className="text-[#111111]/70 hidden md:inline">
              {t('check.wakingDetail')}
            </span>
          </div>
          <span className="text-[11px] text-[#111111]/60 font-bold">
            {t('check.renderFreeTier')}
          </span>
        </div>
      )}

      {/* Offline Mode Banner */}
      {isOffline && (
        <div
          id="offline-mode-banner"
          className="p-3.5 border-2 border-[#111111] bg-[#F1EEE6] text-[#111111] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 font-bold uppercase bg-[#111111] text-[#F1EEE6] text-[10px]">
              {t('check.offlineMode')}
            </span>
            <span className="font-bold">
              {t('check.offlineRunning')}
            </span>
            <span className="text-[#111111]/70">
              {t('check.offlineDetail')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setBackendStatus('waking');
              wakeBackend().then((res) => {
                setBackendStatus(res.status);
                setIsOffline(res.status === 'offline');
              });
            }}
            className="underline font-bold text-xs hover:text-[#D98A1F] text-left sm:text-right"
          >
            {t('check.retryConnection')}
          </button>
        </div>
      )}

      {/* Friendly Prompt: Missing Profile */}
      {isProfileMissing && (
        <FailureAlert
          type="missing_profile"
          message={t('check.missingProfileMessage')}
          actionLabel={t('check.loadBenchmarkProfile')}
          onAction={handleLoadSampleProfile}
        />
      )}

      {/* Main Grid: Input Form + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="cream">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>{t('check.cardDescriptionTitle')}</CardTitle>
                <CardDescription>
                  {t('check.cardDescriptionBody')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() => handleLoadSample(0)}
                  id="load-sample-opp-btn"
                >
                  {t('check.loadSampleOpportunity')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearText}
                >
                  {t('check.clear')}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Sample Quick Picker Pills */}
              <div>
                <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-1.5">
                  {t('check.testOtherScenarios')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample(1)}
                    className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
                  >
                    {t('check.sampleStem')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(2)}
                    className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
                  >
                    {t('check.sampleHackathon')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(3)}
                    className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
                  >
                    {t('check.sampleIoT')}
                  </button>
                </div>
              </div>

              {/* Type Selector & Opportunity Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor="type-selector"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
                  >
                    {t('check.opportunityType')}
                  </label>
                  <select
                    id="type-selector"
                    value={typeSelection}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-base bg-white text-[#111111] border border-[#111111] font-body focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  >
                    <option value="auto">{t('check.autoDetect', { type: detectedType })}</option>
                    <option value="internship">{t('check.typeInternship')}</option>
                    <option value="scholarship">{t('check.typeScholarship')}</option>
                    <option value="competition">{t('check.typeCompetitionHackathon')}</option>
                    <option value="custom">{t('check.typeCustomOther')}</option>
                  </select>
                </div>

                <Input
                  label={t('check.opportunityTitleLabel')}
                  id="opp-title-input"
                  value={opportunityTitle}
                  onChange={(e) => setOpportunityTitle(e.target.value)}
                  placeholder={t('check.opportunityTitlePlaceholder')}
                />
              </div>

              {/* Large Textarea */}
              <div>
                <label
                  htmlFor={PASTE_BOX_ID}
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
                >
                  {t('check.listingTextLabel')}
                </label>
                <Textarea
                  id={PASTE_BOX_ID}
                  rows={8}
                  value={opportunityText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={t('check.listingTextPlaceholder')}
                  className="font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Empty paste failure alert */}
              {!opportunityText.trim() && (
                <FailureAlert
                  type="empty_paste"
                  actionLabel={t('check.loadBenchmarkOpp')}
                  onAction={() => handleLoadSample(0)}
                />
              )}
            </CardContent>
          </Card>

          {/* Rule-based scam & safety warning (plain TypeScript, no AI) */}
          <ScamWarningPanel text={opportunityText} />
        </div>

        {/* Right Column: Editable Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="cream">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>{t('check.checklistTitle')}</CardTitle>
                <CardDescription>
                  {t('check.checklistDescription', { count: checklist.requirements.length })}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingReq(true)}
                id="add-req-btn"
              >
                {t('check.addButton')}
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Parse Warnings */}
              {checklist.warnings && checklist.warnings.length > 0 && (
                <div className="p-3 border border-[#D98A1F] bg-[#D98A1F]/10 text-xs font-mono text-[#111111]">
                  <span className="font-bold block uppercase text-[#D98A1F] mb-1">
                    {t('check.parseWarnings', { count: checklist.warnings.length })}
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#111111]/85">
                    {checklist.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Text with no detectable requirements */}
              {opportunityText.trim().length > 0 && checklist.requirements.length === 0 && (
                <FailureAlert
                  type="unparseable"
                  actionLabel={t('check.addManually')}
                  onAction={() => setIsAddingReq(true)}
                />
              )}

              {/* Add Requirement Form */}
              {isAddingReq && (
                <form
                  onSubmit={handleAddRequirement}
                  className="p-4 border-2 border-[#111111] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#111111] pb-2">
                    <span className="font-headline text-xs uppercase">{t('check.addNewRequirement')}</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingReq(false)}
                      className="text-xs font-mono underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>

                  <Input
                    label={t('check.requirementLabel')}
                    required
                    value={newReqForm.label}
                    onChange={(e) => setNewReqForm({ ...newReqForm, label: e.target.value })}
                    placeholder={t('check.requirementLabelPlaceholder')}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1">
                        {t('check.kindLabel')}
                      </label>
                      <select
                        value={newReqForm.kind}
                        onChange={(e) => setNewReqForm({ ...newReqForm, kind: e.target.value as RequirementKind })}
                        className="w-full px-2 py-1.5 text-xs bg-white text-[#111111] border border-[#111111]"
                      >
                        <option value="year">{t('check.kind.yearOfStudy')}</option>
                        <option value="cgpa">{t('check.kind.cgpaCutoff')}</option>
                        <option value="skills">{t('check.kind.technicalSkills')}</option>
                        <option value="document">{t('check.kind.document')}</option>
                        <option value="link">{t('check.kind.link')}</option>
                        <option value="availability">{t('check.kind.availability')}</option>
                        <option value="projectCount">{t('check.kind.projectCount')}</option>
                        <option value="projectTag">{t('check.kind.projectTag')}</option>
                        <option value="deadline">{t('check.kind.deadline')}</option>
                        <option value="custom">{t('check.kind.custom')}</option>
                      </select>
                    </div>

                    <Input
                      label={t('check.valueLabel')}
                      value={newReqForm.value}
                      onChange={(e) => setNewReqForm({ ...newReqForm, value: e.target.value })}
                      placeholder={t('check.valuePlaceholder')}
                    />
                  </div>

                  <Input
                    label={t('check.sourceSentenceLabel')}
                    value={newReqForm.sourceSentence}
                    onChange={(e) => setNewReqForm({ ...newReqForm, sourceSentence: e.target.value })}
                    placeholder={t('check.sourceSentencePlaceholder')}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newReqForm.required}
                        onChange={(e) => setNewReqForm({ ...newReqForm, required: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#111111]"
                      />
                      <span>{t('check.mandatoryCriterion')}</span>
                    </label>

                    <Button variant="solid" size="sm" type="submit">
                      {t('check.addToChecklist')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Editable Checklist Items List */}
              <div className="space-y-3">
                {checklist.requirements.map((req, idx) => {
                  const isEditing = editingReqId === req.id;

                  return (
                    <div
                      key={req.id || idx}
                      className="p-3.5 border border-[#111111] bg-white space-y-2 transition-colors hover:border-[#111111]"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            label={t('check.labelLabel')}
                            value={editReqForm.label || ''}
                            onChange={(e) => setEditReqForm({ ...editReqForm, label: e.target.value })}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-mono font-bold uppercase text-[#111111] mb-1">
                                {t('check.kindLabel')}
                              </label>
                              <select
                                value={editReqForm.kind || req.kind}
                                onChange={(e) => setEditReqForm({ ...editReqForm, kind: e.target.value as RequirementKind })}
                                className="w-full px-2 py-1 text-xs bg-white text-[#111111] border border-[#111111]"
                              >
                                <option value="year">{t('check.kindShort.year')}</option>
                                <option value="cgpa">{t('check.kindShort.cgpa')}</option>
                                <option value="skills">{t('check.kindShort.skills')}</option>
                                <option value="document">{t('check.kindShort.document')}</option>
                                <option value="link">{t('check.kindShort.link')}</option>
                                <option value="availability">{t('check.kindShort.availability')}</option>
                                <option value="projectCount">{t('check.kindShort.projectCount')}</option>
                                <option value="projectTag">{t('check.kindShort.projectTag')}</option>
                                <option value="deadline">{t('check.kindShort.deadline')}</option>
                                <option value="custom">{t('check.kindShort.custom')}</option>
                              </select>
                            </div>

                            <Input
                              label={t('check.valueLabel')}
                              value={String(editReqForm.value ?? '')}
                              onChange={(e) => setEditReqForm({ ...editReqForm, value: e.target.value })}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editReqForm.required ?? req.required}
                                onChange={(e) => setEditReqForm({ ...editReqForm, required: e.target.checked })}
                                className="w-3.5 h-3.5 accent-[#111111]"
                              />
                              <span>{t('common.required')}</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingReqId(null)}
                                className="text-xs font-mono underline"
                              >
                                {t('common.cancel')}
                              </button>
                              <Button
                                variant="solid"
                                size="sm"
                                onClick={() => handleSaveEditRequirement(req.id)}
                              >
                                {t('common.save')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 uppercase bg-[#111111] text-[#F1EEE6]">
                                {req.kind}
                              </span>
                              <h4 className="font-headline text-sm uppercase tracking-tight text-[#111111]">
                                {req.label || req.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditRequirement(req)}
                                className="text-[11px] font-mono px-2 py-0.5 border border-[#111111] hover:bg-[#111111] hover:text-white"
                                title={t('check.editRequirementTitle')}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequirement(req.id)}
                                className="text-[11px] font-mono px-2 py-0.5 border border-[#C0453A] text-[#C0453A] hover:bg-[#C0453A] hover:text-white"
                                title={t('check.deleteRequirementTitle')}
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {/* Requirement Value preview */}
                          <div className="text-xs font-mono text-[#111111]/85">
                            <span className="font-bold">{t('check.asks')}</span>
                            <span>
                              {Array.isArray(req.value) ? req.value.join(', ') : String(req.value ?? t('common.required'))}
                            </span>
                          </div>

                          {/* Source sentence traceability */}
                          {req.sourceSentence && (
                            <div className="text-[11px] font-mono text-[#111111]/60 italic bg-[#F1EEE6] p-1.5 border-l-2 border-[#111111]">
                              {t('check.sourcePrefix')}&ldquo;{req.sourceSentence}&rdquo;
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Compare Button Action & Agent Pipeline Trigger */}
              <div className="pt-4 border-t border-[#111111] space-y-3">
                <Button
                  variant="solid"
                  size="lg"
                  onClick={handleCompare}
                  id="compare-btn"
                  className="w-full justify-center text-sm sm:text-base py-3"
                  disabled={checklist.requirements.length === 0}
                >
                  {t('check.compareWithProfile')}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRunAgents}
                  id="run-agents-btn"
                  disabled={isAgentRunning || checklist.requirements.length === 0}
                  className="w-full justify-center text-sm py-2.5 flex items-center gap-2"
                >
                  {isAgentRunning ? t('check.runningAgents') : t('check.runAgents')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Agent Activity Live Panel */}
      <div className="space-y-4 pt-4 border-t-2 border-[#111111]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-[#111111]">
              {t('check.liveAgentActivity')}
            </h3>
            <p className="text-sm font-sans text-[#555555]">
              {t('check.liveAgentDescription')}
            </p>
          </div>
          <Button
            variant="solid"
            size="sm"
            onClick={handleRunAgents}
            disabled={isAgentRunning || checklist.requirements.length === 0}
          >
            {isAgentRunning ? t('check.agentsRunning') : t('check.triggerAgentRun')}
          </Button>
        </div>

        <AgentActivityPanel
          activity={agentActivity}
          isRunning={isAgentRunning}
          totalTimeMs={totalOrchestrationTimeMs}
        />
      </div>

      {/* Suggestions Inbox */}
      <div className="space-y-4 pt-4 border-t-2 border-[#111111]">
        <SuggestionsInbox
          suggestions={suggestions}
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
        />
        <div className="p-3 border border-[#111111] bg-white text-xs font-mono text-[#555555]">
          <span className="font-bold text-[#111111]">{t('check.safetyRulePrefix')}</span>
          {t('check.safetyRuleBody')}
        </div>
      </div>
    </div>
  );
}
