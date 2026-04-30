-- migration_ai_engine.sql
ALTER TABLE files
ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS predicted_completion_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_summary TEXT;
