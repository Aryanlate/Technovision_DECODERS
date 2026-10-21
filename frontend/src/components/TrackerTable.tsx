'use client';

import React from 'react';
import { TrackerItem, TrackerStatus, TRACKER_STATUSES, isDeadlineSoon } from '@opportunity-kit/shared';
import { DeadlineChip } from './DeadlineChip';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface TrackerTableProps {
  items: TrackerItem[];
  onUpdate: (id: string, patch: Partial<TrackerItem>) => void;
  onDelete: (id: string) => void;
  onShare: (item: TrackerItem) => void;
  onExportIcs: (item: TrackerItem) => void;
  sharingId?: string | null;
}

const STATUS_SELECT_CLASS =
  'w-full border border-[#111111] bg-white px-2 py-1 text-[11px] font-mono font-bold uppercase focus:outline-2 focus:outline-offset-1 focus:outline-[#111111]';

/** Table view of the application tracker, sorted by deadline by the page. */
export const TrackerTable: React.FC<TrackerTableProps> = ({
  items,
  onUpdate,
  onDelete,
  onShare,
  onExportIcs,
  sharingId
}) => {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto border border-[#111111] bg-white">
      <table className="w-full border-collapse text-left text-xs font-mono align-top">
        <thead>
          <tr className="border-b border-[#111111] bg-[#F1EEE6] font-bold uppercase tracking-wider">
            <th className="p-3 border-r border-[#111111] min-w-[200px]">{t('tracker.table.opportunity')}</th>
            <th className="p-3 border-r border-[#111111] min-w-[130px]">{t('tracker.table.deadline')}</th>
            <th className="p-3 border-r border-[#111111] min-w-[90px]">{t('tracker.table.readiness')}</th>
            <th className="p-3 border-r border-[#111111] min-w-[140px]">{t('tracker.labelStatus')}</th>
            <th className="p-3 border-r border-[#111111] min-w-[180px]">{t('tracker.notes')}</th>
            <th className="p-3 min-w-[220px]">{t('tracker.table.actions')}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#111111]/30">
          {items.map((item) => {
            const soon = isDeadlineSoon(item.deadline);
            return (
              <tr key={item.id} className={soon ? 'bg-[#D98A1F]/[0.08]' : undefined}>
                <td className="p-3 border-r border-[#111111]/30 align-top">
                  <span className="font-bold block text-[#111111]">{item.title}</span>
                  <span className="text-[10px] text-[#111111]/70 block mt-0.5">
                    {item.source || t('tracker.noSourceRecorded')}
                  </span>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] underline text-[#111111]/80 break-all"
                    >
                      {t('tracker.officialPage')} ↗
                    </a>
                  )}
                </td>

                <td className="p-3 border-r border-[#111111]/30 align-top">
                  <DeadlineChip deadline={item.deadline} />
                  {item.deadline && (
                    <span className="text-[10px] text-[#111111]/70 block mt-1">{item.deadline}</span>
                  )}
                </td>

                <td className="p-3 border-r border-[#111111]/30 align-top">
                  <span className="font-headline text-lg leading-none block">{item.readinessScore}%</span>
                  <span className="text-[10px] text-[#111111]/70 block mt-0.5">
                    {item.readinessLabel || t('tracker.notScored')}
                  </span>
                </td>

                <td className="p-3 border-r border-[#111111]/30 align-top">
                  <label className="sr-only" htmlFor={`status-${item.id}`}>
                    {t('tracker.a11y.statusFor', { title: item.title })}
                  </label>
                  <select
                    id={`status-${item.id}`}
                    className={STATUS_SELECT_CLASS}
                    value={item.status}
                    onChange={(e) => onUpdate(item.id, { status: e.target.value as TrackerStatus })}
                  >
                    {TRACKER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`tracker.status.${status}`)}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-3 border-r border-[#111111]/30 align-top">
                  <label className="sr-only" htmlFor={`notes-${item.id}`}>
                    {t('tracker.a11y.notesFor', { title: item.title })}
                  </label>
                  <textarea
                    id={`notes-${item.id}`}
                    rows={2}
                    value={item.notes}
                    placeholder={t('tracker.addNote')}
                    onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
                    className="w-full border border-[#111111] bg-white px-2 py-1 text-[11px] font-mono resize-y focus:outline-2 focus:outline-offset-1 focus:outline-[#111111]"
                  />
                </td>

                <td className="p-3 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {item.deadline && (
                      <button
                        type="button"
                        onClick={() => onExportIcs(item)}
                        className="border border-[#111111] bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-[#F1EEE6]"
                        title={t('tracker.tip.addToCalendar')}
                      >
                        {t('tracker.addToCalendar')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onShare(item)}
                      disabled={sharingId === item.id}
                      className="border border-[#111111] bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#111111] hover:text-[#F1EEE6] disabled:opacity-50"
                      title={t('tracker.tip.shareLink')}
                    >
                      {sharingId === item.id ? t('tracker.creating') : t('tracker.shareLinkButton')}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="border border-[#C0453A] bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#C0453A] hover:bg-[#C0453A] hover:text-white"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
