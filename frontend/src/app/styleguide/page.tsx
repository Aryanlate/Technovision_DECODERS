'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  SectionTitle,
  SummaryBar,
  Input,
  Textarea,
  Tag,
  Sunburst,
  useToast,
  TableSkeleton,
  SummarySkeleton,
  FailureAlert
} from '../../components';
import { EvaluationSummary } from '@opportunity-kit/shared';

export default function StyleguidePage() {
  const { toast } = useToast();

  // Interactive state for Tag removal demo
  const [tags, setTags] = useState<string[]>([
    'HTML',
    'CSS',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python'
  ]);

  // Interactive state for Input/Textarea demo
  const [demoInput, setDemoInput] = useState('Alex Sharma');
  const [demoTextarea, setDemoTextarea] = useState(
    '2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks.'
  );

  // Interactive state for SummaryBar demo
  const [customSummary, setCustomSummary] = useState<EvaluationSummary>({
    totalRequirements: 6,
    matches: 3,
    mismatches: 1,
    missingInfo: 2,
    overallVerdict: 'Not ready to apply yet',
    headline: '3 Match, 1 Mismatch, 2 Missing info. Missing required skill: JavaScript.',
    actionPlan: [
      '[Mismatch] Technical Skills: Build or document proficiency in JavaScript before applying.',
      '[Missing info] Portfolio / GitHub Link: Add your GitHub profile or personal portfolio link to your profile.',
      '[Missing info] Availability: Confirm whether you are available for 8 weeks in your profile.'
    ]
  });

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    toast.info(`Removed skill: ${tagToRemove}`, 'TAG REMOVED');
  };

  const handleResetTags = () => {
    setTags(['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python']);
    toast.success('Restored benchmark skills', 'TAGS RESET');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Page Header */}
      <div className="border-b border-[#111111] pb-8">
        <SectionTitle
          tag="DESIGN SYSTEM SPECIFICATION"
          withMotif
          size="hero"
          title="OPPORTUNITYKIT STYLEGUIDE"
          subtitle="Editorial, minimal design system built for the SETU 2026 Hackathon (PS-03). Rooted in high-contrast Swiss editorial typography, thin 1px black borders, zero gradients, and zero drop shadows. Every status badge always shows a word, never just a color."
        />
      </div>

      {/* 2. Color Palette & Theme Tokens */}
      <section className="space-y-6">
        <SectionTitle
          tag="TOKENS • 01"
          size="default"
          title="COLOR PALETTE & THEME TOKENS"
          subtitle="Core colors specified in MASTER_CONTEXT.md. Accessible, high-contrast, editorial tones with semantic status assignments."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Cream */}
          <div className="border border-[#111111] bg-[#F1EEE6] p-4 flex flex-col justify-between h-40">
            <div>
              <span className="font-headline text-lg uppercase block">Cream</span>
              <span className="text-xs font-mono uppercase text-[#111111]/70 block">
                Primary Background
              </span>
            </div>
            <div className="font-mono text-xs font-bold border-t border-[#111111] pt-2">
              <span>#F1EEE6</span>
              <span className="block text-[11px] text-[#111111]/60">var(--color-cream)</span>
            </div>
          </div>

          {/* Ink */}
          <div className="border border-[#111111] bg-[#111111] text-[#F1EEE6] p-4 flex flex-col justify-between h-40">
            <div>
              <span className="font-headline text-lg uppercase block">Ink</span>
              <span className="text-xs font-mono uppercase text-[#F1EEE6]/70 block">
                Near-Black Text &amp; Solid
              </span>
            </div>
            <div className="font-mono text-xs font-bold border-t border-[#F1EEE6]/30 pt-2">
              <span>#111111</span>
              <span className="block text-[11px] text-[#F1EEE6]/60">var(--color-ink)</span>
            </div>
          </div>

          {/* Match Green */}
          <div className="border border-[#111111] bg-[#2F7D5B] text-white p-4 flex flex-col justify-between h-40">
            <div>
              <span className="font-headline text-lg uppercase block">Match</span>
              <span className="text-xs font-mono uppercase text-white/80 block">
                Criteria Satisfied
              </span>
            </div>
            <div className="font-mono text-xs font-bold border-t border-white/30 pt-2">
              <span>#2F7D5B</span>
              <span className="block text-[11px] text-white/70">var(--color-match)</span>
            </div>
          </div>

          {/* Mismatch Red */}
          <div className="border border-[#111111] bg-[#C0453A] text-white p-4 flex flex-col justify-between h-40">
            <div>
              <span className="font-headline text-lg uppercase block">Mismatch</span>
              <span className="text-xs font-mono uppercase text-white/80 block">
                Criteria Failed
              </span>
            </div>
            <div className="font-mono text-xs font-bold border-t border-white/30 pt-2">
              <span>#C0453A</span>
              <span className="block text-[11px] text-white/70">var(--color-mismatch)</span>
            </div>
          </div>

          {/* Missing Amber */}
          <div className="border border-[#111111] bg-[#D98A1F] text-white p-4 flex flex-col justify-between h-40">
            <div>
              <span className="font-headline text-lg uppercase block">Missing info</span>
              <span className="text-xs font-mono uppercase text-white/80 block">
                Unknown / Unanswered
              </span>
            </div>
            <div className="font-mono text-xs font-bold border-t border-white/30 pt-2">
              <span>#D98A1F</span>
              <span className="block text-[11px] text-white/70">var(--color-missing)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Typography Hierarchy */}
      <section className="space-y-6">
        <SectionTitle
          tag="TOKENS • 02"
          size="default"
          title="TYPOGRAPHY HIERARCHY"
          subtitle="Bold heavy uppercase headlines in Archivo Black; body text in Inter. Minimum body size 16px."
        />

        <div className="border border-[#111111] bg-white divide-y divide-[#111111]">
          <div className="p-6">
            <span className="text-xs font-mono font-bold text-[#111111]/60 uppercase tracking-widest block mb-2">
              Headline Display • Archivo Black
            </span>
            <h1 className="font-headline text-4xl sm:text-6xl uppercase tracking-tight text-[#111111]">
              OPPORTUNITY VERIFICATION ENGINE
            </h1>
          </div>

          <div className="p-6">
            <span className="text-xs font-mono font-bold text-[#111111]/60 uppercase tracking-widest block mb-2">
              Headline Secondary • Archivo Black
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#111111]">
              CRITERIA COMPARISON &amp; ACTION PLAN
            </h2>
          </div>

          <div className="p-6">
            <span className="text-xs font-mono font-bold text-[#111111]/60 uppercase tracking-widest block mb-2">
              Body Copy • Inter (16px base, 1.6 line-height)
            </span>
            <p className="font-body text-base text-[#111111] max-w-3xl leading-relaxed">
              AI agents gather evidence; a transparent, rule-based engine (plain TypeScript, no AI)
              makes the final decision. &ldquo;Unknown&rdquo; must never be treated as &ldquo;fails&rdquo;:
              if the profile has no answer, the status is Missing info. The result page shows a summary
              and next steps, never just yes/no.
            </p>
          </div>

          <div className="p-6">
            <span className="text-xs font-mono font-bold text-[#111111]/60 uppercase tracking-widest block mb-2">
              Monospace Technical Label • System Monospace
            </span>
            <p className="font-mono text-xs uppercase tracking-widest text-[#111111]/80">
              STATUS: MATCH • REQ-ID: REQ-YEAR • CONFIDENCE: 1.0 • DETERMINISTIC RULE
            </p>
          </div>
        </div>
      </section>

      {/* 4. Sunburst Line-Art Motif */}
      <section className="space-y-6">
        <SectionTitle
          tag="MOTIF • 03"
          size="default"
          title="SUNBURST LINE-ART MOTIF"
          subtitle="Used sparingly to accent editorial mastheads, section tags, and publication colophons."
        />

        <div className="border border-[#111111] bg-white p-6 sm:p-8 flex flex-wrap items-center justify-around gap-6 text-[#111111]">
          <div className="flex flex-col items-center gap-2">
            <Sunburst size={16} />
            <span className="text-xs font-mono">16px (Micro)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Sunburst size={24} />
            <span className="text-xs font-mono">24px (Standard)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Sunburst size={36} />
            <span className="text-xs font-mono">36px (Featured)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Sunburst size={48} className="animate-spin-slow hover:rotate-90 transition-transform duration-500" />
            <span className="text-xs font-mono">48px (Hero Emblem)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-[#111111] text-[#F1EEE6]">
              <Sunburst size={32} />
            </div>
            <span className="text-xs font-mono">Inverted Container</span>
          </div>
        </div>
      </section>

      {/* 5. Button Components */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 04"
          size="default"
          title="BUTTONS"
          subtitle="Solid black and outline variants with full keyboard accessibility and high-contrast focus rings."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Variants (Solid Black, Outline, Danger, Ghost)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="solid" onClick={() => toast.info('Solid button clicked')}>
                Solid Black
              </Button>
              <Button variant="outline" onClick={() => toast.info('Outline button clicked')}>
                Outline Editorial
              </Button>
              <Button variant="danger" onClick={() => toast.error('Danger button clicked')}>
                Danger Action
              </Button>
              <Button variant="ghost" onClick={() => toast.info('Ghost button clicked')}>
                Ghost Minimal
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#111111]/20 pt-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Size Scales (sm, md, lg)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="solid">
                Small (sm)
              </Button>
              <Button size="md" variant="solid">
                Medium (md)
              </Button>
              <Button size="lg" variant="solid">
                Large (lg)
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#111111]/20 pt-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Interactive States (Icons, Loading, Disabled)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="solid"
                iconLeft={<Sunburst size={16} />}
                onClick={() => toast.success('Action complete!')}
              >
                With Left Icon
              </Button>
              <Button
                variant="outline"
                iconRight={
                  <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                }
              >
                Next Step
              </Button>
              <Button variant="solid" loading>
                Loading State
              </Button>
              <Button variant="outline" disabled>
                Disabled Button
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Badges (Match, Mismatch, Missing info) */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 05"
          size="default"
          title="STATUS BADGES"
          subtitle="Invariant Guarantee: Every badge displays both an icon and an explicit word (never just a color), strictly adhering to the Master Context."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Core Status Badges (Match, Mismatch, Missing info)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Badge status="Match" size="md" />
              <Badge status="Mismatch" size="md" />
              <Badge status="Missing info" size="md" />
              <Badge status="Neutral" size="md" />
            </div>
          </div>

          <div className="space-y-2 border-t border-[#111111]/20 pt-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Badge Size Variants (sm, md, lg)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Badge status="Match" size="sm" />
              <Badge status="Match" size="md" />
              <Badge status="Match" size="lg" />
            </div>
          </div>

          <div className="border border-[#111111] bg-[#F1EEE6] p-4 text-xs font-mono">
            <strong>CRITICAL RULE:</strong> &ldquo;Unknown&rdquo; must NEVER be treated as &ldquo;fails&rdquo;.
            If a student has not provided a GitHub link or availability, the status is ALWAYS <code>Missing info</code>,
            never <code>Mismatch</code>.
          </div>
        </div>
      </section>

      {/* 7. Tags */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 06"
          size="default"
          title="TAGS &amp; CHIPS"
          subtitle="Lightweight metadata chips for skills, qualifications, and categories. Includes removable support."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
              Static Variants (Default, Solid, Match, Mismatch, Missing)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Tag variant="default">B.Tech CSE</Tag>
              <Tag variant="solid">2nd Year</Tag>
              <Tag variant="match">HTML &amp; CSS (Verified)</Tag>
              <Tag variant="mismatch">JavaScript (Missing)</Tag>
              <Tag variant="missing">Availability (Unknown)</Tag>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#111111]/20 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60">
                Interactive Removable Skill Tags (Click X to remove)
              </span>
              <Button size="sm" variant="outline" onClick={handleResetTags}>
                Reset Skills
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {tags.map((skill) => (
                <Tag
                  key={skill}
                  variant="default"
                  onRemove={() => handleRemoveTag(skill)}
                  removeAriaLabel={`Remove ${skill}`}
                >
                  {skill}
                </Tag>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-[#111111]/60 italic font-mono">
                  All skills removed. Click &ldquo;Reset Skills&rdquo; to restore.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Card Components */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 07"
          size="default"
          title="CARDS"
          subtitle="Thin black borders, no drop shadows, with modular Header, Title, Content, and Footer blocks."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Default Cream */}
          <Card variant="cream">
            <CardHeader>
              <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                REQUIREMENT 01
              </span>
              <CardTitle>Year of Study</CardTitle>
              <CardDescription>2nd or 3rd-year B.Tech / B.E. student</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Student profile states: <strong>2nd-year B.Tech CSE</strong>. Clear eligibility match.
              </p>
            </CardContent>
            <CardFooter>
              <Badge status="Match" size="sm" />
              <span className="text-xs font-mono text-[#111111]/70">Rule: YearMatch</span>
            </CardFooter>
          </Card>

          {/* Card 2: White Background */}
          <Card variant="white">
            <CardHeader>
              <span className="text-xs font-mono font-bold uppercase text-[#111111]/70">
                REQUIREMENT 02
              </span>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>HTML, CSS, JavaScript</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Student lists HTML, CSS, and Python. Missing required skill: <strong>JavaScript</strong>.
              </p>
            </CardContent>
            <CardFooter>
              <Badge status="Mismatch" size="sm" />
              <span className="text-xs font-mono text-[#111111]/70">Rule: SkillsMatch</span>
            </CardFooter>
          </Card>

          {/* Card 3: Inverted Black */}
          <Card variant="inverted">
            <CardHeader>
              <span className="text-xs font-mono font-bold uppercase text-[#F1EEE6]/70">
                REQUIREMENT 03
              </span>
              <CardTitle>Portfolio or GitHub</CardTitle>
              <CardDescription className="text-[#F1EEE6]/80">
                GitHub or Portfolio link required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#F1EEE6]">
                Neither provided in profile. Invariant applies: status marked as <strong>Missing info</strong>.
              </p>
            </CardContent>
            <CardFooter className="bg-[#111111] border-t border-[#F1EEE6]/30">
              <Badge status="Missing info" size="sm" />
              <span className="text-xs font-mono text-[#F1EEE6]/70">Rule: LinkPresence</span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 9. SectionTitle */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 08"
          size="default"
          title="SECTION TITLE EXAMPLES"
          subtitle="Huge uppercase headline with a small tag above and optional Sunburst motif."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-8">
          <SectionTitle
            tag="STEP 01"
            size="default"
            title="STANDARD SECTION TITLE"
            subtitle="Default size with tag and explanatory editorial subtitle."
          />

          <SectionTitle
            tag="CRITERIA MATRIX"
            withMotif
            size="huge"
            title="HUGE HEADLINE WITH MOTIF"
            subtitle="High-impact display header for major workflow milestones."
          />

          <SectionTitle
            tag="EDITORIAL ALIGNMENT"
            align="center"
            size="default"
            title="CENTER ALIGNED HEADLINE"
            subtitle="Centered section title used for callouts and summary conclusions."
          />
        </div>
      </section>

      {/* 10. Form Controls: Input & Textarea */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 09"
          size="default"
          title="INPUT &amp; TEXTAREA"
          subtitle="Editorial form controls with labels, helper copy, character count, and error states."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Student Name"
              required
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              helperText="Enter your official registered academic name."
            />

            <Input
              label="Academic Email (Error State)"
              required
              value="alex.sharma"
              error="Please enter a valid academic email address (e.g. alex@college.edu)"
              onChange={() => {}}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#111111]/20">
            <Input
              label="CGPA (Disabled State)"
              disabled
              value="8.2 / 10.0"
              helperText="Verified from university transcripts."
            />

            <Input
              label="Degree / Major"
              value="B.Tech Computer Science & Engineering"
              onChange={() => {}}
            />
          </div>

          <div className="pt-4 border-t border-[#111111]/20">
            <Textarea
              label="Opportunity Description / Requirements"
              required
              rows={4}
              value={demoTextarea}
              charCount={demoTextarea.length}
              maxCharCount={500}
              onChange={(e) => setDemoTextarea(e.target.value)}
              helperText="Paste the raw internship, scholarship, or hackathon listing."
            />
          </div>
        </div>
      </section>

      {/* 11. SummaryBar */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 10"
          size="default"
          title="SUMMARY BAR"
          subtitle="Live benchmark demonstration (3 Match, 1 Mismatch, 2 Missing info) and proportional segmented progress bar."
        />

        <div className="space-y-4">
          <SummaryBar
            opportunityTitle="Summer Engineering Intern (Benchmark PS-03)"
            summary={customSummary}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomSummary({
                  totalRequirements: 6,
                  matches: 3,
                  mismatches: 1,
                  missingInfo: 2,
                  overallVerdict: 'Not ready to apply yet',
                  headline: '3 Match, 1 Mismatch, 2 Missing info. Missing required skill: JavaScript.',
                  actionPlan: [
                    '[Mismatch] Technical Skills: Build or document proficiency in JavaScript before applying.',
                    '[Missing info] Portfolio / GitHub Link: Add your GitHub profile or personal portfolio link to your profile.',
                    '[Missing info] Availability: Confirm whether you are available for 8 weeks in your profile.'
                  ]
                });
                toast.info('Loaded benchmark sample summary', 'BENCHMARK SET');
              }}
            >
              Reset to Benchmark (3-1-2)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomSummary({
                  totalRequirements: 6,
                  matches: 6,
                  mismatches: 0,
                  missingInfo: 0,
                  overallVerdict: 'Ready to apply',
                  headline: 'All 6 requirements satisfied! You are fully qualified to apply.',
                  actionPlan: ['Profile satisfies all criteria. You are ready to submit your application.']
                });
                toast.success('Simulated 100% Match state', 'PERFECT MATCH');
              }}
            >
              Simulate 100% Match (6-0-0)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomSummary({
                  totalRequirements: 6,
                  matches: 2,
                  mismatches: 3,
                  missingInfo: 1,
                  overallVerdict: 'Not ready to apply yet',
                  headline: 'Multiple missing qualifications detected.',
                  actionPlan: [
                    '[Mismatch] Year of Study: Only 3rd or 4th-year students eligible.',
                    '[Mismatch] Skills: Missing 2 required technical competencies.',
                    '[Missing info] Resume: Upload updated resume.'
                  ]
                });
                toast.warning('Simulated high mismatch state', 'MISMATCH TEST');
              }}
            >
              Simulate High Mismatch (2-3-1)
            </Button>
          </div>
        </div>
      </section>

      {/* 12. Toast System */}
      <section className="space-y-6">
        <SectionTitle
          tag="COMPONENTS • 11"
          size="default"
          title="TOAST NOTIFICATIONS"
          subtitle="Editorial toast notification system with automatic timer, status tags, and accessible close button."
        />

        <div className="border border-[#111111] bg-white p-6 space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60 block">
            Trigger Live Interactive Toasts
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="solid"
              onClick={() =>
                toast.success('Your student profile was saved to local storage.', 'PROFILE SAVED')
              }
            >
              Trigger Success Toast
            </Button>

            <Button
              variant="danger"
              onClick={() =>
                toast.error(
                  'Missing required skill: JavaScript is needed for this role.',
                  'SKILL MISMATCH'
                )
              }
            >
              Trigger Error Toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.warning(
                  'Please confirm whether you are available for 8 weeks.',
                  'MISSING INFO'
                )
              }
            >
              Trigger Warning Toast
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                toast.info('Rule-based parser completed in 12ms (no AI used).', 'ENGINE EVENT')
              }
            >
              Trigger Info Toast
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Loading Skeletons & Failure Alerts */}
      <section className="space-y-6">
        <SectionTitle
          tag="STATES • 10"
          size="default"
          title="LOADING SKELETONS & FAILURE ALERTS"
          subtitle="Resilient error handling and zero-layout-shift skeletons for every application state."
        />

        <div className="space-y-6">
          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-2">
              Wireframe Summary Skeleton
            </span>
            <SummarySkeleton />
          </div>

          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-2">
              Wireframe Table Skeleton (3 rows)
            </span>
            <TableSkeleton rows={3} />
          </div>

          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-2">
              All 6 Failure Alert Variants
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FailureAlert
                type="empty_paste"
                actionLabel="Load Sample Listing"
                onAction={() => toast.info('Sample listing clicked', 'DEMO')}
              />
              <FailureAlert
                type="unparseable"
                actionLabel="Add Manually"
                onAction={() => toast.info('Add manually clicked', 'DEMO')}
              />
              <FailureAlert
                type="invalid_link"
                actionLabel="Fix Link Format"
                onAction={() => toast.info('Fix format clicked', 'DEMO')}
              />
              <FailureAlert
                type="missing_profile"
                actionLabel="Load Benchmark Profile"
                onAction={() => toast.info('Load profile clicked', 'DEMO')}
              />
              <FailureAlert
                type="agent_timeout"
                actionLabel="Retry With Deterministic Rules"
                onAction={() => toast.info('Offline fallback active', 'DEMO')}
              />
              <FailureAlert
                type="rate_limit"
                actionLabel="Use Cached Responses"
                onAction={() => toast.info('Cached responses loaded', 'DEMO')}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
