-- Migration to add ssc_visit_number and ensure auxiliary tables exist

-- 1. Update files table
ALTER TABLE files
ADD COLUMN ssc_visit_number VARCHAR(50) UNIQUE AFTER visit_number;

-- 2. Create index for faster lookup
CREATE INDEX idx_files_ssc ON files (ssc_visit_number);

-- 3. Ensure file_comments table exists
CREATE TABLE IF NOT EXISTS file_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_number) REFERENCES files (visit_number),
    FOREIGN KEY (employee_id) REFERENCES users (employee_id)
);

-- 4. Ensure file_attachments table exists
CREATE TABLE IF NOT EXISTS file_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_number VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_number) REFERENCES files (visit_number),
    FOREIGN KEY (employee_id) REFERENCES users (employee_id)
);

-- 5. Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM(
        'info',
        'warning',
        'error',
        'success'
    ) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users (employee_id)
);