import { describe, it, expect } from 'vitest';
import {
  createTrackerItem,
  daysUntilDeadline,
  describeDeadline,
  filterTrackerItems,
  groupTrackerItemsByStatus,
  isDeadlineSoon,
  sortTrackerItems,
  trackerStatusCounts,
  DEADLINE_SOON_DAYS,
  TRACKER_STATUSES,
  TrackerItem
} from '../src/lib/tracker.js';

const NOW = new Date('2026-10-18T09:30:00Z');

function makeItem(overrides: Parameters<typeof createTrackerItem>[0]): TrackerItem {
  return createTrackerItem({ now: NOW, ...overrides });
}

describe('Application tracker (/lib/tracker)', () => {
  it('creates an item with sensible defaults and a clamped score', () => {
    const item = makeItem({
      title: '  Summer Intern  ',
      readinessScore: 140,
      source: 'Infosys careers'
    });

    expect(item.title).toBe('Summer Intern');
    expect(item.status).toBe('Interested');
    expect(item.deadline).toBeNull();
    expect(item.notes).toBe('');
    expect(item.readinessScore).toBe(100);
    expect(item.createdAt).toBe(NOW.toISOString());
    expect(item.id).toMatch(/^trk-/);
  });

  it('counts whole days to the deadline and flags anything within 7 days', () => {
    expect(DEADLINE_SOON_DAYS).toBe(7);
    expect(daysUntilDeadline('2026-10-25', NOW)).toBe(7);
    expect(isDeadlineSoon('2026-10-25', NOW)).toBe(true);
    expect(isDeadlineSoon('2026-10-26', NOW)).toBe(false);
    expect(isDeadlineSoon('2026-10-17', NOW)).toBe(false); // already past
    expect(isDeadlineSoon(null, NOW)).toBe(false);
  });

  it('describes a deadline in plain words', () => {
    expect(describeDeadline('2026-10-18', NOW)).toBe('Due today');
    expect(describeDeadline('2026-10-19', NOW)).toBe('Due tomorrow');
    expect(describeDeadline('2026-10-21', NOW)).toBe('Due in 3 days');
    expect(describeDeadline('2026-10-16', NOW)).toBe('Overdue by 2 days');
    expect(describeDeadline(null, NOW)).toBe('No deadline given');
  });

  it('sorts by deadline ascending and keeps items without a deadline last', () => {
    const items = [
      makeItem({ title: 'No date', readinessScore: 90 }),
      makeItem({ title: 'Later', deadline: '2026-11-30', readinessScore: 50 }),
      makeItem({ title: 'Sooner', deadline: '2026-10-20', readinessScore: 60 })
    ];

    expect(sortTrackerItems(items, 'deadline').map((i) => i.title)).toEqual([
      'Sooner',
      'Later',
      'No date'
    ]);
    expect(sortTrackerItems(items, 'readiness').map((i) => i.title)).toEqual([
      'No date',
      'Sooner',
      'Later'
    ]);
  });

  it('filters by status, "coming up soon" and free-text query', () => {
    const items = [
      makeItem({
        title: 'Google STEP',
        status: 'Applied',
        deadline: '2026-10-25',
        notes: 'referred',
        readinessScore: 70
      }),
      makeItem({
        title: 'Infosys Intern',
        status: 'Preparing',
        deadline: '2026-12-01',
        readinessScore: 55
      }),
      makeItem({ title: 'NSP Scholarship', status: 'Interested', deadline: null, readinessScore: 40 })
    ];

    expect(filterTrackerItems(items, { status: 'Preparing' }).map((i) => i.title)).toEqual([
      'Infosys Intern'
    ]);
    expect(filterTrackerItems(items, { status: 'All', soonOnly: true }).map((i) => i.title)).toEqual([
      'Google STEP'
    ]);
    expect(filterTrackerItems(items, { query: 'refer' }).map((i) => i.title)).toEqual(['Google STEP']);
    expect(filterTrackerItems(items, { query: 'nothing' })).toHaveLength(0);
  });

  it('groups into exactly the five board columns and counts every status', () => {
    const items = [
      makeItem({ title: 'A', status: 'Interested', deadline: '2026-11-01', readinessScore: 60 }),
      makeItem({ title: 'B', status: 'Interested', deadline: '2026-10-20', readinessScore: 80 }),
      makeItem({ title: 'C', status: 'Interview', readinessScore: 90 })
    ];

    const board = groupTrackerItemsByStatus(items);
    expect(Object.keys(board)).toEqual(TRACKER_STATUSES);
    expect(board.Interested.map((i) => i.title)).toEqual(['B', 'A']); // deadline sorted
    expect(board.Interview).toHaveLength(1);
    expect(board.Applied).toHaveLength(0);

    const counts = trackerStatusCounts(items);
    expect(counts).toEqual({
      Interested: 2,
      Preparing: 0,
      Applied: 0,
      Interview: 1,
      Result: 0
    });
  });
});
