-- SSDMS Migration Script: V2 SLA and Audit Improvements (Simplified)
-- This script fixes missing columns and tables identified in the audit.

USE ssdms;

-- 1. Create workflow_sla_rules table
CREATE TABLE IF NOT EXISTS workflow_sla_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stage_name ENUM(
        'Admission', 'Discharge', 'Pre-Approval', 'Approval', 
        'File Verification', 'E-Claim', 'E-Claim Verification', 
        'Finance', 'Segregation', 'Indexation'
    ) NOT NULL UNIQUE,
    max_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Insert default SLA rules (Example durations)
INSERT IGNORE INTO workflow_sla_rules (stage_name, max_hours) VALUES
('Admission', 2),
('Discharge', 4),
('Pre-Approval', 24),
('Approval', 48),
('File Verification', 12),
('E-Claim', 6),
('E-Claim Verification', 24),
('Finance', 48),
('Segregation', 4),
('Indexation', 2);

-- 2. Add missing columns to files table
-- Removed IF NOT EXISTS for compatibility with older MySQL versions
ALTER TABLE files 
ADD COLUMN last_sla_status VARCHAR(50) DEFAULT 'Normal' AFTER status,
ADD COLUMN sla_violation_hours INT DEFAULT 0 AFTER last_sla_status;

-- 3. Add created_at to file_movements for consistent audit trail
ALTER TABLE file_movements
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER action_date;

-- 4. Ensure created_at exists in files (some versions might miss it)
-- Note: if it already exists, this might fail, but we'll handle it if it does
-- Actually, the log said 'Unknown column created_at', so we definitely need it.
-- If it exists, this MODIFY will just ensure the type is correct.
ALTER TABLE files
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 5. Add indexes for performance optimization
CREATE INDEX idx_files_created_at ON files (created_at);
CREATE INDEX idx_movements_created_at ON file_movements (created_at);
