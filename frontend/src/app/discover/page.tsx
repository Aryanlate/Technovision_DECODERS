'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SectionTitle,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Tag,
  Badge,
  ScamRiskBadge,
  ScamWarningPanel,
  SaveToTrackerButton
} from '../../components';
import { discoverOpportunities } from '../../lib/api';
import { getStoredProfile } from '../../lib/storage';
import { buildTrackerDraft } from '../../lib/resultToTracker';
import {
  SAMPLE_STUDENT_PROFILE,
  checkScam,
  computeReadinessScore,
  type DiscoveryResult,
  type DiscoveryListingCard,
  type Checklist,
  type StudentProfile
} from '@opportunity-kit/shared';

const MAX_COMPARE = 3;

/** A listing's source URL uniquely identifies it, so it doubles as its key. */
function cardKey(card: DiscoveryListingCard): string {
  return card.sourceUrl || card.title;
}

/** Readiness -> Tag variant (editorial colors from the Master Context). */
function readinessVariant(readiness: DiscoveryListingCard['readiness']) {
  if (readiness === 'Ready to apply') return 'match' as const;
  if (readiness === 'Almost ready') return 'missing' as const;
  return 'mismatch' as const;
}

/** Runs the rule-based scam checker on a listing's text plus its source URL. */
function listingScam(card: DiscoveryListingCard) {
  return checkScam(card.rawText || card.fitReason || '', { sourceUrl: card.sourceUrl });
}

/**
 * Mini status count, e.g. "4 Match · 1 Mismatch · 1 Missing".
 * Never a bare colour: each count keeps its word.
 */
