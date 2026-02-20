-- =============================================================
-- AI Resume Analyzer – Database Initialization
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- users
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id   TEXT        UNIQUE NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  role        TEXT        NOT NULL DEFAULT 'candidate'
                          CHECK (role IN ('candidate', 'recruiter', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- resumes
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name TEXT        NOT NULL,
  s3_key        TEXT,
  file_type     TEXT        CHECK (file_type IN ('pdf', 'docx')),
  file_size     INTEGER,    -- bytes
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- analyses
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id         UUID        NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  ats_score         NUMERIC(5,2),
  quality_score     NUMERIC(5,2),
  strength          TEXT        CHECK (strength IN ('weak', 'average', 'strong', 'excellent')),
  extracted_skills  JSONB       DEFAULT '[]',
  grammar_issues    JSONB       DEFAULT '[]',
  keyword_matches   JSONB       DEFAULT '{}',
  raw_result        JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- job_descriptions (for JD matching — Phase 3)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_descriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  company     TEXT,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- jd_matches (resume ↔ JD match results — Phase 3)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jd_matches (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id           UUID        NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  jd_id               UUID        NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  similarity_score    NUMERIC(5,4),
  hiring_probability  NUMERIC(5,4),
  skill_gaps          JSONB       DEFAULT '[]',
  matched_keywords    JSONB       DEFAULT '[]',
  rank                INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resumes_user_id    ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_jd_user_id         ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_jdm_resume_id      ON jd_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_jdm_jd_id          ON jd_matches(jd_id);
