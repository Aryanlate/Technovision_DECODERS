-- Append-only server evidence store.
-- Rows are never updated or deleted: a change is a new (evidence_id, version).
-- Apply this in the Supabase SQL editor (see DEPLOY.md).

-- ---------------------------------------------------------------------------
-- evidence_versions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.evidence_versions (
  evidence_id text NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  user_id uuid NOT NULL,
  server_seq bigserial NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),

  subject_type text NOT NULL CHECK (subject_type IN ('profile', 'opportunity')),
  subject_id text NOT NULL,
  kind text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  origin text NOT NULL CHECK (origin IN (
    'student_confirmed',
    'user_provided',
    'ai_generated',
    'system_import'
  )),
  trust text NOT NULL CHECK (trust IN ('verified', 'needs_review', 'unverified')),
  source jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  observed_at timestamptz NOT NULL,
  valid_until timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'superseded', 'rejected', 'conflicted')),
  previous_version integer CHECK (previous_version IS NULL OR previous_version >= 1),
  linked_ref text,
  device_id text NOT NULL,
  op_id text NOT NULL,
  sync_state text NOT NULL CHECK (sync_state IN ('local_only', 'pending', 'synced', 'conflict')),

  PRIMARY KEY (evidence_id, version),
  UNIQUE (server_seq),
  UNIQUE (op_id)
);

CREATE INDEX IF NOT EXISTS evidence_versions_user_seq_idx
  ON public.evidence_versions (user_id, server_seq);

CREATE INDEX IF NOT EXISTS evidence_versions_user_id_idx
  ON public.evidence_versions (user_id, evidence_id);

-- ---------------------------------------------------------------------------
-- sync_ops: one row per accepted write, used for idempotent retries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sync_ops (
  op_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_ops_user_id_idx
  ON public.sync_ops (user_id);

-- ---------------------------------------------------------------------------
-- Current version per evidence_id (highest version; history rows stay stored)
-- security_invoker so RLS on evidence_versions still applies.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.evidence_current
WITH (security_invoker = true) AS
SELECT ev.*
FROM public.evidence_versions ev
INNER JOIN (
  SELECT user_id, evidence_id, MAX(version) AS version
  FROM public.evidence_versions
  GROUP BY user_id, evidence_id
) latest
  ON latest.user_id = ev.user_id
 AND latest.evidence_id = ev.evidence_id
 AND latest.version = ev.version;

-- ---------------------------------------------------------------------------
-- Row level security: each user reads and inserts only their own rows.
-- No UPDATE or DELETE policies — the store is append-only.
-- The backend service role bypasses RLS; these policies protect the anon key.
-- ---------------------------------------------------------------------------

ALTER TABLE public.evidence_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_ops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evidence_versions_select_own ON public.evidence_versions;
CREATE POLICY evidence_versions_select_own
  ON public.evidence_versions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS evidence_versions_insert_own ON public.evidence_versions;
CREATE POLICY evidence_versions_insert_own
  ON public.evidence_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sync_ops_select_own ON public.sync_ops;
CREATE POLICY sync_ops_select_own
  ON public.sync_ops
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sync_ops_insert_own ON public.sync_ops;
CREATE POLICY sync_ops_insert_own
  ON public.sync_ops
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON TABLE public.evidence_versions TO authenticated;
GRANT SELECT, INSERT ON TABLE public.sync_ops TO authenticated;
GRANT SELECT ON public.evidence_current TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.evidence_versions_server_seq_seq TO authenticated;
