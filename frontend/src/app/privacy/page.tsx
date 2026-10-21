'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SectionTitle,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  useToast
} from '../../components';
import { deleteAllUserData } from '../../lib/storage';

/** A single plain-language fact block. */
function InfoRow({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 border-b border-[#111111]/15 last:border-b-0">
      <div className="font-bold uppercase text-xs font-mono tracking-wider text-[#111111]/70 sm:pt-0.5">
        {question}
      </div>
      <div className="sm:col-span-2 text-sm sm:text-base text-[#111111]/90 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { deletedRemote, clearedKeys } = await deleteAllUserData();
      toast.success(
        `Removed your profile, tracker and share links from this device${
          deletedRemote ? ' and from your signed-in account' : ''
        } (${clearedKeys} item${clearedKeys === 1 ? '' : 's'} cleared).`
      );
      setConfirming(false);
    } catch (err) {
      console.warn('[Privacy] Delete failed:', err);
      toast.error('Something went wrong while deleting. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag="PRIVACY · PLAIN LANGUAGE"
          withMotif
          size="huge"
          title="YOUR DATA, IN PLAIN WORDS"
          subtitle="No legal jargon. This page says exactly what we keep, where it lives, for how long, who might see a sample input, and how to delete everything. You are always in control."
        />
      </div>

      <Card variant="white">
        <CardHeader>
          <CardTitle>What we store and where</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <InfoRow question="What you save">
            <p>
              Your profile (name, year, branch, CGPA, skills, documents, projects and the
              GitHub / LinkedIn / portfolio links you type in), the last checklist and match
              result, your plan and usage count, the presentation-mode setting, and a short
              list of recent clicks used only for this demo walkthrough.
            </p>
          </InfoRow>

          <InfoRow question="Where it lives">
            <p>
              First, in <strong>your own browser</strong> (localStorage on your device). Nothing
              is sent anywhere just by typing.
            </p>
            <p>
              If you are signed in, your profile is also saved to{' '}
              <strong>Supabase</strong> (a hosted Postgres database) in a row tied to your
              account, so it follows you across devices.
            </p>
          </InfoRow>

          <InfoRow question="For how long">
            <p>
              Until <strong>you</strong> delete it. Nothing expires on a timer and we do not
              keep hidden copies. The short click history is kept only for the current browser
              session and disappears when you close the tab.
            </p>
          </InfoRow>

          <InfoRow question="Which AI providers see a sample input">
            <p>
              Analysis and discovery run on <strong>free</strong> AI providers through our
              backend: <strong>Google Gemini</strong> (with Google Search grounding) is the
              main one, with <strong>Groq</strong> and <strong>OpenRouter</strong> used as
              fallbacks if a provider is busy or rate-limited.
            </p>
            <p>
              When you press a button that uses AI, only the <strong>sample input</strong> —
              the opportunity text, your pasted listing and the profile fields needed for that
              task — is sent to those providers so they can return a suggestion. Your password
              is never sent. If the providers are unavailable, the app falls back to cached
              results and the rule engine, so it keeps working offline.
            </p>
          </InfoRow>

          <InfoRow question="Links are never accessed">
            <p>
              We <strong>never open, log into, scrape or crawl</strong> your GitHub, LinkedIn,
              Instagram or portfolio links. They are stored as text for you to see and edit.
              Every fact you see in the app comes from text you paste or from the sample data —
              not from visiting your links.
            </p>
          </InfoRow>
        </CardContent>
      </Card>

      <Card variant="white">
        <CardHeader>
          <CardTitle>How we decide, and why you can trust it</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <InfoRow question="Rules decide">
            <p>
              A transparent, rule-based engine written in plain TypeScript — with no AI — makes
              the final Match / Mismatch / Missing info decision and the safety (scam) score.
              You can see the exact rules and points on every screen.
            </p>
          </InfoRow>

          <InfoRow question="AI only suggests">
            <p>
              AI agents may gather evidence and research facts, but anything they produce is
              tagged <strong>&ldquo;AI-suggested&rdquo;</strong> and needs your confirmation before it
              counts. Every researched fact shows its <strong>source link</strong> and a{' '}
              <strong>Verified / Needs review / Unverified</strong> badge. A fact with no source
              link is never counted.
            </p>
          </InfoRow>

          <InfoRow question="The safety check runs on your device">
            <p>
              The scam warning runs entirely in your browser with plain rules, so a suspicious
              listing is flagged without sending it anywhere. A normal listing is never marked
              High risk without a concrete reason.
            </p>
          </InfoRow>
        </CardContent>
      </Card>

      <Card variant="white" id="delete-my-data">
        <CardHeader>
          <CardTitle>Delete my data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm sm:text-base text-[#111111]/90 leading-relaxed">
            This removes your <strong>profile</strong>, your <strong>tracker</strong> (last
            checklist and result) and any <strong>share links</strong> — both on this device and
            from your signed-in account if you have one. It cannot be undone.
          </p>

          {confirming ? (
            <div className="border-2 border-[#C0453A] bg-[#C0453A]/5 p-4 space-y-3">
              <p className="text-sm font-bold text-[#111111]">
                Are you sure? This will permanently delete everything listed above.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  onClick={handleDelete}
                  id="confirm-delete-data-btn"
                >
                  Yes, delete everything
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              size="md"
              onClick={() => setConfirming(true)}
              id="delete-my-data-btn"
            >
              Delete my data
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-mono text-[#111111]/60">
            Prefer to keep your data? You can edit it any time.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
              Edit profile
            </Button>
            <Button variant="solid" size="sm" onClick={() => router.push('/check')}>
              Back to Check
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
