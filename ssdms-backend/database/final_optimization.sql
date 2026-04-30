-- SSDMS Consolidated Database Optimizations
-- This script applies high-performance indexes for SSDMS.

USE ssdms;

-- 1. Files Table Optimizations
-- For stage-specific lists and dashboard stats
CREATE INDEX idx_files_stage_status ON files (current_stage, status);
-- For CNIC and MR search
CREATE INDEX idx_files_cnic ON files (cnic);
-- For patient name search
CREATE INDEX idx_files_patient_name ON files (patient_name);
-- For general sorting by date
CREATE INDEX idx_files_created_at ON files (created_at);

-- 2. Audit and Movements Optimizations
CREATE INDEX idx_audit_resource_date ON audit_logs (target_resource, created_at);
CREATE INDEX idx_movements_visit_date ON file_movements (visit_number, action_date);

-- 3. Notifications Optimization
CREATE INDEX idx_notifications_unread ON notifications (employee_id, is_read);

-- 4. Section Entries Optimization
CREATE INDEX idx_section_visit_stage ON section_entries (visit_number, stage_name);
