/**
 * Keyboard shortcuts, defined once so the handler and the help dialog can never
 * drift apart. Keys are single characters plus `?` for the help dialog.
 */
export type ShortcutAction =
  | 'newCheck'
  | 'openProfile'
  | 'openTracker'
  | 'focusPaste'
  | 'toggleTheme'
  | 'showHelp';

export interface ShortcutDefinition {
  id: ShortcutAction;
  /** How the key is written in the help dialog. */
  keys: string;
  /** Lower-case characters that trigger this shortcut. */
  match: string[];
  /** i18n key for the description. */
  labelKey: string;
  /** i18n key for the group heading. */
  groupKey: string;
  href?: string;
}

export const SHORTCUTS: ShortcutDefinition[] = [
  { id: 'newCheck', keys: 'N', match: ['n'], labelKey: 'shortcuts.newCheck', groupKey: 'shortcuts.groupNavigation', href: '/check' },
  { id: 'openProfile', keys: 'P', match: ['p'], labelKey: 'shortcuts.newProfile', groupKey: 'shortcuts.groupNavigation', href: '/profile' },
  { id: 'openTracker', keys: 'T', match: ['t'], labelKey: 'shortcuts.goTracker', groupKey: 'shortcuts.groupNavigation', href: '/tracker' },
  { id: 'focusPaste', keys: '/', match: ['/'], labelKey: 'shortcuts.focusPaste', groupKey: 'shortcuts.groupActions' },
  { id: 'toggleTheme', keys: 'D', match: ['d'], labelKey: 'shortcuts.toggleTheme', groupKey: 'shortcuts.groupActions' },
  { id: 'showHelp', keys: '?', match: ['?'], labelKey: 'shortcuts.showHelp', groupKey: 'shortcuts.groupHelp' }
];

/** The id the paste box must carry so `/` can focus it. */
export const PASTE_BOX_ID = 'opportunity-paste';
