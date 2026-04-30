-- migration_composite_indexes.sql
-- Optimizing dashboard and search performance with composite indexes

USE ssdms;

-- Dashboard: Filtering by stage and status simultaneously
CREATE INDEX idx_files_stage_status ON files (current_stage, status);

-- Movement Queries: Filtering by visit and date
CREATE INDEX idx_movements_visit_date ON file_movements (visit_number, action_date);

-- SLA Monitoring: Current stage and update time
CREATE INDEX idx_files_stage_updated ON files (current_stage, updated_at);

-- Search Optimization: Creation date and stage
CREATE INDEX idx_files_created_stage ON files (created_at, current_stage);
