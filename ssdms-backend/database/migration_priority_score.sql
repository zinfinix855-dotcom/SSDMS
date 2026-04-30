-- Migration to add priority_score column for AI prioritization
ALTER TABLE files ADD COLUMN priority_score INT DEFAULT 0;
CREATE INDEX idx_priority_score ON files(priority_score);

-- Update existing records with a baseline score
UPDATE files SET priority_score = 50 WHERE status = 'In Progress';
