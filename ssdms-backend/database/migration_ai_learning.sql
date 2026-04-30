-- AI Learning Loop Migration Script
-- Creates structures to capture feedback loops and track prediction accuracy

CREATE TABLE IF NOT EXISTS ai_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    current_stage VARCHAR(50),
    predicted_hours INT,
    actual_hours DECIMAL(10,2),
    predicted_risk INT,
    breached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_feedback_file FOREIGN KEY (visit_number) REFERENCES files(visit_number) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_ai_feedback_visit ON ai_feedback(visit_number);

-- Key-Value store for dynamic ML weights
CREATE TABLE IF NOT EXISTS ai_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value DECIMAL(10,4) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Insert fundamental Baseline Learning Weights
INSERT IGNORE INTO ai_config (config_key, config_value, description) VALUES
('waiting_time_weight', 0.40, 'Weight placed on normalized waiting time'),
('financial_volume_weight', 0.25, 'Logarithmic scale of financial volume drag'),
('stage_criticality_weight', 0.20, 'Vulnerability of the stage environment'),
('sla_urgency_weight', 0.15, 'Urgency based on impending SLA breach timeline');
