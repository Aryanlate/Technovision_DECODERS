'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHORTCUTS, PASTE_BOX_ID, ShortcutAction } from '../lib/shortcuts';
import { useTranslation } from '../lib/i18n/LanguageProvider';
import { useTheme } from '../lib/ThemeProvider';

/** Event used by any button that wants to open the shortcuts help dialog. */
export const SHOW_SHORTCUTS_EVENT = 'opportunitykit_show_shortcuts';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}

/** Groups the shortcut definitions for the help dialog. */
function useGroupedShortcuts() {
  const { t } = useTranslation();
  const groups: { heading: string; items: { keys: string; label: string }[] }[] = [];

  for (const shortcut of SHORTCUTS) {
    const heading = t(shortcut.groupKey);
    let group = groups.find((g) => g.heading === heading);
    if (!group) {
      group = { heading, items: [] };
      groups.push(group);
    }
    group.items.push({ keys: shortcut.keys, label: t(shortcut.labelKey) });
  }

  return groups;
}

/**
 * Global keyboard shortcuts plus the accessible help dialog that documents them.
 * Shortcuts are disabled while the user is typing in a field.
 */
export const KeyboardShortcuts: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { toggle } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const openDialog = useCallback(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    lastFocused.current?.focus?.();
  }, []);

  // `?` and the footer button both open the help dialog.
  useEffect(() => {
    const onShow = () => openDialog();
    window.addEventListener(SHOW_SHORTCUTS_EVENT, onShow);
    return () => window.removeEventListener(SHOW_SHORTCUTS_EVENT, onShow);
  }, [openDialog]);

  useEffect(() => {
    if (dialogOpen) {
      // Move focus into the dialog so keyboard and screen-reader users land there.
      closeButtonRef.current?.focus();
    }
  }, [dialogOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Escape' && dialogOpen) {
        closeDialog();
        return;
      }

      if (dialogOpen || isTypingTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const shortcut = SHORTCUTS.find((s) => s.match.includes(key));
      if (!shortcut) return;

      const run = (action: ShortcutAction) => {
        switch (action) {
          case 'newCheck':
            router.push('/check');
            return;
          case 'openProfile':
            router.push('/profile');
            return;
          case 'openTracker':
            router.push('/tracker');
            return;
          case 'toggleTheme':
            toggle();
            return;
          case 'showHelp':
            openDialog();
            return;
          case 'focusPaste': {
            const box = document.getElementById(PASTE_BOX_ID);
            if (box) {
              (box as HTMLElement).focus();
              (box as HTMLTextAreaElement).select?.();
            } else {
              // No paste box on this page: take the user to the check page.
              router.push('/check');
            }
            return;
          }
        }
      };

      event.preventDefault();
      run(shortcut.id);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dialogOpen, closeDialog, openDialog, router, toggle]);

  const groups = useGroupedShortcuts();

  if (!dialogOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 no-print"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-lg bg-[#F1EEE6] text-[#111111] border border-[#111111] p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#111111] pb-3">
          <h2 id="shortcuts-title" className="font-headline text-xl uppercase tracking-tight">
            {t('shortcuts.title')}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDialog}
            aria-label={t('shortcuts.close')}
            className="px-2 py-1 border border-[#111111] text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6]"
          >
            {t('common.close')}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.heading} aria-label={group.heading}>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#111111]/60">
                {group.heading}
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-4">
                    <span className="font-body text-base">{item.label}</span>
                    <kbd className="shrink-0 font-mono text-xs font-bold border border-[#111111] px-2 py-0.5 bg-white">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
