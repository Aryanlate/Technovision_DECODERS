'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { currentVersion, isStale, type EvidenceRecord } from '@opportunity-kit/shared';
import { getEvidenceStore } from '../../lib/evidence/repository';
import {
  confirmEvidenceRecord,
  ensureEvidenceStore,
  evidenceBadge,
  refreshEvidenceRecord,
  resolveConflictingEvidence
} from '../../lib/evidence/bridge';
import { SectionTitle } from '../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Tag } from '../../components/Tag';
import { useTranslation } from '../../lib/i18n/LanguageProvider';

// ============================================================================
// The evidence ledger (`/evidence`).
//
// It reads straight from the local store: every fact the app knows, grouped by
// subject, with the full version timeline of each record. Nothing is edited
// here: the timeline is append-only, so this page can only ever show what
// happened and when. The only writes are the three bridge actions a record can
// offer (confirm an AI suggestion, refresh a stale fact, resolve a conflict).
// ============================================================================

/** The only writes this page can trigger, keyed like the result page actions. */
type EvidenceAction = 'confirm' | 'refresh' | 'resolve';

interface EvidenceGroup {
  evidenceId: string;
  /** Oldest version first. */
  records: EvidenceRecord[];
}

interface SubjectGroup {
  /** Group key = subjectType + subjectId. */
  key: string;
  subjectId: string;
  subjectType: string;
  groups: EvidenceGroup[];
}

/** The subject heading key for a subject type; unknown types fall back to the dictionary. */
function subjectLabelKey(subjectType: string): string {
  if (subjectType === 'profile') return 'evidence.subject.profile';
  if (subjectType === 'opportunity') return 'evidence.subject.opportunity';
  return 'evidence.subject.unknown';
}

/**
 * Groups every stored version by subject (subjectType + subjectId), then by
 * evidence id. Sorting is deterministic: subjectId, then evidenceId, then
 * version ascending.
 */
function groupBySubject(records: EvidenceRecord[]): SubjectGroup[] {
  const subjects = new Map<string, SubjectGroup>();

  for (const record of records) {
    const key = `${record.subjectType}:${record.subjectId}`;
    let subject = subjects.get(key);
    if (!subject) {
      subject = {
        key,
        subjectId: record.subjectId,
        subjectType: record.subjectType,
        groups: []
      };
      subjects.set(key, subject);
    }

    let group = subject.groups.find((candidate) => candidate.evidenceId === record.evidenceId);
    if (!group) {
      group = { evidenceId: record.evidenceId, records: [] };
      subject.groups.push(group);
    }
    group.records.push(record);
  }

  const list = [...subjects.values()];
  list.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.key.localeCompare(b.key));

  for (const subject of list) {
    subject.groups.sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));
    for (const group of subject.groups) {
      group.records.sort((a, b) => a.version - b.version);
    }
  }

  return list;
}

