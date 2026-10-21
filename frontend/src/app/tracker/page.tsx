'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TrackerItem,
  TrackerSortKey,
  TrackerStatus,
  TRACKER_STATUSES,
  DEADLINE_SOON_DAYS,
  filterTrackerItems,
  sortTrackerItems,
  trackerStatusCounts,
  isDeadlineSoon,
  isShareActive,
  shareDaysRemaining,
  ShareSnapshot
} from '@opportunity-kit/shared';
import { SectionTitle } from '../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { TrackerTable } from '../../components/TrackerTable';
import { TrackerBoard } from '../../components/TrackerBoard';
import {
  deleteTrackerItem,
  loadTrackerItems,
  updateTrackerItem
} from '../../lib/trackerStore';
import {
  createShareLink,
  deleteShareLink,
  loadShareLinks,
  revokeShareLink,
  shareUrl
} from '../../lib/shareStore';
import { downloadDeadlineIcs, downloadJson } from '../../lib/export';
import { getStoredProfile } from '../../lib/storage';
import { onAuthChange, isSupabaseConfigured } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n/LanguageProvider';

const CONTROL_CLASS =
  'border border-[#111111] bg-white px-2.5 py-1.5 text-xs font-mono font-bold uppercase focus:outline-2 focus:outline-offset-1 focus:outline-[#111111]';

