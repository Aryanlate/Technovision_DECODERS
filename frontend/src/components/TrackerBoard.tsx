'use client';

import React from 'react';
import {
  TrackerItem,
  TrackerStatus,
  TRACKER_STATUSES,
  groupTrackerItemsByStatus,
  isDeadlineSoon
} from '@opportunity-kit/shared';
import { DeadlineChip } from './DeadlineChip';
import { useTranslation } from '../lib/i18n/LanguageProvider';

export interface TrackerBoardProps {
  items: TrackerItem[];
  onUpdate: (id: string, patch: Partial<TrackerItem>) => void;
  onDelete: (id: string) => void;
}

/** One column per status — a simple board view of the same items. */
export const TrackerBoard: React.FC<TrackerBoardProps> = ({ items, onUpdate, onDelete }) => {
  const { t } = useTranslation();
  const columns = groupTrackerItemsByStatus(items);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {TRACKER_STATUSES.map((status: TrackerStatus) => {
        const columnItems = columns[status];
        return (
          <div key={status} className="border border-[#111111] bg-white flex flex-col">
            <div className="px-3 py-2 border-b border-[#111111] bg-[#F1EEE6] flex items-center justify-between">
              <span className="font-headline text-xs uppercase tracking-tight">{t(`tracker.status.${status}`)}</span>
              <span className="text-[10px] font-mono font-bold border border-[#111111] bg-white px-1.5 py-0.5">
                {columnItems.length}
              </span>
            </div>

            <div className="p-2.5 space-y-2.5 flex-1 min-h-[80px]">
              {columnItems.length === 0 ? (
                <p className="text-[11px] font-mono text-[#111111]/50 px-1 py-2">{t('tracker.boardEmptyColumn')}</p>
              ) : (
                columnItems.map((item) => {
                  const soon = isDeadlineSoon(item.deadline);
                  return (
                    <div
                      key={item.id}
                      className={`border p-2.5 space-y-1.5 ${
                        soon ? 'border-[#D98A1F] bg-[#D98A1F]/10' : 'border-[#111111] bg-[#F1EEE6]'
                      }`}
                    >
                      <p className="font-bold text-[11px] leading-snug text-[#111111]">{item.title}</p>
                      <p className="text-[10px] font-mono text-[#111111]/70">{item.source || t('tracker.noSource')}</p>

                      <DeadlineChip deadline={item.deadline} />

                      <p className="text-[10px] font-mono font-bold text-[#111111]">
                        {item.readinessScore}% · {item.readinessLabel || t('tracker.notScored')}
                      </p>

                      {item.notes && (
                        <p className="text-[10px] font-mono text-[#111111]/75 leading-snug line-clamp-3">
                          {item.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 pt-1">
                        <label className="sr-only" htmlFor={`board-status-${item.id}`}>
                          {t('tracker.a11y.move', { title: item.title })}
                        </label>
                        <select
                          id={`board-status-${item.id}`}
                          value={item.status}
                          onChange={(e) =>
                            onUpdate(item.id, { status: e.target.value as TrackerStatus })
                          }
                          className="flex-1 border border-[#111111] bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase focus:outline-2 focus:outline-[#111111]"
                        >
                          {TRACKER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t(`tracker.status.${s}`)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          aria-label={t('tracker.deleteItem', { title: item.title })}
                          className="border border-[#C0453A] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#C0453A] hover:bg-[#C0453A] hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
