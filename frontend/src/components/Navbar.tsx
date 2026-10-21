'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sunburst } from './Sunburst';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { onAuthChange, signOutUser } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/LanguageProvider';

interface NavItem {
  labelKey: string;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.check', href: '/check' },
  { labelKey: 'nav.profile', href: '/profile' },
  { labelKey: 'nav.discover', href: '/discover' },
  { labelKey: 'nav.tracker', href: '/tracker' },
  { labelKey: 'nav.college', href: '/college', badge: '120 BATCH' },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'nav.privacy', href: '/privacy' },
  { labelKey: 'nav.styleguide', href: '/styleguide' }
];

/**
 * Editorial Top Navigation Component
 * Features the OpportunityKit logo, sunburst motif, full keyboard accessibility,
 * the language and theme switches, and a responsive mobile menu.
 */
export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  // Reflect sign-in / sign-out anywhere in the app.
  useEffect(() => onAuthChange(setAccountEmail), []);

  const handleSignOut = async () => {
    await signOutUser();
    setAccountEmail(null);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === '/check' || href === '/') {
      return pathname === '/' || pathname === '/check';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-[#111111] bg-[#F1EEE6] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Editorial Monogram */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
          >
            <Sunburst
              size={24}
              aria-hidden="true"
              className="text-[#111111] transition-transform duration-300 group-hover:rotate-45"
            />
            <div className="flex flex-col">
              <span className="font-headline text-2xl sm:text-3xl tracking-tight uppercase leading-none group-hover:underline">
                OPPORTUNITYKIT
              </span>
              <span
                aria-hidden="true"
                className="text-[10px] font-mono uppercase tracking-widest text-[#111111]/70 leading-tight"
              >
                SETU 2026 • PS-03 ENGINE
              </span>
            </div>
            <span className="sr-only-editorial">{t('nav.brandHome')}</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label={t('nav.mainNavigation')}
          className="hidden lg:flex items-center gap-2 lg:gap-3 text-sm font-bold uppercase tracking-wider"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3.5 py-1.5 border transition-colors select-none focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 ${
                  active
                    ? 'bg-[#111111] text-[#F1EEE6] border-[#111111]'
                    : 'bg-transparent text-[#111111] border-transparent hover:border-[#111111] hover:bg-[#111111]/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Experience controls + account */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LanguageToggle />
          <ThemeToggle />
          {accountEmail ? (
            <>
              <span
                className="text-[11px] font-mono text-[#111111]/70 max-w-[130px] truncate"
                title={accountEmail}
              >
                {accountEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 border border-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 border border-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
            >
              {t('nav.signIn')}
            </Link>
          )}
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="p-2 border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111]"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          aria-label={t('nav.mobileMenu')}
          className="lg:hidden border-t border-[#111111] bg-[#F1EEE6] px-4 py-4 flex flex-col gap-2"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`px-4 py-2.5 font-headline text-lg uppercase tracking-tight border transition-colors select-none ${
                  active
                    ? 'bg-[#111111] text-[#F1EEE6] border-[#111111]'
                    : 'bg-white text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6]'
                }`}
              >
                {label}
              </Link>
            );
          })}

          {accountEmail ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 font-headline text-lg uppercase tracking-tight border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors text-left"
            >
              {t('nav.signOut')} ({accountEmail})
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2.5 font-headline text-lg uppercase tracking-tight border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
            >
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
