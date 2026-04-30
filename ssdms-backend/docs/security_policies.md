# SSDMS Security Policy & Key Management Plan

## 1. Key Management Strategy (AES-256-GCM)

### Key Storage
- **Development**: Stored in `.env` (ignored by git).
- **Production**: Keys must be injected via a Secure Vault (e.g., AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault). 
- **Separation**: The `ENCRYPTION_KEY` (AES) and `BINDEX_SALT` (HMAC) are strictly separate secrets derived using `scrypt` to prevent cross-protocol attacks.

### Key Rotation Plan
- **Frequency**: Annual rotation or immediately upon suspected breach.
- **Process**:
    1. Generate `NEW_KEY`.
    2. Background worker (`MaintenanceWorker`) iterates through all records.
    3. Decrypt with `OLD_KEY`, re-encrypt with `NEW_KEY`.
    4. Update `cnic_bindex` and `patient_name_bindex` using the new HMAC salt.
    5. Update record in DB.
    6. Once 100% migrated, decommission `OLD_KEY`.

## 2. Incident Response Plan

### Detection
- Real-time monitoring of `AuditRepository` for "File View" spikes.
- Rate limiter trigger alerts (Redis).
- Unauthorized file access attempts via `fileValidator`.

### Response Steps
1. **Isolation**: Revoke compromised `employee_id` sessions immediately via Redis.
2. **Containment**: Rotate JWT secrets to force global logout if widespread breach is suspected.
3. **Investigation**: Analyze `AuditRepository` and `morgan` CID logs to determine data exposure scope.
4. **Notification**: Comply with provincial health data breach notification protocols within 72 hours.

## 3. Infrastructure Requirements
- **HTTPS Enforcement**: Managed via middleware in `app.js` and HSTS via `helmet`. Production deployment MUST use a valid SSL certificate (e.g., Let's Encrypt).
- **Database Backups**: Daily encrypted snapshots with Point-in-Time-Recovery (PITR) enabled.