export default function TrackerPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [shares, setShares] = useState<ShareSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'table' | 'board'>('table');
  const [sortKey, setSortKey] = useState<TrackerSortKey>('deadline');
  const [filterStatus, setFilterStatus] = useState<TrackerStatus | 'All'>('All');
  const [soonOnly, setSoonOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  // Track sign-in so we can tell the student whether this is cloud-backed.
  useEffect(() => onAuthChange(setAccountEmail), []);

  // ---- Load ---------------------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      const tracker = await loadTrackerItems();
      setItems(tracker.items);
      setNotice(tracker.notice);

      const linkResult = await loadShareLinks();
      setShares(linkResult.snapshots);
      if (linkResult.notice) setNotice(linkResult.notice);
    } catch (err) {
      console.warn('[Tracker] Load failed:', err);
      setError(t('tracker.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Derived ------------------------------------------------------------
  const visibleItems = useMemo(
    () => sortTrackerItems(filterTrackerItems(items, { status: filterStatus, soonOnly, query }), sortKey),
    [items, filterStatus, soonOnly, query, sortKey]
  );

  const counts = useMemo(() => trackerStatusCounts(items), [items]);
  const dueSoon = useMemo(() => items.filter((i) => isDeadlineSoon(i.deadline)).length, [items]);

  // ---- Item actions -------------------------------------------------------
  const handleUpdate = async (id: string, patch: Partial<TrackerItem>) => {
    // Update the screen immediately, then persist.
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    const updated = await updateTrackerItem(id, patch);
    if (!updated) {
      setError(t('tracker.errors.save'));
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const confirmed =
      typeof window !== 'undefined' &&
      window.confirm(
        t('tracker.confirmRemove', { title: item?.title ?? t('tracker.thisOpportunity') })
      );
    if (!confirmed) return;

    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteTrackerItem(id);
  };

  const handleExportIcs = (item: TrackerItem) => {
    if (!item.deadline) {
      setError(t('tracker.errors.noDeadline'));
      return;
    }
    try {
      downloadDeadlineIcs({
        title: item.title,
        deadline: item.deadline,
        description: t('tracker.icsDescription', {
          title: item.title,
          score: item.readinessScore,
          label: item.readinessLabel
        }),
        url: item.sourceUrl || undefined
      });
      setError(null);
    } catch (err) {
      console.warn('[Tracker] Calendar export failed:', err);
      setError(t('tracker.errors.ics'));
    }
  };

  const handleShare = async (item: TrackerItem) => {
    setSharingId(item.id);
    try {
      const { snapshot } = await createShareLink({
        opportunityTitle: item.title,
        sourceUrl: item.sourceUrl,
        sourceLabel: item.source,
        readinessScore: item.readinessScore,
        readinessLabel: item.readinessLabel,
        counts: item.counts,
        nextSteps: item.nextSteps
      });

      const url = shareUrl(snapshot.id);
      try {
        await navigator.clipboard.writeText(url);
        setNotice(t('tracker.notices.shareCopied'));
      } catch {
        setNotice(t('tracker.notices.shareCreated'));
      }
      setError(null);
      await refresh();
    } catch (err) {
      console.warn('[Tracker] Share failed:', err);
      setError(t('tracker.errors.share'));
    } finally {
      setSharingId(null);
    }
  };

  // ---- Share link actions -------------------------------------------------
  const handleRevoke = async (id: string) => {
    setShares((prev) => prev.map((s) => (s.id === id ? { ...s, revoked: true } : s)));
    await revokeShareLink(id);
    setNotice(t('tracker.notices.revoked'));
  };

  const handleDeleteShare = async (id: string) => {
    setShares((prev) => prev.filter((s) => s.id !== id));
    await deleteShareLink(id);
  };

  const handleCopyShare = async (id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id));
      setNotice(t('tracker.notices.copied'));
    } catch {
      setError(t('tracker.errors.copy'));
    }
  };

  // ---- Data export --------------------------------------------------------
  const handleExportData = () => {
    const profile = getStoredProfile();
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      tracker: items,
      shareLinks: shares.map((s) => ({ ...s, url: shareUrl(s.id) }))
    };

    if (items.length === 0) {
      setNotice(t('tracker.notices.emptyExport'));
    }
    downloadJson(`opportunitykit-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
  };

  // ---- Render -------------------------------------------------------------
  return (
    <div className="space-y-8 pb-16">
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <SectionTitle
          tag={t('tracker.tag')}
          title={t('tracker.title')}
          subtitle={t('tracker.lede', { days: DEADLINE_SOON_DAYS })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/check">
            <Button variant="outline" size="sm">
              {t('tracker.checkAnother')} →
            </Button>
          </Link>
          <Button variant="solid" size="sm" onClick={handleExportData}>
            {t('tracker.exportMyData')}
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 text-[#2F7D5B] text-xs font-mono font-bold flex items-center justify-between gap-3">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline shrink-0">
            {t('tracker.dismiss')}
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 border border-[#C0453A] bg-[#C0453A]/10 text-[#C0453A] text-xs font-mono font-bold flex items-center justify-between gap-3"
        >
          <span>⚠ {error}</span>
          <button type="button" onClick={() => setError(null)} className="underline shrink-0">
            {t('tracker.dismiss')}
          </button>
        </div>
      )}

      {isSupabaseConfigured && !accountEmail && (
        <div className="p-3 border border-[#111111] bg-[#F1EEE6] text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-3">
          <span className="normal-case">
            {t('tracker.localOnlyBanner')}
          </span>
          <Link href="/login" className="underline shrink-0 uppercase">
            {t('nav.signIn')} →
          </Link>
        </div>
      )}

      {loading ? (
        <p className="text-sm font-mono text-[#111111]/70">{t('tracker.loading')}</p>
      ) : items.length === 0 ? (
        /* Friendly empty state */
        <Card variant="white" className="p-8 text-center space-y-4">
          <h2 className="font-headline text-2xl uppercase tracking-tight">{t('tracker.emptyTitle')}</h2>
          <p className="text-base text-[#111111]/80 max-w-xl mx-auto">
            {t('tracker.emptyBody')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/check">
              <Button variant="solid" size="md">
                {t('tracker.checkOpportunity')} →
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline" size="md">
                {t('tracker.browseDiscover')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-[#111111] bg-white p-3 text-center">
              <span className="font-headline text-2xl block leading-none">{items.length}</span>
              <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70">
                {t('tracker.stat.saved')}
              </span>
            </div>
            <div className="border border-[#D98A1F] bg-[#D98A1F]/10 p-3 text-center">
              <span className="font-headline text-2xl block leading-none">{dueSoon}</span>
              <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70">
                {t('tracker.stat.dueSoon', { days: DEADLINE_SOON_DAYS })}
              </span>
            </div>
            <div className="border border-[#111111] bg-white p-3 text-center">
              <span className="font-headline text-2xl block leading-none">{counts.Applied}</span>
              <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70">
                {t('tracker.status.Applied')}
              </span>
            </div>
            <div className="border border-[#111111] bg-white p-3 text-center">
              <span className="font-headline text-2xl block leading-none">
                {counts.Interview + counts.Result}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70">
                {t('tracker.status.Interview')} / {t('tracker.status.Result')}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="border border-[#111111] bg-white p-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase">
                {t('tracker.labelStatus')}
                <select
                  className={CONTROL_CLASS}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TrackerStatus | 'All')}
                >
                  <option value="All">{t('tracker.all')}</option>
                  {TRACKER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`tracker.status.${s}`)} ({counts[s]})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase">
                {t('tracker.sortBy')}
                <select
                  className={CONTROL_CLASS}
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as TrackerSortKey)}
                >
                  <option value="deadline">{t('tracker.sort.deadline')}</option>
                  <option value="readiness">{t('tracker.sort.readiness')}</option>
                  <option value="title">{t('tracker.sort.title')}</option>
                  <option value="created">{t('tracker.sort.created')}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase">
                {t('tracker.search')}
                <input
                  type="search"
                  className={`${CONTROL_CLASS} normal-case min-w-[160px]`}
                  placeholder={t('tracker.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase pb-1.5">
                <input
                  type="checkbox"
                  checked={soonOnly}
                  onChange={(e) => setSoonOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#111111]"
                />
                {t('tracker.dueWithinDays', { days: DEADLINE_SOON_DAYS })}
              </label>
            </div>

            <div className="flex items-center gap-2" role="group" aria-label={t('tracker.view')}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70">
                {t('tracker.view')}
              </span>
              <button
                type="button"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase border border-[#111111] ${
                  view === 'table' ? 'bg-[#111111] text-[#F1EEE6]' : 'bg-white text-[#111111]'
                }`}
              >
                {t('tracker.viewTable')}
              </button>
              <button
                type="button"
                onClick={() => setView('board')}
                aria-pressed={view === 'board'}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase border border-[#111111] ${
                  view === 'board' ? 'bg-[#111111] text-[#F1EEE6]' : 'bg-white text-[#111111]'
                }`}
              >
                {t('tracker.viewBoard')}
              </button>
            </div>
          </div>

          {/* Items */}
          {visibleItems.length === 0 ? (
            <Card variant="white" className="p-6 text-center">
              <p className="text-sm font-mono text-[#111111]/80">
                {t('tracker.noMatches')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('All');
                  setSoonOnly(false);
                  setQuery('');
                }}
                className="mt-3 text-xs font-mono font-bold underline"
              >
                {t('tracker.clearFilters')}
              </button>
            </Card>
          ) : view === 'table' ? (
            <TrackerTable
              items={visibleItems}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onShare={handleShare}
              onExportIcs={handleExportIcs}
              sharingId={sharingId}
            />
          ) : (
            <TrackerBoard items={visibleItems} onUpdate={handleUpdate} onDelete={handleDelete} />
          )}
        </>
      )}

      {/* Share links */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>{t('tracker.shareLinksTitle')}</CardTitle>
          <CardDescription>
            {t('tracker.shareLinksDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-sm font-mono text-[#111111]/75">
              {t('tracker.noShares')}
            </p>
          ) : (
            <ul className="space-y-3">
              {shares.map((snapshot) => {
                const active = isShareActive(snapshot);
                const days = shareDaysRemaining(snapshot);
                return (
                  <li
                    key={snapshot.id}
                    className="border border-[#111111] bg-[#F1EEE6] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-sm block truncate">
                        {snapshot.opportunityTitle}
                      </span>
                      <span className="text-[10px] font-mono text-[#111111]/70 block">
                        /share/{snapshot.id}
                      </span>
                      <span className="text-[10px] font-mono text-[#111111]/70">
                        {snapshot.revoked
                          ? t('tracker.shareAction.revoked')
                          : active
                          ? days === 1
                            ? t('tracker.shareAction.expiresInOneDay')
                            : t('tracker.shareAction.expiresInDays', { days })
                          : t('tracker.shareAction.expired')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Badge
                        status={snapshot.revoked ? 'Mismatch' : active ? 'Match' : 'Missing info'}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyShare(snapshot.id)}
                        className="border border-[#111111] bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-[#F1EEE6]"
                      >
                        {t('tracker.shareAction.copy')}
                      </button>
                      {active && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(snapshot.id)}
                          className="border border-[#C0453A] bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#C0453A] hover:bg-[#C0453A] hover:text-white"
                        >
                          {t('tracker.shareAction.revoke')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteShare(snapshot.id)}
                        className="border border-[#111111] bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-[#F1EEE6]"
                      >
                        {t('common.remove')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card variant="cream">
        <CardHeader>
          <CardTitle>{t('tracker.exportTitle')}</CardTitle>
          <CardDescription>
            {t('tracker.exportDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="solid" size="md" onClick={handleExportData}>
            {t('tracker.downloadJson')}
          </Button>
          <Link href="/privacy">
            <Button variant="outline" size="md">
              {t('tracker.whatWeStore')} →
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
