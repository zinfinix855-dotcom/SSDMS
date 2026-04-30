-- migration_sla_rules.sql
CREATE TABLE workflow_sla_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stage_name VARCHAR(50) NOT NULL UNIQUE,
    max_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial SLA rules
INSERT INTO workflow_sla_rules (stage_name, max_hours) VALUES
('Admission', 24),
('Discharge', 24),
('Pre-Approval', 12),
('Approval', 12),
('File Verification', 24),
('E-Claim', 48),
('E-Claim Verification', 24),
('Finance', 48),
('Segregation', 12),
('Indexation', 12);

-- Add last_sla_check to files table for performance
ALTER TABLE files ADD COLUMN last_sla_status VARCHAR(20) DEFAULT 'Normal';
ALTER TABLE files ADD COLUMN sla_violation_hours INT DEFAULT 0;