/** Two values are the same when their serialised content is the same. */
function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** A value as a short, readable string: strings verbatim, arrays joined, objects as JSON. */
function formatValue(value: unknown, emptyLabel: string): string {
  if (value === undefined || value === null || value === '') return emptyLabel;
  if (Array.isArray(value)) {
    if (value.length === 0) return emptyLabel;
    return value
      .map((item) => (item !== null && typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * The action the current version of a record can offer, or none when the fact
 * is already usable. A rejected / superseded / confirmed fact offers nothing.
 */
function actionFor(current: EvidenceRecord, now: Date): EvidenceAction | undefined {
  if (current.status === 'conflicted') return 'resolve';
  if (isStale(current, now)) return 'refresh';
  if (current.origin === 'ai_generated' && current.status === 'active' && !isStale(current, now)) {
    return 'confirm';
  }
  return undefined;
}

export default function EvidencePage() {
  const { t } = useTranslation();
  // `null` means "still loading": the server always renders the loading state,
  // so every formatted timestamp only ever renders after mount (hydration-safe).
  const [records, setRecords] = useState<EvidenceRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const store = getEvidenceStore();
    await ensureEvidenceStore(store);
    setRecords(await store.listAll());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void load()
      .catch((err) => {
        console.warn('[Evidence] Could not read the local evidence store:', err);
        if (!cancelled) {
          setFailed(true);
          setRecords([]);
        }
      });

    // Any new version, confirmation or refresh is reflected immediately.
    const unsubscribe = getEvidenceStore().subscribe(() => {
      void load().catch(() => undefined);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [load]);

  const runAction = async (action: EvidenceAction, evidenceId: string) => {
    setBusyId(evidenceId);
    try {
      const store = getEvidenceStore();
      if (action === 'confirm') await confirmEvidenceRecord(store, evidenceId);
      else if (action === 'refresh') await refreshEvidenceRecord(store, evidenceId);
      else await resolveConflictingEvidence(store, evidenceId);
    } catch (err) {
      console.warn('[Evidence] action failed:', err);
    } finally {
      setBusyId(null);
      void load().catch(() => undefined);
    }
  };

  const now = new Date();
  const subjects = records ? groupBySubject(records) : [];
  const isLoading = records === null;

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag={t('evidence.header.tag')}
          title={t('evidence.header.title')}
          subtitle={t('evidence.header.subtitle')}
          withMotif
        />
      </div>

      {failed ? (
        <Card variant="cream">
          <CardContent>
            <p className="text-sm font-body text-[#111111]">{t('common.error')}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card variant="cream">
          <CardContent>
            <p className="text-sm font-body text-[#111111]/70">{t('evidence.loading')}</p>
          </CardContent>
        </Card>
      ) : subjects.length === 0 ? (
        <Card variant="cream">
          <CardContent>
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm font-body text-[#111111]">{t('evidence.empty.message')}</p>
              <Link
                href="/check"
                className="text-xs font-mono font-bold uppercase tracking-wide border border-[#111111] bg-[#111111] text-[#F1EEE6] hover:bg-white hover:text-[#111111] px-3 py-1.5 transition-colors"
              >
                {t('evidence.empty.action')}
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => (
            <Card key={subject.key} variant="white">
              <CardHeader>
                <CardTitle>{t(subjectLabelKey(subject.subjectType))}</CardTitle>
                <CardDescription>
                  <span className="font-mono">{subject.subjectId}</span>
                  {' · '}
                  {t('evidence.subject.recordCount', { count: subject.groups.length })}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {subject.groups.map((group) => {
                    const current = currentVersion(group.records);
                    const action = actionFor(current, now);
                    const source = current.source;
                    const isBusy = busyId === group.evidenceId;

                    return (
                      <div key={group.evidenceId} className="border border-[#111111] bg-[#F1EEE6]">
                        {/* Record header: key, kind, standing and version count */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-[#111111] p-3">
                          <span className="font-headline text-sm uppercase tracking-tight text-[#111111]">
                            {current.key}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold text-[#111111]/60 px-1.5 py-0.5 bg-white border border-[#111111]/20">
                            {current.kind}
                          </span>
                          <Badge status={evidenceBadge(current)} size="sm" />
                          <span className="text-[10px] font-mono text-[#111111]/70">
                            {t('evidence.record.versionCount', { count: group.records.length })}
                          </span>
                          <span className="ml-auto text-[10px] font-mono text-[#111111]/50">
                            {group.evidenceId}
                          </span>
                        </div>

                        {/* Current value */}
                        <div className="p-3 border-b border-[#111111]/25">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111]/70">
                            {t('evidence.record.currentValue')}
                          </div>
                          <div className="mt-1 text-xs font-mono font-bold text-[#111111] break-words">
                            {formatValue(current.value, t('evidence.record.emptyValue'))}
                          </div>
                        </div>

                        {/* What the current fact is and where it came from */}
                        <div className="p-3 border-b border-[#111111]/25">
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] font-mono text-[#111111]/90">
                            <dt className="font-bold uppercase text-[#111111]/60">
                              {t('evidence.record.origin')}
                            </dt>
                            <dd>{current.origin.replace(/_/g, ' ')}</dd>

                            <dt className="font-bold uppercase text-[#111111]/60">
                              {t('evidence.record.trust')}
                            </dt>
                            <dd>{current.trust.replace(/_/g, ' ')}</dd>

                            <dt className="font-bold uppercase text-[#111111]/60">
                              {t('evidence.record.source')}
                            </dt>
                            <dd className="break-words">
                              {source?.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-[#111111] break-all"
                                >
                                  {source.url}
                                </a>
                              ) : source?.sentence ? (
                                <span className="italic text-[#111111]">“{source.sentence}”</span>
                              ) : source?.type ? (
                                <span>{source.type}</span>
                              ) : (
                                <span className="text-[#111111]/60">
                                  {t('evidence.record.noSource')}
                                </span>
                              )}
                            </dd>
                          </dl>

                          {/* The one action this fact can offer, if any */}
                          {action && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Button
                                variant="solid"
                                size="sm"
                                loading={isBusy}
                                onClick={() => runAction(action, group.evidenceId)}
                              >
                                {t(`result.why.actions.${action}`)}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Version timeline: what changed, when, old value and new value */}
                        <div className="p-3">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111]/70">
                            {t('evidence.record.timeline')}
                          </div>
                          <ol className="mt-2 space-y-2">
                            {group.records.map((record, index) => {
                              const previous = index > 0 ? group.records[index - 1] : undefined;
                              const valueChanged = previous ? !sameValue(previous.value, record.value) : true;
                              const isCurrent = record.version === current.version;
                              const observedDiffers = record.observedAt !== record.createdAt;

                              return (
                                <li
                                  key={`${record.evidenceId}@${record.version}`}
                                  className="border border-[#111111]/25 bg-white p-2.5"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#111111]">
                                      {t('result.why.versionLabel', { version: record.version })}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold uppercase text-[#111111]/70">
                                      {!previous
                                        ? t('evidence.record.created')
                                        : valueChanged
                                        ? t('evidence.record.changed')
                                        : t('evidence.record.unchanged')}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#111111]/70">
                                      {new Date(record.createdAt).toLocaleString()}
                                    </span>
                                    {observedDiffers && (
                                      <span className="font-mono text-[10px] text-[#111111]/50">
                                        {new Date(record.observedAt).toLocaleString()}
                                      </span>
                                    )}
                                    <Badge status={evidenceBadge(record)} size="sm" />
                                    {!isCurrent && (
                                      <Tag size="sm" variant="default">
                                        {t('evidence.record.superseded')}
                                      </Tag>
                                    )}
                                  </div>

                                  <div className="mt-1.5 text-[10px] font-mono text-[#111111]/90">
                                    {previous && !valueChanged ? (
                                      <span className="text-[#111111]/60">
                                        {t('evidence.record.unchanged')}
                                      </span>
                                    ) : (
                                      <>
                                        <span className="font-bold uppercase text-[#111111]/60">
                                          {t('evidence.record.from')}:{' '}
                                        </span>
                                        <span>
                                          {formatValue(previous?.value, t('evidence.record.emptyValue'))}
                                        </span>
                                        <span className="mx-1">→</span>
                                        <span className="font-bold uppercase text-[#111111]/60">
                                          {t('evidence.record.to')}:{' '}
                                        </span>
                                        <span className="font-bold">
                                          {formatValue(record.value, t('evidence.record.emptyValue'))}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom navigation back to the result page */}
      <div className="border-t border-[#111111] pt-6">
        <Link
          href="/result"
          className="inline-block text-xs font-mono font-bold uppercase tracking-wide border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] px-3 py-1.5 transition-colors"
        >
          {t('evidence.actions.backToResult')}
        </Link>
      </div>
    </div>
  );
}
