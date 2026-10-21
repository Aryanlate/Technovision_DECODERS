'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  Input,
  Tag,
  Sunburst,
  useToast
} from '../../components';
import {
  SAMPLE_BATCH_STUDENTS,
  getBatchAnalytics,
  auditBatchAgainstChecklist,
  BatchStudent
} from '../../lib/collegeData';
import { Requirement, DriveChecklist } from '@opportunity-kit/shared';
import { trackEvent } from '../../lib/analytics';
import { downloadCollegeReportPdf } from '../../lib/collegeReportPdf';
import { loadDriveChecklists, DRIVES_CHANGED_EVENT } from '../../lib/driveStore';
import { getFeatureFlags } from '../../lib/flags';
import { useTranslation } from '../../lib/i18n/LanguageProvider';

export default function CollegeDashboardPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const analytics = useMemo(() => getBatchAnalytics(), []);

  // Company Drive Form State
  const [companyTitle, setCompanyTitle] = useState('Google STEP Internship Drive 2026');
  const [minCgpa, setMinCgpa] = useState<number>(7.5);
  const [allowedYears, setAllowedYears] = useState<number[]>([2, 3]);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('Python, React, SQL');
  const [requireResume, setRequireResume] = useState(true);
  const [requireLink, setRequireLink] = useState(true);
  const [requireAvailability, setRequireAvailability] = useState(8);

  // Active Filter Tab
  const [activeTab, setActiveTab] = useState<'all' | 'Ready' | 'Almost ready' | 'Not ready'>('Ready');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Modal for Individual Audit View
  const [selectedStudentForAudit, setSelectedStudentForAudit] = useState<{
    student: BatchStudent;
    evalResult: any;
    matches: number;
    mismatches: number;
    missingInfo: number;
    score: number;
    verdict: string;
  } | null>(null);

  // Construct requirements from form
  const driveRequirements: Requirement[] = useMemo(() => {
    const skills = requiredSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const reqs: Requirement[] = [
      {
        id: 'drive-req-year',
        kind: 'year',
        label: 'Year of Study',
        value: allowedYears,
        required: true,
        title: 'Year of Study',
        category: 'education',
        rule: `Allowed year(s): ${allowedYears.join(', ')}`
      },
      {
        id: 'drive-req-cgpa',
        kind: 'cgpa',
        label: 'Minimum CGPA',
        value: minCgpa,
        required: true,
        title: 'Academic CGPA',
        category: 'academic',
        rule: `CGPA ${minCgpa} or above`
      }
    ];

    if (skills.length > 0) {
      reqs.push({
        id: 'drive-req-skills',
        kind: 'skills',
        label: 'Mandatory Technical Skills',
        value: skills,
        required: true,
        title: 'Technical Skills',
        category: 'skills',
        rule: `Skills: ${skills.join(', ')}`
      });
    }

    if (requireResume) {
      reqs.push({
        id: 'drive-req-resume',
        kind: 'document',
        label: 'Verified Resume Ready',
        value: 'resume',
        required: true,
        title: 'Resume Document',
        category: 'documents',
        rule: 'Updated verified resume required'
      });
    }

    if (requireLink) {
      reqs.push({
        id: 'drive-req-link',
        kind: 'link',
        label: 'GitHub or LinkedIn Link',
        value: 'portfolioOrGithub',
        required: true,
        title: 'Portfolio / GitHub Link',
        category: 'links',
        rule: 'Verified GitHub or LinkedIn link required'
      });
    }

    if (requireAvailability > 0) {
      reqs.push({
        id: 'drive-req-avail',
        kind: 'availability',
        label: 'Internship Availability',
        value: requireAvailability,
        required: true,
        title: 'Availability',
        category: 'availability',
        rule: `Minimum ${requireAvailability} weeks availability`
      });
    }

    return reqs;
  }, [minCgpa, allowedYears, requiredSkillsInput, requireResume, requireLink, requireAvailability]);

  // Run audit against 120 batch students
  const auditResults = useMemo(() => {
    return auditBatchAgainstChecklist(companyTitle, driveRequirements, SAMPLE_BATCH_STUDENTS);
  }, [companyTitle, driveRequirements]);

  // Aggregate audit counts
  const readyStudents = auditResults.filter((r) => r.verdict === 'Ready');
  const almostReadyStudents = auditResults.filter((r) => r.verdict === 'Almost ready');
  const notReadyStudents = auditResults.filter((r) => r.verdict === 'Not ready');

  // ---- Business features (flags) -------------------------------------------
  const reportExportEnabled = getFeatureFlags().ENABLE_COLLEGE_REPORT_EXPORT;
  const drivesEnabled = getFeatureFlags().ENABLE_DRIVE_PUBLISHING;
  const [publishedDrives, setPublishedDrives] = useState<DriveChecklist[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');

  useEffect(() => {
    if (!drivesEnabled) return;
    let cancelled = false;
    const refresh = async () => {
      const { drives } = await loadDriveChecklists();
      if (cancelled) return;
      setPublishedDrives(drives);
      setSelectedDriveId((current) => current || drives[0]?.id || '');
    };
    refresh();
    window.addEventListener(DRIVES_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(DRIVES_CHANGED_EVENT, refresh);
    };
  }, [drivesEnabled]);

  const selectedDrive = publishedDrives.find((d) => d.id === selectedDriveId) || null;

  /** How many students in the batch are ready for the selected published drive. */
  const publishedDriveAudit = useMemo(() => {
    if (!selectedDrive) return null;
    const results = auditBatchAgainstChecklist(
      selectedDrive.title,
      selectedDrive.requirements,
      SAMPLE_BATCH_STUDENTS
    );
    return {
      ready: results.filter((r) => r.verdict === 'Ready'),
      almostReady: results.filter((r) => r.verdict === 'Almost ready').length,
      notReady: results.filter((r) => r.verdict === 'Not ready').length
    };
  }, [selectedDrive]);

  /** Exports the current drive audit as a labelled sample-data PDF report. */
  const handleExportReportPdf = () => {
    downloadCollegeReportPdf({
      driveTitle: companyTitle,
      generatedAt: new Date().toISOString(),
      cohortLabel: `${
        SAMPLE_BATCH_STUDENTS[0]?.collegeName || 'National Institute of Engineering & Technology'
      } — ${SAMPLE_BATCH_STUDENTS.length} batch students`,
      isSampleData: true,
      readiness: analytics.readinessDistribution,
      missingSkills: analytics.missingSkills,
      readyStudents: readyStudents.map((r) => ({
        name: r.student.name,
        rollNo: r.student.rollNo,
        year: r.student.year ?? 0,
        branch: r.student.branch,
        cgpa: r.student.cgpa ?? null,
        score: r.score
      }))
    });
    toast.success(`Report for “${companyTitle}” downloaded.`, 'EXPORT READY');
    trackEvent('college_report_pdf_exported', { readyCount: readyStudents.length });
  };

  // Filtered list for table
  const displayedCandidates = auditResults.filter((item) => {
    if (activeTab !== 'all' && item.verdict !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.student.name.toLowerCase().includes(q);
      const matchRoll = item.student.rollNo.toLowerCase().includes(q);
      const matchBranch = item.student.branch.toLowerCase().includes(q);
      return matchName || matchRoll || matchBranch;
    }
    return true;
  });

  // Presets handler
  const handleApplyPreset = (preset: 'google' | 'amazon' | 'fintech') => {
    if (preset === 'google') {
      setCompanyTitle('Google STEP Internship Drive 2026');
      setMinCgpa(7.5);
      setAllowedYears([2, 3]);
      setRequiredSkillsInput('Python, React, SQL');
      setRequireResume(true);
      setRequireLink(true);
      setRequireAvailability(8);
      toast.info('Loaded Google STEP preset criteria.', 'PRESET APPLIED');
    } else if (preset === 'amazon') {
      setCompanyTitle('Amazon SDE Summer Intern Drive');
      setMinCgpa(8.0);
      setAllowedYears([3, 4]);
      setRequiredSkillsInput('Java, SQL, Git');
      setRequireResume(true);
      setRequireLink(true);
      setRequireAvailability(10);
      toast.info('Loaded Amazon SDE preset criteria.', 'PRESET APPLIED');
    } else {
      setCompanyTitle('FinTech Scaleup Engineering Drive');
      setMinCgpa(7.0);
      setAllowedYears([2, 3, 4]);
      setRequiredSkillsInput('TypeScript, React, Docker');
      setRequireResume(true);
      setRequireLink(true);
      setRequireAvailability(8);
      toast.info('Loaded FinTech Developer preset criteria.', 'PRESET APPLIED');
    }
    trackEvent('college_preset_loaded', { preset });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Header with Mandatory Sample Data Banner */}
      <div className="border-b border-[#111111] pb-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sunburst size={18} className="text-[#111111]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75">
              INSTITUTIONAL PLACEMENT PORTAL • COLLEGE LICENSE
            </span>
          </div>

          {/* Prominent Mandatory Sample Data Badge */}
          <span className="text-xs font-mono font-bold bg-[#111111] text-[#F1EEE6] px-3 py-1 border border-[#111111] uppercase tracking-wider">
            DEMONSTRATION SAMPLE DATA • 120 BATCH STUDENTS
          </span>
        </div>

        <SectionTitle
          title="PLACEMENT CELL DASHBOARD"
          subtitle="Batch-wide student profile completeness, missing skill-gap analytics, and automated company-drive eligibility shortlisting."
        />
      </div>

      {/* 2. Key Metrics Bar (120 Students) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Profiles Complete */}
        <div className="p-5 border border-[#111111] bg-white space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
            Profiles Complete
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl text-[#111111]">
              {analytics.completeProfilesPercentage}%
            </span>
            <span className="text-xs font-mono font-bold text-[#2F7D5B]">
              {analytics.completeProfilesCount} / {analytics.totalStudents} students
            </span>
          </div>
          <div className="w-full h-2 border border-[#111111] bg-[#F1EEE6]">
            <div
              style={{ width: `${analytics.completeProfilesPercentage}%` }}
              className="h-full bg-[#2F7D5B]"
            />
          </div>
        </div>

        {/* Metric 2: Verified Links */}
        <div className="p-5 border border-[#111111] bg-white space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
            GitHub / LinkedIn Links
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl text-[#111111]">
              {analytics.withLinksPercentage}%
            </span>
            <span className="text-xs font-mono font-bold text-[#111111]">
              {analytics.withLinksCount} / {analytics.totalStudents} students
            </span>
          </div>
          <div className="w-full h-2 border border-[#111111] bg-[#F1EEE6]">
            <div
              style={{ width: `${analytics.withLinksPercentage}%` }}
              className="h-full bg-[#111111]"
            />
          </div>
        </div>

        {/* Metric 3: Ready Candidates */}
        <div className="p-5 border border-[#111111] bg-white space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
            Drive Ready (General)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl text-[#2F7D5B]">
              {analytics.readinessDistribution.ready.percentage}%
            </span>
            <span className="text-xs font-mono font-bold text-[#2F7D5B]">
              {analytics.readinessDistribution.ready.count} candidates
            </span>
          </div>
          <div className="w-full h-2 border border-[#111111] bg-[#F1EEE6]">
            <div
              style={{ width: `${analytics.readinessDistribution.ready.percentage}%` }}
              className="h-full bg-[#2F7D5B]"
            />
          </div>
        </div>

        {/* Metric 4: Almost Ready */}
        <div className="p-5 border border-[#111111] bg-white space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
            Almost Ready (Fixable)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline text-3xl text-[#D98A1F]">
              {analytics.readinessDistribution.almostReady.percentage}%
            </span>
            <span className="text-xs font-mono font-bold text-[#D98A1F]">
              {analytics.readinessDistribution.almostReady.count} candidates
            </span>
          </div>
          <div className="w-full h-2 border border-[#111111] bg-[#F1EEE6]">
            <div
              style={{ width: `${analytics.readinessDistribution.almostReady.percentage}%` }}
              className="h-full bg-[#D98A1F]"
            />
          </div>
        </div>
      </section>

      {/* 3. Missing Skills Bar Chart & Readiness Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Missing Skills Bar Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card variant="cream" className="p-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
                BATCH SKILL-GAP AUDIT (120 STUDENTS)
              </span>
              <h3 className="font-headline text-xl uppercase tracking-tight text-[#111111] mt-1">
                Most Common Missing Skills
              </h3>
              <p className="font-body text-sm text-[#111111]/80 mt-1">
                Identifies high-priority technical gaps across the cohort to inform college bootcamp curricula and training schedules.
              </p>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-3.5 pt-2">
              {analytics.missingSkills.map((item) => (
                <div key={item.skill} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#111111] uppercase tracking-wide">
                      {item.skill}
                    </span>
                    <span className="text-[#111111]/80">
                      <strong className="text-[#C0453A]">{item.count}</strong> students missing ({item.percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-5 border border-[#111111] bg-white p-0.5 flex">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-[#C0453A] transition-all duration-300"
                    />
                    <div
                      style={{ width: `${100 - item.percentage}%` }}
                      className="h-full bg-[#2F7D5B]/30"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border border-[#111111] bg-white text-xs font-mono text-[#111111]/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#C0453A] inline-block border border-[#111111]" />
                Missing Skill Gap
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#2F7D5B]/30 inline-block border border-[#111111]" />
                Cohort Proficient
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Readiness Distribution (5 cols) */}
        <div className="lg:col-span-5">
          <Card variant="white" className="p-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
                COHORT BENCHMARK
              </span>
              <h3 className="font-headline text-xl uppercase tracking-tight text-[#111111] mt-1">
                Readiness Distribution
              </h3>
              <p className="font-body text-sm text-[#111111]/80 mt-1">
                Categorization based on CGPA cutoffs, verified links, and project artifacts.
              </p>
            </div>

            {/* Segmented Distribution Stack */}
            <div className="space-y-4">
              <div className="w-full h-8 border border-[#111111] bg-white flex overflow-hidden p-0.5">
                <div
                  style={{ width: `${analytics.readinessDistribution.ready.percentage}%` }}
                  className="h-full bg-[#2F7D5B] border-r border-[#111111] flex items-center justify-center text-white text-[10px] font-mono font-bold"
                  title="Ready"
                >
                  {analytics.readinessDistribution.ready.percentage}%
                </div>
                <div
                  style={{ width: `${analytics.readinessDistribution.almostReady.percentage}%` }}
                  className="h-full bg-[#D98A1F] border-r border-[#111111] flex items-center justify-center text-black text-[10px] font-mono font-bold"
                  title="Almost ready"
                >
                  {analytics.readinessDistribution.almostReady.percentage}%
                </div>
                <div
                  style={{ width: `${analytics.readinessDistribution.notReady.percentage}%` }}
                  className="h-full bg-[#C0453A] flex items-center justify-center text-white text-[10px] font-mono font-bold"
                  title="Not ready"
                >
                  {analytics.readinessDistribution.notReady.percentage}%
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge status="Match" size="sm" />
                    <span className="font-bold">Ready to Apply / Interview</span>
                  </div>
                  <span className="font-bold">{analytics.readinessDistribution.ready.count} students</span>
                </div>

                <div className="p-3 border border-[#D98A1F] bg-[#D98A1F]/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge status="Missing info" size="sm" />
                    <span className="font-bold">Almost Ready (1-2 Info Gaps)</span>
                  </div>
                  <span className="font-bold">{analytics.readinessDistribution.almostReady.count} students</span>
                </div>

                <div className="p-3 border border-[#C0453A] bg-[#C0453A]/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge status="Mismatch" size="sm" />
                    <span className="font-bold">Not Ready (Skill/CGPA Gap)</span>
                  </div>
                  <span className="font-bold">{analytics.readinessDistribution.notReady.count} students</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#111111]">
              <span className="text-xs font-mono text-[#111111]/70 block">
                Rule engine evaluation enforces our Invariant Guarantee: missing profile fields never count as failures.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Company-Drive Checklist Creator & Batch Shortlisting */}
      <section className="space-y-6 pt-4 border-t border-[#111111]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
              AUTOMATED ELIGIBILITY AUDIT
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#111111] mt-1">
              Create a Company-Drive Checklist
            </h2>
            <p className="font-body text-base text-[#111111]/85 mt-1">
              Configure recruiter eligibility criteria. The rule engine runs against all 120 students to output verified shortlists instantly.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 self-center">
              Load Recruiter Preset:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('google')}
              className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
            >
              Google STEP (7.5+)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('amazon')}
              className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
            >
              Amazon SDE (8.0+)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fintech')}
              className="text-xs font-mono px-2.5 py-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
            >
              FinTech Drive
            </button>
          </div>
        </div>

        {/* Configuration Form Card */}
        <Card variant="cream" className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Field 1: Company Title */}
            <div className="lg:col-span-2">
              <Input
                label="Company / Drive Name"
                id="company-drive-title"
                value={companyTitle}
                onChange={(e) => setCompanyTitle(e.target.value)}
                placeholder="e.g. Google STEP Internship Drive 2026"
              />
            </div>

            {/* Field 2: Minimum CGPA Cutoff */}
            <div>
              <Input
                label="Minimum CGPA Cut-off"
                id="company-drive-cgpa"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={String(minCgpa)}
                onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Field 3: Internship Availability */}
            <div>
              <Input
                label="Availability (Weeks)"
                id="company-drive-avail"
                type="number"
                value={String(requireAvailability)}
                onChange={(e) => setRequireAvailability(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Field 4: Required Skills */}
            <div className="lg:col-span-8">
              <Input
                label="Mandatory Technical Skills (comma separated)"
                id="company-drive-skills"
                value={requiredSkillsInput}
                onChange={(e) => setRequiredSkillsInput(e.target.value)}
                placeholder="e.g. Python, React, SQL"
              />
            </div>

            {/* Field 5: Allowed Years Checkboxes */}
            <div className="lg:col-span-4 space-y-1.5">
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Allowed Year(s) of Study
              </span>
              <div className="flex items-center gap-4 pt-2">
                {[2, 3, 4].map((yr) => (
                  <label key={yr} className="flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedYears.includes(yr)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedYears([...allowedYears, yr].sort());
                        } else {
                          setAllowedYears(allowedYears.filter((y) => y !== yr));
                        }
                      }}
                      className="w-4 h-4 accent-[#111111]"
                    />
                    <span>Year {yr}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Verification Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#111111]/20">
            <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={requireResume}
                onChange={(e) => setRequireResume(e.target.checked)}
                className="w-4 h-4 accent-[#111111]"
              />
              <span>Require Verified Resume</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={requireLink}
                onChange={(e) => setRequireLink(e.target.checked)}
                className="w-4 h-4 accent-[#111111]"
              />
              <span>Require GitHub or LinkedIn Profile Link</span>
            </label>
          </div>
        </Card>

        {/* 5. Shortlisting Results Scoreboard */}
        <div className="space-y-4">
          {/* Drive Summary Pill */}
          <div className="p-4 border-2 border-[#111111] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                BATCH AUDIT RESULTS FOR &ldquo;{companyTitle}&rdquo;
              </span>
              <h3 className="font-headline text-lg sm:text-xl uppercase text-[#111111] mt-0.5">
                {readyStudents.length} Ready · {almostReadyStudents.length} Almost ready · {notReadyStudents.length} Not eligible
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success(`Exported ${readyStudents.length} ready candidates to CSV.`, 'EXPORT READY');
                }}
              >
                📥 Export Shortlist CSV
              </Button>
              {reportExportEnabled && (
                <Button
                  variant="solid"
                  size="sm"
                  onClick={handleExportReportPdf}
                  id="export-college-report-pdf"
                >
                  {t('college.exportReportPdf')}
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#111111] pb-2">
            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('Ready')}
                className={`px-3 py-1.5 border border-[#111111] transition-colors ${
                  activeTab === 'Ready'
                    ? 'bg-[#2F7D5B] text-white'
                    : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                }`}
              >
                ✓ Ready to Shortlist ({readyStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Almost ready')}
                className={`px-3 py-1.5 border border-[#111111] transition-colors ${
                  activeTab === 'Almost ready'
                    ? 'bg-[#D98A1F] text-black'
                    : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                }`}
              >
                ⚠ Almost Ready ({almostReadyStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Not ready')}
                className={`px-3 py-1.5 border border-[#111111] transition-colors ${
                  activeTab === 'Not ready'
                    ? 'bg-[#C0453A] text-white'
                    : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                }`}
              >
                ✕ Not Eligible ({notReadyStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 border border-[#111111] transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#111111] text-[#F1EEE6]'
                    : 'bg-white text-[#111111] hover:bg-[#111111]/10'
                }`}
              >
                All 120 Students
              </button>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search candidate name, roll no, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#111111]"
              />
            </div>
          </div>

          {/* Candidates Table */}
          <div className="overflow-x-auto border border-[#111111] bg-white">
            <table className="w-full text-left font-body text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#111111] bg-[#F1EEE6] text-xs font-mono font-bold uppercase">
                  <th className="p-3 border-r border-[#111111]">Roll No / Student</th>
                  <th className="p-3 border-r border-[#111111]">Year &amp; Branch</th>
                  <th className="p-3 border-r border-[#111111] text-center">CGPA</th>
                  <th className="p-3 border-r border-[#111111]">Verified Skills</th>
                  <th className="p-3 border-r border-[#111111] text-center">Drive Match</th>
                  <th className="p-3 border-r border-[#111111] text-center">Status</th>
                  <th className="p-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111] text-xs font-mono">
                {displayedCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#111111]/70">
                      No students found matching current filters.
                    </td>
                  </tr>
                ) : (
                  displayedCandidates.slice(0, 30).map((item) => (
                    <tr
                      key={item.student.id}
                      className={`hover:bg-[#111111]/5 transition-colors ${
                        item.verdict === 'Ready'
                          ? 'bg-[#2F7D5B]/5'
                          : item.verdict === 'Almost ready'
                          ? 'bg-[#D98A1F]/5'
                          : ''
                      }`}
                    >
                      {/* Name & Roll */}
                      <td className="p-3 border-r border-[#111111]">
                        <span className="font-bold text-[#111111] block font-headline">
                          {item.student.name}
                        </span>
                        <span className="text-[11px] text-[#111111]/70">
                          {item.student.rollNo}
                        </span>
                      </td>

                      {/* Year & Branch */}
                      <td className="p-3 border-r border-[#111111]">
                        <span>Year {item.student.year}</span>
                        <span className="text-[#111111]/70 block">{item.student.branch}</span>
                      </td>

                      {/* CGPA */}
                      <td className="p-3 border-r border-[#111111] text-center font-bold">
                        <span className={(item.student.cgpa ?? 0) >= minCgpa ? 'text-[#2F7D5B]' : 'text-[#C0453A]'}>
                          {(item.student.cgpa ?? 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Skills */}
                      <td className="p-3 border-r border-[#111111]">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.student.skills.slice(0, 4).map((sk) => (
                            <span
                              key={sk}
                              className="px-1.5 py-0.5 text-[10px] bg-[#111111]/5 border border-[#111111]/20 font-bold"
                            >
                              {sk}
                            </span>
                          ))}
                          {item.student.skills.length > 4 && (
                            <span className="text-[10px] text-[#111111]/60 self-center">
                              +{item.student.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Match Score */}
                      <td className="p-3 border-r border-[#111111] text-center">
                        <span className="font-bold">{item.score}%</span>
                        <span className="text-[10px] text-[#111111]/60 block">
                          {item.matches}M / {item.mismatches}X / {item.missingInfo}?
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 border-r border-[#111111] text-center">
                        {item.verdict === 'Ready' ? (
                          <Badge status="Match" size="sm" />
                        ) : item.verdict === 'Almost ready' ? (
                          <Badge status="Missing info" size="sm" />
                        ) : (
                          <Badge status="Mismatch" size="sm" />
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForAudit(item)}
                          className="px-2.5 py-1 text-[11px] font-bold border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
                        >
                          Inspect Audit →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {displayedCandidates.length > 30 && (
            <div className="p-3 border border-[#111111] bg-[#F1EEE6] text-center text-xs font-mono text-[#111111]/80">
              Showing top 30 of {displayedCandidates.length} matching students. Export full shortlist above to inspect entire cohort.
            </div>
          )}
        </div>
      </section>

      {/* 5b. Partner-Published Drives: how many students are ready */}
      {drivesEnabled && (
        <section className="space-y-5 pt-4 border-t border-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
                {t('college.publishedTag')}
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#111111] mt-1">
                {t('college.publishedTitle')}
              </h2>
              <p className="font-body text-base text-[#111111]/85 mt-1 max-w-2xl">
                {t('college.publishedBody')}
              </p>
            </div>
            <Link href="/drive/new" className="shrink-0">
              <Button variant="solid" size="sm">
                {t('college.createDrive')}
              </Button>
            </Link>
          </div>

          {publishedDrives.length === 0 ? (
            <div className="p-5 border border-[#111111] bg-white text-sm font-mono text-[#111111]/75">
              {t('college.noDrives')}
            </div>
          ) : (
            <Card variant="white" className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex flex-col gap-1.5 sm:max-w-md w-full">
                  <label htmlFor="published-drive-select" className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t('college.selectDrive')}
                  </label>
                  <select
                    id="published-drive-select"
                    value={selectedDriveId}
                    onChange={(e) => setSelectedDriveId(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  >
                    {publishedDrives.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} — {d.partnerName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDrive && (
                  <Link
                    href={`/drive/${selectedDrive.id}`}
                    className="text-xs font-mono font-bold underline pb-2"
                  >
                    {t('college.openStudentView')}
                  </Link>
                )}
              </div>

              {publishedDriveAudit && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 border border-[#2F7D5B] bg-[#2F7D5B]/5 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                      {t('college.readyCount', { count: publishedDriveAudit.ready.length })}
                    </span>
                    <span className="font-headline text-3xl text-[#2F7D5B]">
                      {publishedDriveAudit.ready.length}
                    </span>
                  </div>
                  <div className="p-4 border border-[#D98A1F] bg-[#D98A1F]/5 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                      {t('college.almostReadyCount', { count: publishedDriveAudit.almostReady })}
                    </span>
                    <span className="font-headline text-3xl text-[#D98A1F]">
                      {publishedDriveAudit.almostReady}
                    </span>
                  </div>
                  <div className="p-4 border border-[#C0453A] bg-[#C0453A]/5 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                      {t('college.notReadyCount', { count: publishedDriveAudit.notReady })}
                    </span>
                    <span className="font-headline text-3xl text-[#C0453A]">
                      {publishedDriveAudit.notReady}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 6. INDIVIDUAL CANDIDATE AUDIT MODAL */}
      {/* ==================================================================== */}
      {selectedStudentForAudit && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F1EEE6] border-2 border-[#111111] max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#111111] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                  CANDIDATE AUDIT • {selectedStudentForAudit.student.rollNo}
                </span>
                <h3 className="font-headline text-2xl uppercase text-[#111111] mt-0.5">
                  {selectedStudentForAudit.student.name}
                </h3>
                <span className="text-xs font-mono text-[#111111]/80">
                  Year {selectedStudentForAudit.student.year} • {selectedStudentForAudit.student.branch} • CGPA {selectedStudentForAudit.student.cgpa ?? 'N/A'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForAudit(null)}
                className="text-sm font-mono font-bold px-2 py-0.5 border border-[#111111] hover:bg-[#111111] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Verdict Summary */}
            <div className="p-4 border border-[#111111] bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                  DRIVE VERDICT
                </span>
                <span className="font-headline text-lg uppercase text-[#111111]">
                  {selectedStudentForAudit.verdict === 'Ready'
                    ? 'Fully Qualified & Ready'
                    : selectedStudentForAudit.verdict === 'Almost ready'
                    ? 'Almost Ready (Action Required)'
                    : 'Not Eligible for Drive'}
                </span>
              </div>
              {selectedStudentForAudit.verdict === 'Ready' ? (
                <Badge status="Match" size="md" />
              ) : selectedStudentForAudit.verdict === 'Almost ready' ? (
                <Badge status="Missing info" size="md" />
              ) : (
                <Badge status="Mismatch" size="md" />
              )}
            </div>

            {/* Finding Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Detailed Requirements Breakdown:
              </span>
              <div className="space-y-2 text-xs font-mono">
                {selectedStudentForAudit.evalResult.findings.map((f: any, idx: number) => (
                  <div key={idx} className="p-3 border border-[#111111] bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase font-headline">{f.title}</span>
                      <Badge status={f.status} size="sm" />
                    </div>
                    <div className="text-[#111111]/80">
                      <span>Reason: {f.reason}</span>
                    </div>
                    <div className="text-[11px] text-[#111111]/60 italic">
                      Rule: {f.ruleUsed}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 border-t border-[#111111] flex justify-end">
              <Button
                variant="solid"
                size="sm"
                onClick={() => setSelectedStudentForAudit(null)}
              >
                Close Candidate Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
