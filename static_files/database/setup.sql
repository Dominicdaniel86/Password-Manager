DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id          UUID PRIMARY KEY,          -- Cognito "sub" claim
    email       TEXT,                      -- optional, from id_token if needed
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,             -- e.g. "Gmail", "GitHub"
    username    TEXT,
    password    TEXT NOT NULL,             -- store encrypted in prod; plaintext is fine for a prototype
    url         TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups per user
CREATE INDEX idx_items_user_id ON items(user_id);
