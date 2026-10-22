import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createEvidence, type EvidenceRecord } from '@opportunity-kit/shared';
import { MemoryEvidenceStore } from '../src/store/index.js';
import { createSyncRouter } from '../src/sync/routes.js';

const USER = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-10-22T09:30:00Z');

function tokenFor(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, email: 'student@example.com' })).toString('base64');
  return `eyJhbGciOiJub25lIn0.${payload}.x`;
}

function record(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return createEvidence({
    subjectType: 'profile',
    subjectId: 'profile-1',
    kind: 'cgpa',
    key: 'cgpa',
    value: 8.2,
    origin: 'student_confirmed',
    source: { type: 'profile_form' },
    deviceId: 'device-a',
    now: NOW,
    ...overrides
  });
}

function appWith(store: MemoryEvidenceStore, rateLimit?: (ip: string) => boolean) {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/sync',
    createSyncRouter({
      store,
      verifyToken: async (token) => {
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as { sub: string };
        return { id: payload.sub };
      },
      rateLimit
    })
  );
  return app;
}

async function listen(app: express.Express): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((done, fail) => {
            server.close((error) => (error ? fail(error) : done()));
          })
      });
    });
  });
}

describe('sync transport routes', () => {
  const closers: Array<() => Promise<void>> = [];
  afterEach(async () => {
    while (closers.length) {
      const close = closers.pop();
      if (close) await close();
    }
  });

  async function start(store = new MemoryEvidenceStore(), rateLimit?: (ip: string) => boolean) {
    const handle = await listen(appWith(store, rateLimit));
    closers.push(handle.close);
    return { store, url: handle.url };
  }

  it('rejects push and pull without a token', async () => {
    const { url } = await start();
    const push = await fetch(`${url}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [] })
    });
    const pull = await fetch(`${url}/api/sync/pull?since=0`);
    expect(push.status).toBe(401);
    expect(pull.status).toBe(401);
  });

  it('push is idempotent and returns server_seq values, conflicts and notices', async () => {
    const { url } = await start();
    const rec = record({ opId: 'op-1', evidenceId: 'ev-1' });
    const body = {
      operations: [{ opId: 'op-1', record: rec, baseVersion: 0, operation: 'add' }]
    };
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor(USER)}`
    };

    const first = await fetch(`${url}/api/sync/push`, { method: 'POST', headers, body: JSON.stringify(body) });
    const firstJson = (await first.json()) as { applied: Array<{ opId: string; serverSeq: number }>; cursor: string };
    expect(first.status).toBe(200);
    expect(firstJson.applied).toHaveLength(1);
    expect(firstJson.applied[0].serverSeq).toBe(1);

    const second = await fetch(`${url}/api/sync/push`, { method: 'POST', headers, body: JSON.stringify(body) });
    const secondJson = (await second.json()) as { applied: Array<{ opId: string; serverSeq: number }> };
    expect(second.status).toBe(200);
    expect(secondJson.applied).toHaveLength(1);
    expect(secondJson.applied[0].serverSeq).toBe(1);
  });

  it('pull pages from since cursor', async () => {
    const store = new MemoryEvidenceStore();
    const { url } = await start(store);
    const headers = { Authorization: `Bearer ${tokenFor(USER)}` };

    await store.appendVersion(USER, record({ opId: 'op-a', evidenceId: 'ev-a', key: 'a' }));
    await store.appendVersion(USER, record({ opId: 'op-b', evidenceId: 'ev-b', key: 'b' }));
    await store.appendVersion(USER, record({ opId: 'op-c', evidenceId: 'ev-c', key: 'c' }));

    const page1 = await fetch(`${url}/api/sync/pull?since=0&limit=2`, { headers });
    const json1 = (await page1.json()) as { records: EvidenceRecord[]; nextCursor: string; hasMore: boolean };
    expect(json1.records).toHaveLength(2);
    expect(json1.hasMore).toBe(true);

    const page2 = await fetch(`${url}/api/sync/pull?since=${json1.nextCursor}&limit=2`, { headers });
    const json2 = (await page2.json()) as { records: EvidenceRecord[]; hasMore: boolean };
    expect(json2.records).toHaveLength(1);
    expect(json2.hasMore).toBe(false);
    expect(json2.records[0].opId).toBe('op-c');
  });

  it('rate limits push and pull', async () => {
    const { url } = await start(new MemoryEvidenceStore(), () => false);
    const headers = { Authorization: `Bearer ${tokenFor(USER)}` };
    const push = await fetch(`${url}/api/sync/push`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [] })
    });
    const pull = await fetch(`${url}/api/sync/pull?since=0`, { headers });
    expect(push.status).toBe(429);
    expect(pull.status).toBe(429);
  });
});
