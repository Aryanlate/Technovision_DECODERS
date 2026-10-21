import { describe, it, expect } from 'vitest';
import {
  createShareSnapshot,
  toPublicShareSnapshot,
  redactContactAndLinks,
  containsContactOrLink,
  isShareExpired,
  isShareActive,
  shareDaysRemaining,
  shareExpiresAt,
  SHARE_TTL_DAYS,
  ShareSnapshot
} from '../src/lib/share.js';

const NOW = new Date('2026-10-18T09:30:00Z');

function build(overrides: Partial<Parameters<typeof createShareSnapshot>[0]> = {}): ShareSnapshot {
  return createShareSnapshot({
    now: NOW,
    id: 's-test',
    ownerId: 'user-123',
    opportunityTitle: 'Summer Intern',
    readinessScore: 67,
    ...overrides
  });
}

describe('Shareable result snapshot (/lib/share)', () => {
  it('keeps a status row but never the student value', () => {
    const snapshot = build({
      findings: [
        {
          requirementId: 'req-skills',
          title: 'Skills',
          status: 'Mismatch',
          reason: 'JavaScript is missing.'
        }
      ]
    });

    expect(snapshot.rows).toEqual([
      {
        requirementId: 'req-skills',
        title: 'Skills',
        status: 'Mismatch',
        reason: 'JavaScript is missing.'
      }
    ]);
    // No `studentValue` field survives into the snapshot.
    expect(Object.keys(snapshot.rows[0])).not.toContain('studentValue');
  });

  it('redacts emails, phone numbers and links from every text field', () => {
    const snapshot = build({
      opportunityTitle: 'Intern at https://careers.example.com',
      sourceLabel: 'Contact hr@example.com or 9876543210',
      nextSteps: ['Email me@school.edu', 'See www.example.org/apply'],
      findings: [
        {
          requirementId: 'r',
          title: 'Portfolio link http://github.com/me',
          status: 'Mismatch',
          reason: 'Call 9123456789 or mail me@x.com'
        }
      ]
    });

    expect(snapshot.opportunityTitle).toBe('Intern at [link removed]');
    expect(snapshot.sourceLabel).toBe('Contact [email removed] or [number removed]');
    expect(snapshot.nextSteps).toEqual(['Email [email removed]', 'See [link removed]']);
    expect(snapshot.rows[0].title).toBe('Portfolio link [link removed]');
    expect(snapshot.rows[0].reason).toBe('Call [number removed] or mail [email removed]');

    // Nothing anywhere in the snapshot still looks like contact info or a link.
    const flat = JSON.stringify(snapshot);
    expect(containsContactOrLink(flat)).toBe(false);
  });

  it('redacts a bare 10+ digit run and detects leaks', () => {
    expect(redactContactAndLinks('account 1234567890')).toBe('account [number removed]');
    expect(containsContactOrLink('plain text')).toBe(false);
    expect(containsContactOrLink('a@b.com')).toBe(true);
    expect(containsContactOrLink('https://x.io')).toBe(true);
  });

  it('expires after exactly 7 days and reports days remaining', () => {
    const snapshot = build();
    expect(SHARE_TTL_DAYS).toBe(7);
    expect(snapshot.expiresAt).toBe(shareExpiresAt(NOW));

    // One minute before expiry: still active, 1 day remaining.
    const almost = new Date(Date.parse(snapshot.expiresAt) - 60_000);
    expect(isShareExpired(snapshot, almost)).toBe(false);
    expect(isShareActive(snapshot, almost)).toBe(true);
    expect(shareDaysRemaining(snapshot, almost)).toBe(1);

    // At/after expiry: expired and inactive, 0 days remaining.
    const after = new Date(Date.parse(snapshot.expiresAt) + 1);
    expect(isShareExpired(snapshot, after)).toBe(true);
    expect(isShareActive(snapshot, after)).toBe(false);
    expect(shareDaysRemaining(snapshot, after)).toBe(0);
  });

  it('treats a revoked snapshot as inactive even before it expires', () => {
    const snapshot = { ...build(), revoked: true };
    expect(isShareExpired(snapshot, NOW)).toBe(false);
    expect(isShareActive(snapshot, NOW)).toBe(false);
  });

  it('strips the owner id for the public snapshot', () => {
    const snapshot = build();
    const publicView = toPublicShareSnapshot(snapshot);

    expect(Object.keys(publicView)).not.toContain('ownerId');
    expect(publicView.id).toBe('s-test');
    expect(publicView.readinessScore).toBe(67);
  });

  it('clamps an out-of-range readiness score', () => {
    expect(build({ readinessScore: 240 }).readinessScore).toBe(100);
    expect(build({ readinessScore: -30 }).readinessScore).toBe(0);
  });
});
