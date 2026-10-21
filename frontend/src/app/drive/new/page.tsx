'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Requirement,
  RequirementKind,
  DrivePartnerType,
  validateDriveInput
} from '@opportunity-kit/shared';
import {
  SectionTitle,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
  useToast
} from '../../../components';
import { useTranslation } from '../../../lib/i18n/LanguageProvider';
import { getFeatureFlags } from '../../../lib/flags';
import { createPublishedDrive, driveUrl, DriveSource } from '../../../lib/driveStore';

/**
 * Partner checklist publisher (/drive/new).
 *
 * A company or placement cell types a structured checklist once and receives a
 * single shareable link (/drive/[id]). Only the checklist is stored — no student
 * data is attached, and the same requirements feed both the student comparison
 * and the college batch audit.
 */
export default function NewDrivePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const enabled = getFeatureFlags().ENABLE_DRIVE_PUBLISHING;

  // Partner details
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<DrivePartnerType>('company');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Structured requirements
  const [allowedYears, setAllowedYears] = useState<number[]>([3]);
  const [minCgpa, setMinCgpa] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [requireResume, setRequireResume] = useState(false);
  const [requireLink, setRequireLink] = useState(false);
  const [availability, setAvailability] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState<{ id: string; url: string; source: DriveSource } | null>(null);
  const [copied, setCopied] = useState(false);

  /** Turns the form fields into plain Requirement objects the rule engine reads. */
  const requirements: Requirement[] = useMemo(() => {
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const cgpaNum = parseFloat(minCgpa);
    const availNum = parseInt(availability, 10);

    const build = (
      id: string,
      kind: RequirementKind,
      label: string,
      value: unknown,
      category: string,
      rule: string
    ): Requirement => ({ id, kind, label, value, required: true, title: label, category: category as Requirement['category'], rule });

    const reqs: Requirement[] = [];

    if (allowedYears.length > 0) {
      reqs.push(build('drive-year', 'year', 'Year of study', allowedYears, 'education', `Year(s) ${allowedYears.join(', ')}`));
    }
    if (!isNaN(cgpaNum) && cgpaNum > 0) {
      reqs.push(build('drive-cgpa', 'cgpa', 'Minimum CGPA', cgpaNum, 'academic', `CGPA ${cgpaNum} or above`));
    }
    if (skills.length > 0) {
      reqs.push(build('drive-skills', 'skills', 'Mandatory technical skills', skills, 'skills', `Skills: ${skills.join(', ')}`));
    }
    if (requireResume) {
      reqs.push(build('drive-resume', 'document', 'Verified resume', 'resume', 'documents', 'Verified resume required'));
    }
    if (requireLink) {
      reqs.push(build('drive-link', 'link', 'GitHub or portfolio link', 'portfolioOrGithub', 'links', 'Verified GitHub or portfolio link required'));
    }
    if (!isNaN(availNum) && availNum > 0) {
      reqs.push(build('drive-availability', 'availability', 'Availability', availNum, 'availability', `Minimum ${availNum} weeks availability`));
    }

    return reqs;
  }, [allowedYears, minCgpa, skillsInput, requireResume, requireLink, availability]);

  const handlePublish = async () => {
    const found = validateDriveInput({ partnerName, title, requirements });
    setErrors(found);
    if (found.length > 0) return;

    setIsPublishing(true);
    try {
      const { drive, source } = await createPublishedDrive({
        partnerName,
        partnerType,
        title,
        location,
        deadline,
        applyUrl,
        notes,
        requirements
      });
      setPublished({ id: drive.id, url: driveUrl(drive.id), source });
      toast.success(t('drive.publishedBody'), t('drive.publishedTag'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = async () => {
    if (!published) return;
    try {
      await navigator.clipboard.writeText(published.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still visible to copy by hand.
    }
  };

  const handleReset = () => {
    setPartnerName('');
    setPartnerType('company');
    setTitle('');
    setLocation('');
    setDeadline('');
    setApplyUrl('');
    setNotes('');
    setAllowedYears([3]);
    setMinCgpa('');
    setSkillsInput('');
    setRequireResume(false);
    setRequireLink(false);
    setAvailability('');
    setErrors([]);
    setPublished(null);
  };

  if (!enabled) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <SectionTitle tag={t('drive.newTag')} title={t('drive.newTitle')} subtitle={t('drive.featureOff')} align="center" />
        <Link href="/college">
          <Button variant="solid" size="md">
            {t('drive.backToCollege')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle tag={t('drive.newTag')} withMotif title={t('drive.newTitle')} subtitle={t('drive.newSubtitle')} />
      </div>

      <div className="p-3 border border-[#111111] bg-white text-xs font-mono text-[#111111]/80">
        {t('drive.formNotice')}
      </div>

      {published ? (
        /* ---- Published state: show the shareable link ---- */
        <Card variant="cream" className="p-6 space-y-5">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#2F7D5B]">
            {t('drive.publishedTag')}
          </span>
          <p className="font-body text-base text-[#111111]/85">{t('drive.publishedBody')}</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 p-3 border border-[#111111] bg-white text-xs font-mono break-all">
              {published.url}
            </code>
            <Button variant="solid" size="md" onClick={handleCopy} className="shrink-0">
              {copied ? t('drive.copied') : t('drive.copyLink')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#111111]/20">
            <Link href={`/drive/${published.id}`} className="text-xs font-mono font-bold underline">
              {t('drive.openStudentView')}
            </Link>
            <button type="button" onClick={handleReset} className="text-xs font-mono font-bold underline">
              {t('drive.publishAnother')}
            </button>
            <Link href="/college" className="text-xs font-mono text-[#111111]/70 underline">
              {t('drive.backToCollege')}
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* ---- Partner + drive details ---- */}
          <Card variant="white" className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={t('drive.fieldPartnerName')}
                  id="drive-partner-name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={t('drive.fieldPartnerNamePlaceholder')}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="drive-partner-type" className="text-xs font-mono font-bold uppercase tracking-wider">
                  {t('drive.fieldPartnerType')}
                </label>
                <select
                  id="drive-partner-type"
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value as DrivePartnerType)}
                  className="w-full px-3.5 py-3 text-base bg-white border border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                >
                  <option value="company">{t('drive.typeCompany')}</option>
                  <option value="placement-cell">{t('drive.typePlacementCell')}</option>
                  <option value="other">{t('drive.typeOther')}</option>
                </select>
              </div>

              <Input
                label={t('drive.fieldLocation')}
                id="drive-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('drive.fieldLocationPlaceholder')}
              />

              <div className="sm:col-span-2">
                <Input
                  label={t('drive.fieldTitle')}
                  id="drive-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('drive.fieldTitlePlaceholder')}
                  required
                />
              </div>

              <Input
                label={t('drive.fieldDeadline')}
                id="drive-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <Input
                label={t('drive.fieldApplyUrl')}
                id="drive-apply-url"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                placeholder={t('drive.fieldApplyUrlPlaceholder')}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label={t('drive.fieldNotes')}
                  id="drive-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('drive.fieldNotesPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* ---- Structured checklist ---- */}
          <Card variant="white" className="p-6 space-y-5">
            <CardHeader className="p-0 border-0 pb-1">
              <CardTitle>{t('drive.reqHeading')}</CardTitle>
              <CardDescription>{t('drive.reqHint')}</CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-mono font-bold uppercase tracking-wider">{t('drive.reqYears')}</span>
                <div className="flex items-center gap-4 pt-1">
                  {[2, 3, 4].map((yr) => (
                    <label key={yr} className="flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowedYears.includes(yr)}
                        onChange={(e) =>
                          setAllowedYears((prev) =>
                            e.target.checked ? [...prev, yr].sort() : prev.filter((y) => y !== yr)
                          )
                        }
                        className="w-4 h-4 accent-[#111111]"
                      />
                      <span>Year {yr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label={t('drive.reqMinCgpa')}
                id="drive-min-cgpa"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
              />

              <div className="sm:col-span-2">
                <Input
                  label={t('drive.reqSkills')}
                  id="drive-skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder={t('drive.reqSkillsPlaceholder')}
                />
              </div>

              <Input
                label={t('drive.reqAvailability')}
                id="drive-availability"
                type="number"
                min="0"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#111111]/20">
              <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireResume}
                  onChange={(e) => setRequireResume(e.target.checked)}
                  className="w-4 h-4 accent-[#111111]"
                />
                <span>{t('drive.reqResume')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireLink}
                  onChange={(e) => setRequireLink(e.target.checked)}
                  className="w-4 h-4 accent-[#111111]"
                />
                <span>{t('drive.reqLink')}</span>
              </label>
            </div>
          </Card>

          {/* ---- Preview ---- */}
          <Card variant="cream" className="p-6 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
              {t('drive.previewHeading')}
            </span>
            {requirements.length === 0 ? (
              <p className="text-sm font-mono text-[#111111]/70">{t('drive.previewEmpty')}</p>
            ) : (
              <ul className="space-y-1.5 text-sm font-mono">
                {requirements.map((r) => (
                  <li key={r.id} className="border border-[#111111] bg-white p-2">
                    <span className="font-bold">{r.label}</span>
                    <span className="text-[#111111]/70"> — {r.rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ---- Errors + publish ---- */}
          {errors.length > 0 && (
            <div role="alert" className="p-3 border border-[#C0453A] bg-[#C0453A]/10 text-xs font-mono text-[#111111] space-y-1">
              <span className="font-bold block">{t('drive.fixErrors')}</span>
              <ul className="list-disc pl-4">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button variant="solid" size="md" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? t('drive.publishing') : t('drive.publish')}
            </Button>
            <Link href="/college" className="text-xs font-mono text-[#111111]/70 underline">
              {t('drive.backToCollege')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
