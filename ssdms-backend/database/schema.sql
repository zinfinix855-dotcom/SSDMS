-- 1️⃣ Create Database
CREATE DATABASE IF NOT EXISTS ssdms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ssdms;

-- =====================================================
-- 2️⃣ Roles Table
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Insert Default Roles
INSERT IGNORE INTO
    roles (name, permissions)
VALUES ('Admin', '["*"]'),
    (
        'Moderator',
        '["view_dashboard", "search_files", "export_data"]'
    ),
    ('Employee', '[]');

-- =====================================================
-- 3️⃣ Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    employee_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    assigned_sections JSON,
    is_active BOOLEAN DEFAULT TRUE,
    first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_users_role ON users (role_id);

-- Insert Default Admin User
INSERT IGNORE INTO
    users (
        employee_id,
        name,
        email,
        password_hash,
        role_id,
        assigned_sections,
        is_active
    )
SELECT 'Admin01', 'System Administrator', 'admin@ssdms.local', '$2b$10$XUjI/m4d01K.fT.9VfRzYeU3FvX/HHTSVKv1iN61vE2YtTFnF6R0y', id, '["*"]', TRUE
FROM roles
WHERE
    name = 'Admin';

-- =====================================================
-- 4️⃣ Files Table (Core Entity)
-- =====================================================
CREATE TABLE IF NOT EXISTS files (
    visit_number VARCHAR(20) PRIMARY KEY,
    patient_name VARCHAR(150) NOT NULL,
    patient_name_bindex VARCHAR(64),
    mr_number VARCHAR(50) NOT NULL,
    cnic VARCHAR(20) NOT NULL,
    cnic_bindex VARCHAR(64),
    cnic_image_url VARCHAR(255),
    hospital_name VARCHAR(150),
    admission_date DATE,
    current_stage ENUM(
        'Admission',
        'Discharge',
        'Pre-Approval',
        'Approval',
        'File Verification',
        'E-Claim',
        'E-Claim Verification',
        'Finance',
        'Segregation',
        'Indexation'
    ) NOT NULL DEFAULT 'Admission',
    status ENUM(
        'In Progress',
        'Completed',
        'Objected',
        'Returned'
    ) DEFAULT 'In Progress',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_created_by FOREIGN KEY (created_by) REFERENCES users (employee_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_files_stage ON files (current_stage);

CREATE INDEX idx_files_status ON files (status);

CREATE INDEX idx_files_mr ON files (mr_number);

-- =====================================================
-- 5️⃣ File Movements (Workflow Audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS file_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    action_by VARCHAR(50) NOT NULL,
    status ENUM(
        'Forwarded',
        'Returned',
        'Overridden'
    ) DEFAULT 'Forwarded',
    remarks TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movements_file FOREIGN KEY (visit_number) REFERENCES files (visit_number) ON DELETE CASCADE,
    CONSTRAINT fk_movements_user FOREIGN KEY (action_by) REFERENCES users (employee_id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_movements_visit ON file_movements (visit_number);

-- =====================================================
-- 6️⃣ Section Entries (Stage-specific Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS section_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    entered_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_section_file FOREIGN KEY (visit_number) REFERENCES files (visit_number) ON DELETE CASCADE,
    CONSTRAINT fk_section_user FOREIGN KEY (entered_by) REFERENCES users (employee_id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_section_visit ON section_entries (visit_number);

-- =====================================================
-- 7️⃣ Finance Splits
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_splits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    doctor_name VARCHAR(100),
    approved_amount DECIMAL(12, 2),
    payment_status ENUM('Paid', 'Pending') DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finance_file FOREIGN KEY (visit_number) REFERENCES files (visit_number) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_finance_visit ON finance_splits (visit_number);

-- =====================================================
-- 8️⃣ Audit Logs (Security Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    target_resource VARCHAR(100),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (employee_id) REFERENCES users (employee_id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- =====================================================
-- 9️⃣ Monthly Archives
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_archives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    archive_month VARCHAR(7) NOT NULL,
    file_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_archive_month ON monthly_archives (archive_month);
-- Migration: Add SSC Visit Number to files table
-- Run this if the database already exists (i.e., you've already run schema.sql)
-- Safe to run multiple times — uses IF NOT EXISTS pattern

USE ssdms;

-- Add ssc_visit_number column if it does not already exist
ALTER TABLE files
ADD COLUMN IF NOT EXISTS ssc_visit_number VARCHAR(50) UNIQUE AFTER visit_number;

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_files_ssc_visit ON files (ssc_visit_number);

-- Add file_comments and attachments tables if missing (schema V2 additions)
CREATE TABLE IF NOT EXISTS file_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_file FOREIGN KEY (visit_number) REFERENCES files (visit_number) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (employee_id) REFERENCES users (employee_id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS file_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_file FOREIGN KEY (visit_number) REFERENCES files (visit_number) ON DELETE CASCADE,
    CONSTRAINT fk_attach_user FOREIGN KEY (employee_id) REFERENCES users (employee_id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Add notifications table if missing
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (employee_id) REFERENCES users (employee_id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- END OF SCRIPT
-- =====================================================