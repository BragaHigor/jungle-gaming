BEGIN;

CREATE TABLE IF NOT EXISTS game_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  generation uuid NOT NULL,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  balance integer NOT NULL DEFAULT 1000 CHECK (balance >= 0),
  round_count integer NOT NULL DEFAULT 0 CHECK (round_count >= 0),
  operation_count integer NOT NULL DEFAULT 0 CHECK (operation_count BETWEEN 0 AND 500),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS game_sessions_expiry ON game_sessions (expires_at);

CREATE TABLE IF NOT EXISTS game_rounds (
  session_hash text NOT NULL REFERENCES game_sessions(token_hash) ON DELETE CASCADE,
  id uuid NOT NULL,
  generation uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  sequence integer NOT NULL CHECK (sequence > 0),
  bet integer NOT NULL CHECK (bet IN (10, 25, 50)),
  symbols text[] NOT NULL CHECK (
    cardinality(symbols) = 3 AND array_position(symbols, NULL) IS NULL
    AND symbols <@ ARRAY['leaf', 'flower', 'cherry', 'gem']::text[]
  ),
  prize integer NOT NULL CHECK (prize >= 0),
  balance integer NOT NULL CHECK (balance >= 0),
  created_at timestamptz NOT NULL,
  PRIMARY KEY (session_hash, id),
  UNIQUE (session_hash, version),
  UNIQUE (session_hash, generation, sequence)
);

CREATE TABLE IF NOT EXISTS game_resets (
  session_hash text NOT NULL REFERENCES game_sessions(token_hash) ON DELETE CASCADE,
  id uuid NOT NULL,
  generation uuid NOT NULL,
  version integer NOT NULL CHECK (version >= 0),
  snapshot jsonb NOT NULL,
  PRIMARY KEY (session_hash, id)
);

COMMIT;
