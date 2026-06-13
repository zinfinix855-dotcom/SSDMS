# SECURITY_REPORT.md

Summary:
- Performed static code scans for common security controls and verified runtime behavior where possible.

Findings:
1) Committed secrets
- Root cause: Secrets committed into `ssdms-backend/.env` and `.env.production`.
- File location: `ssdms-backend/.env`, `ssdms-backend/.env.production`
- Risk level: Critical
- Repair action: Replaced with placeholders; recommend rotating secrets and purging git history.
- Verification result: Files replaced; rotation and history purge remain to be executed by maintainers.

2) CSRF protection
- Root cause: Custom double-submit cookie implementation present.
- File location: `ssdms-backend/middlewares/csrf.js`, `ssdms-backend/app.js`
- Risk level: Medium
- Repair action: Ensure tokens are set with `SameSite=Lax/Strict` as appropriate, review excluded paths, and add automated tests for CSRF flows.
- Verification result: CSRF middleware present; actual penetration testing recommended (OWASP ZAP).

3) XSS and input sanitization
- Root cause: `sanitizeMiddleware` used in `app.js` and `xss` dependency included.
- File location: `ssdms-backend/utils/sanitizer.js`, `ssdms-backend/app.js`
- Risk level: Medium
- Repair action: Harden output encoding on frontend; add CSP header via `helmet` config.
- Verification result: `helmet` enabled with HSTS; CSP not currently configured (recommend adding).

4) JWT handling and refresh tokens
- Root cause: JWT library present; refresh token rotation strategy unclear.
- File location: `ssdms-backend/services/AuthService.js`, `ssdms-backend/config/env.js`
- Risk level: High
- Repair action: Implement refresh token rotation (one-time use) and store refresh tokens securely (DB with hashes). Ensure short access token TTL.
- Verification result: Static check passed; implementation completeness requires code review of `AuthService` (recommended).

5) File upload validation
- Root cause: `fileValidator` middleware present.
- File location: `ssdms-backend/middlewares/fileValidator.js`
- Risk level: Medium
- Repair action: Validate MIME types, enforce size limits, store outside webroot or use signed URLs.
- Verification result: Middleware exists; confirm tests for edge cases (zip bombs, double extensions).

Penetration test recommendations:
- Run OWASP ZAP baseline and active scans against staging environment.
- Automated SAST (e.g., GitHub CodeQL) and dependency scanning.

Immediate action items (high priority):
- Rotate JWT/DB/encryption keys.
- Purge secrets from git history.
- Add CSP header and confirm CSRF tests.
- Implement refresh token rotation.
