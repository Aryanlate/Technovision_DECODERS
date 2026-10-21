import type { Metadata } from 'next';
import './globals.css';
import { KeepAlivePing } from '../components/KeepAlivePing';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ToastProvider } from '../components/Toast';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { OnboardingTour } from '../components/OnboardingTour';
import { SkipLink } from '../components/SkipLink';
import { ThemeProvider } from '../lib/ThemeProvider';
import { LanguageProvider } from '../lib/i18n/LanguageProvider';
import { THEME_INIT_SCRIPT } from '../lib/theme';

export const metadata: Metadata = {
  title: 'OpportunityKit | PS-03 Checklist & Verification Engine',
  description:
    'Transparent, rule-based student opportunity eligibility checklist engine for SETU 2026.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` is needed because the boot script sets the
    // theme class and language on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the remembered / system theme before paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#F1EEE6] text-[#111111] font-body selection:bg-[#111111] selection:text-[#F1EEE6] flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              {/* Keyboard-only escape hatch to the page content. */}
              <SkipLink />

              <KeepAlivePing />
              {/* Top Nav App Shell */}
              <Navbar />

              {/* Main Content Area */}
              <main id="main-content" tabIndex={-1} className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
                {children}
              </main>

              {/* Editorial Minimal Footer */}
              <Footer />

              {/* Global keyboard shortcuts + the help dialog */}
              <KeyboardShortcuts />
              {/* Skippable 3-step first-visit guide */}
              <OnboardingTour />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
