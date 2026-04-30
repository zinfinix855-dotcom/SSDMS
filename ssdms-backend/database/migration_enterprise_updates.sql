-- SSDMS Enterprise Database Updates
-- 1. Soft Deletes Support
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE files ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE roles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE finance_splits
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- 2. Improved Indexing for Common Search Patterns
CREATE INDEX idx_files_cnic ON files (cnic);

CREATE INDEX idx_files_patient_name ON files (patient_name);

CREATE INDEX idx_files_composite_search ON files (cnic, mr_number);

-- 3. Audit Logging Enhancements (Additional Metadata)
ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;

ALTER TABLE audit_logs ADD COLUMN metadata JSON;

-- 4. User Session Tracking
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;