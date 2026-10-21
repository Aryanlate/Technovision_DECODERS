'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../../components/Card';
import { Button } from '../../components/Button';
import {
  isSupabaseConfigured,
  signInWithPassword,
  signUpWithEmail,
  signOutUser,
  onAuthChange
} from '../../lib/supabase';

type Mode = 'signin' | 'signup';

interface Feedback {
  kind: 'ok' | 'error' | 'info';
  message: string;
}

const FEEDBACK_STYLES: Record<Feedback['kind'], string> = {
  ok: 'border-l-4 border-l-[#2F7D5B]',
  error: 'border-l-4 border-l-[#C0453A]',
  info: 'border-l-4 border-l-[#D98A1F]'
};

/**
 * Email + password sign-in.
 *
 * Signing in is optional: without it everything is stored on this device. With
 * it, the profile, tracker and share links also sync to Supabase. When Supabase
 * keys are missing the page explains that instead of failing.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => onAuthChange(setCurrentEmail), []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setFeedback({ kind: 'error', message: 'Enter both your email and a password.' });
      return;
    }

    setBusy(true);
    setFeedback(null);

    const result =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUpWithEmail(email, password);

    setBusy(false);

    if (result.ok && !result.needsConfirmation) {
      setPassword('');
      setFeedback({ kind: 'ok', message: result.message });
      router.push('/tracker');
      return;
    }

    setFeedback({
      kind: result.ok ? 'info' : 'error',
      message: result.message
    });
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOutUser();
    setBusy(false);
    setCurrentEmail(null);
    setFeedback({ kind: 'info', message: 'Signed out. Your data is still saved on this device.' });
  };

  return (
    <div className="space-y-10 pb-16 max-w-xl">
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag="ACCOUNT"
          withMotif
          size="huge"
          title="SIGN IN"
          subtitle="Signing in is optional — everything works on this device without it. Sign in to also keep your profile, tracker and share links in the cloud."
        />
      </div>

      {!isSupabaseConfigured && (
        <div className={`border border-[#111111] bg-[#F1EEE6] p-4 ${FEEDBACK_STYLES.info}`}>
          <p className="text-sm font-bold uppercase tracking-wide">Cloud sync is off</p>
          <p className="text-sm text-[#111111]/80 mt-1">
            No Supabase keys were found, so there is nothing to sign in to yet. The app keeps
            working and saves everything on this device. Add{' '}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
            <code className="font-mono text-xs">frontend/.env.local</code>, restart the dev server,
            then reload this page.
          </p>
        </div>
      )}

      {currentEmail ? (
        <Card variant="white">
          <CardHeader>
            <CardTitle>You are signed in</CardTitle>
            <CardDescription>{currentEmail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#111111]/80">
              Your profile, tracker and share links are mirrored to the cloud. You can sign in
              again from any device to pick them up. Signing out never deletes what is on this
              device.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Link href="/tracker">
              <Button variant="solid" size="sm">Go to Tracker</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut} loading={busy}>
              Sign out
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card variant="white">
          <CardHeader>
            <CardTitle>{mode === 'signin' ? 'Sign in to sync' : 'Create an account'}</CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Use the email and password you registered with.'
                : 'Choose an email and a password of at least 6 characters.'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isSupabaseConfigured || busy}
                  className="w-full border border-[#111111] bg-white px-3 py-2.5 text-base font-body focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isSupabaseConfigured || busy}
                  className="w-full border border-[#111111] bg-white px-3 py-2.5 text-base font-body focus:outline-none focus:ring-2 focus:ring-[#111111] disabled:opacity-50"
                  placeholder="••••••"
                />
              </div>

              {feedback && (
                <div className={`border border-[#111111] bg-[#F1EEE6] p-3 ${FEEDBACK_STYLES[feedback.kind]}`}>
                  <p className="text-sm text-[#111111]">{feedback.message}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                variant="solid"
                size="sm"
                loading={busy}
                disabled={!isSupabaseConfigured}
              >
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
                  setFeedback(null);
                }}
              >
                {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
