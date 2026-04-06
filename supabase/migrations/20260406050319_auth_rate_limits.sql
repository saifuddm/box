CREATE TABLE IF NOT EXISTS auth_rate_limits (
  ip           text        NOT NULL,
  box_id       text        NOT NULL,
  attempts     integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip, box_id)
);

-- Used by cleanup to efficiently find and delete expired windows
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window_start
  ON auth_rate_limits (window_start);

-- Enable RLS. No policies are defined for anon or authenticated roles,
-- so they are denied by default. The service role used by edge functions
-- bypasses RLS entirely and retains full access.
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;
