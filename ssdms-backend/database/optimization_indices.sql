-- =====================================================
-- Phase 2: Database Optimization - Indexing Improvements
-- =====================================================

USE ssdms;

-- 1. Add Index for CNIC (High-frequency search field)
CREATE INDEX IF NOT EXISTS idx_files_cnic ON files (cnic);

-- 2. Add Index for Patient Name (Prefix search optimization)
CREATE INDEX IF NOT EXISTS idx_files_patient_name ON files (patient_name);

-- 3. Add Index for created_at (Dashboard sorting optimization)
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at);

-- 4. Audit Log optimization (Search by resource and date)
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs (target_resource);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);

-- 5. Notifications optimization (Filter by unread)
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (employee_id, is_read);
