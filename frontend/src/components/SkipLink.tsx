'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/LanguageProvider';

/**
 * Keyboard-only "skip to main content" link. Visible only when focused.
 */
export const SkipLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <a href="#main-content" className="skip-link">
      {t('a11y.skipToContent')}
    </a>
  );
};
