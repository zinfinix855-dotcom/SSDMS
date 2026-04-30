-- SSDMS Enterprise Schema Migration
-- Date: 2026-03-30
-- Description: Adds workflow_rules, sla_config, and event_store tables for enterprise hardening.

-- 1. workflow_rules
CREATE TABLE IF NOT EXISTS `workflow_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `from_stage` VARCHAR(50) NOT NULL,
  `to_stage` VARCHAR(50) NOT NULL,
  `allowed_roles` JSON NOT NULL, -- e.g., ["Employee", "Admin"]
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_workflow_from_to` (`from_stage`, `to_stage`),
  INDEX `idx_workflow_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. sla_config
CREATE TABLE IF NOT EXISTS `sla_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stage_name` VARCHAR(50) NOT NULL UNIQUE,
  `max_hours` INT NOT NULL DEFAULT 24,
  `escalation_hours` INT NOT NULL DEFAULT 48,
  `priority_weight` DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sla_stage` (`stage_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. event_store (NEW)
CREATE TABLE IF NOT EXISTS `event_store` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `event_type` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `visit_number` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_event_visit` (`visit_number`),
  INDEX `idx_event_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed Default Rules (Optional but recommended for stability)
INSERT INTO `workflow_rules` (`from_stage`, `to_stage`, `allowed_roles`) VALUES 
('Admission', 'Discharge', '["Employee", "Admin"]'),
('Discharge', 'Pre-Approval', '["Employee", "Admin"]'),
('Pre-Approval', 'Approval', '["Employee", "Admin"]'),
('Approval', 'File Verification', '["Employee", "Admin"]'),
('File Verification', 'E-Claim', '["Employee", "Admin"]'),
('E-Claim', 'E-Claim Verification', '["Employee", "Admin"]'),
('E-Claim Verification', 'Finance', '["Employee", "Admin"]'),
('Finance', 'Segregation', '["Employee", "Admin"]'),
('Segregation', 'Indexation', '["Employee", "Admin"]'),
('Indexation', 'Completed', '["Admin"]');

-- Seed Default SLA Config
INSERT INTO `sla_config` (`stage_name`, `max_hours`, `escalation_hours`, `priority_weight`) VALUES 
('Admission', 2, 4, 1.0),
('Discharge', 12, 24, 1.5),
('Pre-Approval', 24, 48, 2.0),
('Approval', 24, 48, 2.0),
('File Verification', 6, 12, 1.2),
('E-Claim', 48, 96, 3.0),
('E-Claim Verification', 24, 48, 2.0),
('Finance', 72, 144, 4.0),
('Segregation', 12, 24, 1.2),
('Indexation', 6, 12, 1.0);
