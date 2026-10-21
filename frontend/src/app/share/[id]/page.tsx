'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicShareSnapshot, shareDaysRemaining } from '@opportunity-kit/shared';
import { SectionTitle } from '../../../components/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { getPublicShare } from '../../../lib/shareStore';

/**
 * Read-only, public snapshot of one result.
 *
 * Contains ONLY the opportunity, the requirement statuses, the readiness score
 * and the next steps. Profile contact details and links are stripped before the
 * snapshot is ever stored. Unknown, expired and revoked links all show the same
 * friendly message.
 */
export default function SharePage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [snapshot, setSnapshot] = useState<PublicShareSnapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await getPublicShare(id);
        if (cancelled) return;
        setSnapshot(found);
        setState(found ? 'ready' : 'missing');
      } catch (err) {
        console.warn('[Share] Could not open link:', err);
        if (!cancelled) setState('missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === 'loading') {
    return <p className="py-16 text-center text-sm font-mono text-[#111111]/70">Opening link…</p>;
  }

  if (state === 'missing' || !snapshot) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <SectionTitle tag="SHARED RESULT" title="LINK NOT AVAILABLE" align="center" />
        <p className="text-base text-[#111111]/80">
          This shared result link has expired, was revoked by its owner, or does not exist. Shared
          links stay valid for 7 days.
        </p>
        <Link href="/check">
          <Button variant="solid" size="md">
            Run your own check →
          </Button>
        </Link>
      </div>
    );
  }

  const counts = snapshot.counts ?? { matches: 0, mismatches: 0, missingInfo: 0 };
  const days = shareDaysRemaining(snapshot);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag="SHARED RESULT • READ ONLY"
          title={snapshot.opportunityTitle}
          subtitle="A read-only snapshot: the opportunity, its requirement statuses, the readiness score and the next steps. No contact details or personal links are included."
        />
      </div>

      <div className="p-3 border border-[#111111] bg-white text-[11px] font-mono text-[#111111]/75">
        Expires in {days} day{days === 1 ? '' : 's'} · snapshot created{' '}
        {new Date(snapshot.createdAt).toLocaleDateString()}
        {snapshot.sourceUrl && (
          <>
            {' · '}
            <a
              href={snapshot.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Official opportunity page ↗
            </a>
          </>
        )}
      </div>

      {/* Score */}
      <Card variant="cream" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-headline text-5xl sm:text-6xl leading-none">
              {snapshot.readinessScore}%
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#111111]/70 block">
                Readiness Score
              </span>
              <span className="font-headline text-lg uppercase tracking-tight block">
                {snapshot.readinessLabel || 'Not scored'}
              </span>
            </div>
          </div>

          <div className="text-xs font-mono font-bold uppercase">
            {counts.matches} Match · {counts.mismatches} Mismatch · {counts.missingInfo} Missing info
          </div>
        </div>
      </Card>

      {/* Statuses */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>Requirement statuses</CardTitle>
          <CardDescription>
            Statuses come from the transparent rule engine. &ldquo;Missing info&rdquo; is never
            treated as a failure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.rows.length === 0 ? (
            <p className="text-sm font-mono text-[#111111]/75">
              This snapshot was shared from the tracker, so it carries the summary statuses above
              rather than a per-requirement breakdown.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {snapshot.rows.map((row) => (
                <li
                  key={row.requirementId}
                  className="border border-[#111111] bg-[#F1EEE6] p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-sm block">{row.title}</span>
                    {row.reason && (
                      <span className="text-[11px] font-mono text-[#111111]/75">{row.reason}</span>
                    )}
                  </div>
                  <Badge status={row.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card variant="white">
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>Ordered by quickest fix first.</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.nextSteps.length === 0 ? (
            <p className="text-sm font-mono text-[#2F7D5B] font-bold">
              No outstanding steps were recorded in this snapshot.
            </p>
          ) : (
            <ol className="space-y-2 text-sm font-mono">
              {snapshot.nextSteps.map((step, index) => (
                <li key={`${index}-${step}`} className="border border-[#111111] bg-[#F1EEE6] p-3">
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/">
          <Button variant="outline" size="md">
            What is OpportunityKit? →
          </Button>
        </Link>
      </div>
    </div>
  );
}
