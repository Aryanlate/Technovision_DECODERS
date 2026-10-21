'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DriveChecklist,
  Result,
  evaluateProfileAgainstOpportunity
} from '@opportunity-kit/shared';
import { SectionTitle } from '../../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { DeadlineChip } from '../../../components/DeadlineChip';
import { getPublicDrive } from '../../../lib/driveStore';
import { hasStoredProfile, getStoredProfile } from '../../../lib/storage';
import { useTranslation } from '../../../lib/i18n/LanguageProvider';
import { localizeRuleReason } from '../../../lib/i18n/rules';

/**
 * Public student view of a partner-published checklist (/drive/[id]).
 *
 * The checklist is read-only. "Compare with my profile" runs the same
 * deterministic rule engine used everywhere else against the student's saved
 * profile — no AI decides any status here.
 */
export default function DrivePage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { t } = useTranslation();

  const [drive, setDrive] = useState<DriveChecklist | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [hasProfile, setHasProfile] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await getPublicDrive(id);
        if (cancelled) return;
        setDrive(found);
        setState(found ? 'ready' : 'missing');
      } catch (err) {
        console.warn('[Drive] Could not open this checklist:', err);
        if (!cancelled) setState('missing');
      }
    })();
    setHasProfile(hasStoredProfile());
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCompare = () => {
    if (!drive) return;
    const profile = getStoredProfile();
    setResult(
      evaluateProfileAgainstOpportunity(
        drive.requirements,
        profile,
        drive.title,
        drive.notes || ''
      )
    );
  };

  if (state === 'loading') {
    return <p className="py-16 text-center text-sm font-mono text-[#111111]/70">{t('common.loading')}</p>;
  }

  if (state === 'missing' || !drive) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <SectionTitle tag={t('drive.studentTag')} title={t('drive.checklistHeading')} align="center" />
        <p className="text-base text-[#111111]/80">{t('drive.missing')}</p>
        <Link href="/check">
          <Button variant="solid" size="md">
            {t('drive.missingCta')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag={t('drive.studentTag')}
          title={drive.title}
          subtitle={t('drive.publishedBy', { partner: drive.partnerName })}
        />
      </div>

      {/* Meta strip */}
      <div className="p-3 border border-[#111111] bg-white flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[#111111]/80">
        <span>{t('drive.requirementCount', { count: drive.requirements.length })}</span>
        {drive.location && <span>· {drive.location}</span>}
        <span className="flex items-center gap-2">
          · <span className="font-bold uppercase">{t('drive.deadlineLabel')}</span>
          <DeadlineChip deadline={drive.deadline || null} />
        </span>
        {drive.applyUrl && (
          <a
            href={drive.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold ml-auto"
          >
            {t('drive.applyLink')} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {/* Checklist */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>{t('drive.checklistHeading')}</CardTitle>
          <CardDescription>{t('drive.readOnlyNote')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {drive.requirements.length === 0 ? (
            <p className="text-sm font-mono text-[#111111]/75">{t('drive.noRequirements')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm font-mono">
              {drive.requirements.map((r) => (
                <li key={r.id} className="border border-[#111111] bg-[#F1EEE6] p-3">
                  <span className="font-bold">{r.label}</span>
                  <span className="text-[#111111]/70"> — {r.rule}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {drive.notes && (
        <Card variant="cream" className="p-5 space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/75 block">
            {t('drive.notesLabel')}
          </span>
          <p className="font-body text-base text-[#111111]/85 whitespace-pre-line">{drive.notes}</p>
        </Card>
      )}

      {/* One-click compare */}
      {!hasProfile ? (
        <div className="p-5 border border-[#111111] bg-white space-y-3">
          <p className="font-body text-base text-[#111111]/85">{t('drive.needProfile')}</p>
          <Link href="/profile">
            <Button variant="solid" size="md">
              {t('drive.buildProfile')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <Button variant="solid" size="md" onClick={handleCompare} id="drive-compare-btn">
            {t('drive.compare')}
          </Button>

          {/* Result is added beside the checklist, never replacing it — announce it politely. */}
          {result && (
            <Card role="status" aria-live="polite" variant="cream" className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#111111]">
                <span className="font-headline text-lg uppercase tracking-tight">{t('drive.resultHeading')}</span>
                <span className="text-xs font-mono font-bold uppercase">
                  {result.counts.matches} Match · {result.counts.mismatches} Mismatch ·{' '}
                  {result.counts.missingInfo} Missing info
                </span>
              </div>

              <ul className="space-y-2">
                {result.findings.map((f) => {
                  const localized = localizeRuleReason(t, f);
                  return (
                    <li
                      key={f.requirementId}
                      className="border border-[#111111] bg-white p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-sm block">{f.title || f.requirementId}</span>
                        <span className="text-[11px] font-mono text-[#111111]/75">{localized.reason}</span>
                      </div>
                      <Badge status={f.status} size="sm" />
                    </li>
                  );
                })}
              </ul>

              {result.nextSteps.length > 0 && (
                <div className="pt-2 border-t border-[#111111]/20">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider block mb-2">
                    {t('result.nextSteps.title')}
                  </span>
                  <ol className="space-y-1.5 text-sm font-mono">
                    {result.nextSteps.map((step, index) => (
                      <li key={`${index}-${step}`} className="border border-[#111111] bg-[#F1EEE6] p-2">
                        {index + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
