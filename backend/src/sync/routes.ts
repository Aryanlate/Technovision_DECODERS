import { Router, type Request, type Response } from 'express';
import {
  EvidenceRecordSchema,
  type SyncOperationKind,
  type SyncOutboxOp
} from '@opportunity-kit/shared';
import { z } from 'zod';
import type { ServerEvidenceStore } from '../store/types.js';
import { applyPush } from './applyPush.js';
import { readBearerToken, verifySupabaseToken, type SyncUser } from './auth.js';

const DEFAULT_PULL_LIMIT = 100;
const MAX_PULL_LIMIT = 500;
const MAX_PUSH_OPS = 200;

const PushOpSchema = z.object({
  opId: z.string().min(1),
  operation: z.enum(['add', 'revise', 'confirm', 'reject', 'delete']).optional(),
  evidenceId: z.string().optional(),
  record: EvidenceRecordSchema,
  baseVersion: z.number().int().nonnegative(),
  createdAt: z.string().optional()
});

const PushBodySchema = z.object({
  operations: z.array(PushOpSchema).max(MAX_PUSH_OPS)
});

export interface SyncRouterOptions {
  store: ServerEvidenceStore;
  verifyToken?: (token: string) => Promise<SyncUser | null>;
  rateLimit?: (ip: string) => boolean;
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function toOutboxOp(raw: z.infer<typeof PushOpSchema>): SyncOutboxOp {
  const record = { ...raw.record, opId: raw.opId };
  const operation: SyncOperationKind =
    raw.operation ?? (record.status === 'rejected' ? 'reject' : record.version === 1 ? 'add' : 'revise');
  return {
    opId: raw.opId,
    operation,
    evidenceId: raw.evidenceId ?? record.evidenceId,
    record,
    baseVersion: raw.baseVersion,
    createdAt: raw.createdAt ?? record.createdAt
  };
}

async function requireUser(
  req: Request,
  res: Response,
  verifyToken: (token: string) => Promise<SyncUser | null>
): Promise<SyncUser | null> {
  const token = readBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({
      error: 'Sign in to sync.',
      message: 'A Supabase access token is required.'
    });
    return null;
  }
  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({
      error: 'Sign in to sync.',
      message: 'The access token is not valid.'
    });
    return null;
  }
  return user;
}

/**
 * POST /push and GET /pull. Both are idempotent: a replayed opId returns the
 * stored server_seq, and pull is a pure read from the cursor.
 */
export function createSyncRouter(options: SyncRouterOptions): Router {
  const verifyToken = options.verifyToken ?? verifySupabaseToken;
  const rateLimit = options.rateLimit ?? (() => true);
  const { store } = options;
  const router = Router();

  router.use((req, res, next) => {
    if (!rateLimit(clientIp(req))) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Sync rate limit exceeded. Please try again shortly.'
      });
    }
    next();
  });

  router.post('/push', async (req, res) => {
    try {
      const user = await requireUser(req, res, verifyToken);
      if (!user) return;

      const parsed = PushBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid sync payload.',
          message: 'Each operation needs opId, record, version and baseVersion.'
        });
      }

      const operations = parsed.data.operations.map(toOutboxOp);
      const result = await applyPush(store, user.id, operations);
      return res.json(result);
    } catch (error) {
      console.error('[API /api/sync/push] Error:', error);
      return res.status(500).json({
        error: 'Sync push failed.',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/pull', async (req, res) => {
    try {
      const user = await requireUser(req, res, verifyToken);
      if (!user) return;

      const since = typeof req.query.since === 'string' ? req.query.since : '0';
      const requested = Number.parseInt(String(req.query.limit ?? DEFAULT_PULL_LIMIT), 10);
      const limit = Number.isFinite(requested)
        ? Math.min(MAX_PULL_LIMIT, Math.max(1, requested))
        : DEFAULT_PULL_LIMIT;

      const page = await store.getSince(user.id, since, { limit });
      return res.json({
        records: page.records,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore
      });
    } catch (error) {
      console.error('[API /api/sync/pull] Error:', error);
      return res.status(500).json({
        error: 'Sync pull failed.',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
