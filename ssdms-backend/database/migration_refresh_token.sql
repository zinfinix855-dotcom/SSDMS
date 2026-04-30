-- Add refresh_token to users
ALTER TABLE users ADD COLUMN refresh_token VARCHAR(255) NULL;

CREATE INDEX idx_users_refresh ON users (refresh_token);