function StatusCounts({ counts }: { counts: DiscoveryListingCard['counts'] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-mono font-bold">
      <span className="text-[#2F7D5B]">{counts.matches} Match</span>
      <span className="text-[#111111]/40" aria-hidden="true">·</span>
      <span className="text-[#C0453A]">{counts.mismatches} Mismatch</span>
      <span className="text-[#111111]/40" aria-hidden="true">·</span>
      <span className="text-[#D98A1F]">{counts.missingInfo} Missing</span>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<StudentProfile>(SAMPLE_STUDENT_PROFILE);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [providerUsed, setProviderUsed] = useState('');
  const [compareKeys, setCompareKeys] = useState<string[]>([]);

  // Load the student's saved profile, then run discovery once.
  useEffect(() => {
    let cancelled = false;
    const stored = getStoredProfile();
    setProfile(stored);

    (async () => {
      setLoading(true);
      const res = await discoverOpportunities(stored);
      if (cancelled) return;
      setResult(res);
      setOffline(res.isOfflineFallback);
      setProviderUsed(res.providerUsed);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const listings = result?.listings ?? [];
  const skillGaps = result?.skillGaps ?? [];

  const cardsByKey = useMemo(() => {
    const map = new Map<string, DiscoveryListingCard>();
    listings.forEach((c) => map.set(cardKey(c), c));
    return map;
  }, [listings]);

  const compareCards = useMemo(
    () => compareKeys.map((k) => cardsByKey.get(k)).filter(Boolean) as DiscoveryListingCard[],
    [compareKeys, cardsByKey]
  );

  const toggleCompare = useCallback((card: DiscoveryListingCard) => {
    const key = cardKey(card);
    setCompareKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, key];
    });
  }, []);

  const handleVerify = useCallback(
    (card: DiscoveryListingCard) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'opportunitykit_selected_opportunity',
          JSON.stringify({ title: card.title, text: card.rawText || card.fitReason })
        );
      }
      router.push('/');
    },
    [router]
  );

  return (
    <div className="space-y-10 pb-16">
      <div className="border-b border-[#111111] pb-6">
        <SectionTitle
          tag="DISCOVERY AGENT"
          withMotif
          size="huge"
          title="DISCOVER OPPORTUNITIES"
          subtitle="The Discovery Agent finds real internships, scholarships and competitions for your profile. Every listing is read by the OpportunityReader, checked by the Verifier, then ranked by the rule engine on how close you are to ready."
        />
      </div>

      {/* Profile strip — what discovery was run against. */}
      <Card variant="white">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]/60">
            Your profile
          </span>
          <span><strong>{profile.year ?? '—'}</strong> year</span>
          <span>{profile.branch || 'Branch not set'}</span>
          <span>CGPA <strong>{profile.cgpa ?? '—'}</strong></span>
          <span>{(profile.skills || []).length} skills</span>
          <span>{(profile.projects || []).length} projects</span>
          {!loading && (
            <span className="ml-auto text-xs font-mono text-[#111111]/60">
              {offline ? 'Curated local list' : `Live search · ${providerUsed}`}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Skill-gap summary: "Learn this first". */}
      {!loading && skillGaps.length > 0 && (
        <div className="border border-[#111111] bg-[#111111] text-[#F1EEE6]">
          <div className="p-5 sm:p-6 border-b border-[#F1EEE6]/30">
            <h2 className="font-headline uppercase text-2xl sm:text-3xl tracking-tight">
              Learn this first
            </h2>
            <p className="text-sm text-[#F1EEE6]/80 mt-1">
              Skills missing most often across the {listings.length} opportunities checked. Add
              these to unlock the most listings.
            </p>
          </div>
          <div className="p-5 sm:p-6 flex flex-wrap gap-3">
            {skillGaps.map((gap, idx) => (
              <div
                key={gap.skill}
                className="flex items-center gap-3 border border-[#F1EEE6]/40 px-3 py-2"
              >
                <span className="font-mono text-xs text-[#F1EEE6]/60">#{idx + 1}</span>
                <span className="font-bold uppercase tracking-wide">{gap.skill}</span>
                <span className="text-xs font-mono text-[#D98A1F]">
                  missing in {gap.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compare multiple opportunities (up to 3, side by side). */}
      {compareCards.length > 0 && (
        <div className="border border-[#111111]">
          <div className="p-5 sm:p-6 border-b border-[#111111] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-headline uppercase text-xl sm:text-2xl tracking-tight">
                Compare multiple opportunities
              </h2>
              <p className="text-sm text-[#111111]/70 mt-0.5">
                {compareCards.length} of {MAX_COMPARE} selected — side by side.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCompareKeys([])}>
              Clear selection
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid gap-0 min-w-full"
              style={{ gridTemplateColumns: `repeat(${compareCards.length}, minmax(240px, 1fr))` }}
            >
              {compareCards.map((card) => (
                <div key={cardKey(card)} className="border-r last:border-r-0 border-[#111111] p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/60">
                        {card.organisation}
                      </p>
                      <h3 className="font-headline uppercase text-base leading-tight mt-1">
                        {card.title}
                      </h3>
                    </div>
                    <Badge status={card.trust} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Tag variant={readinessVariant(card.readiness)} size="sm">
                      {card.readiness}
                    </Tag>
                    <ScamRiskBadge
                      level={listingScam(card).level}
                      score={listingScam(card).score}
                    />
                  </div>

                  <StatusCounts counts={card.counts} />

                  {card.singleFix && (
                    <p className="text-sm text-[#111111]/85">
                      <span className="font-bold uppercase text-xs tracking-wide">
                        Unlocks with:{' '}
                      </span>
                      {card.singleFix}
                    </p>
                  )}

                  <ul className="space-y-2 pt-1">
                    {card.findings.map((f, i) => {
                      const req = card.requirements.find((r) => r.id === f.requirementId);
                      const label = f.title || req?.title || req?.label || `Requirement ${i + 1}`;
                      return (
                        <li key={`${f.requirementId}-${i}`} className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge status={f.status} size="sm" />
                            <span className="font-semibold">{label}</span>
                          </div>
                          <p className="text-xs text-[#111111]/70 mt-0.5">{f.reason}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="white" className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-28 bg-[#111111]/10" />
                <div className="h-5 w-40 bg-[#111111]/10 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full bg-[#111111]/10" />
                <div className="h-3 w-2/3 bg-[#111111]/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-headline uppercase text-xl sm:text-2xl tracking-tight">
              {listings.length} opportunities, ranked by closeness to ready
            </h2>
            <span className="text-xs font-mono text-[#111111]/60">
              Select up to {MAX_COMPARE} to compare
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((card) => {
              const key = cardKey(card);
              const selected = compareKeys.includes(key);
              const atLimit = compareKeys.length >= MAX_COMPARE && !selected;
              const scam = listingScam(card);
              // Same draft the /result page saves, so a discovered listing and a
              // checked listing land in the tracker in exactly the same shape.
              const draft = buildTrackerDraft({
                result: {
                  opportunityTitle: card.title,
                  rawOpportunityText: `${card.rawText || ''}\n${card.sourceUrl}`.trim()
                },
                checklist: {
                  title: card.title,
                  requirements: card.requirements,
                  sources: [card.organisation]
                } as unknown as Checklist,
                score: computeReadinessScore(card.requirements, card.findings).score,
                label: card.readiness,
                counts: card.counts,
                nextSteps: card.nextSteps
              });

              return (
                <Card key={key} variant="white" className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70">
                          {card.opportunityType}
                        </span>
                        <CardTitle className="mt-1">{card.title}</CardTitle>
                      </div>
                      <Badge status={card.trust} size="sm" />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Tag variant={readinessVariant(card.readiness)} size="sm">
                        {card.readiness}
                      </Tag>
                      <ScamRiskBadge level={scam.level} score={scam.score} />
                      {card.aiSuggestedCount > 0 && (
                        <span className="text-[11px] font-mono text-[#111111]/60">
                          {card.aiSuggestedCount} AI-suggested · confirm
                        </span>
                      )}
                    </div>

                    <CardDescription className="mt-1">
                      <a
                        href={card.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-1 underline-offset-2 hover:opacity-80 break-all"
                      >
                        {card.sourceUrl}
                      </a>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    <p className="text-sm text-[#111111]/85">{card.fitReason}</p>

                    <div className="border-t border-[#111111]/15 pt-3">
                      <StatusCounts counts={card.counts} />
                    </div>

                    {card.singleFix ? (
                      <div className="border-l-2 border-[#C0453A] pl-3">
                        <p className="text-xs font-mono font-bold uppercase tracking-wide text-[#111111]/60">
                          Fix that unlocks it
                        </p>
                        <p className="text-sm text-[#111111]/90">{card.singleFix}</p>
                      </div>
                    ) : (
                      <div className="border-l-2 border-[#2F7D5B] pl-3">
                        <p className="text-sm text-[#2F7D5B] font-semibold">
                          No blocking issues — you can apply now.
                        </p>
                      </div>
                    )}

                    {card.trustReasons.length > 0 && (
                      <ul className="text-xs text-[#111111]/60 space-y-0.5">
                        {card.trustReasons.slice(0, 2).map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    )}

                    {scam.level !== 'Low' && (
                      <ScamWarningPanel
                        text={card.rawText || card.fitReason || ''}
                        sourceUrl={card.sourceUrl}
                      />
                    )}
                  </CardContent>

                  <CardFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant={selected ? 'solid' : 'outline'}
                      onClick={() => toggleCompare(card)}
                      disabled={atLimit}
                      title={atLimit ? `You can compare up to ${MAX_COMPARE}` : 'Add to comparison'}
                    >
                      {selected ? 'Selected' : 'Compare'}
                    </Button>
                    <Button size="sm" variant="solid" onClick={() => handleVerify(card)}>
                      Verify match
                    </Button>
                    <SaveToTrackerButton draft={draft} size="sm" />
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {result && result.notes.length > 0 && (
            <ul className="text-xs font-mono text-[#111111]/60 space-y-1">
              {result.notes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
