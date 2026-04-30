-- AI Engine Database Upgrade Script
-- Apply this to existing SSDMS deployments to prepare for local AI features.

ALTER TABLE files
ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS predicted_completion_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_summary TEXT;
