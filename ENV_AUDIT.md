# ENV_AUDIT.md

Summary:
- Performed static checks of environment files and config.

Findings:
1) Weak / placeholder JWT secrets
- Root cause: Secrets were committed into `ssdms-backend/.env` and `.env.production`.
- File location: `ssdms-backend/.env`, `ssdms-backend/.env.production`
- Risk level: Critical
- Repair action: Replaced files with placeholders and advised immediate secret rotation; move secrets to secret manager.
- Verification result: Placeholders now present; rotation and history purge pending (cannot verify rotation here).

2) Missing SESSION_SECRET/COOKIE_SECRET usage verification
- Root cause: `COOKIE_SECRET` referenced in `.env.example` but not enforced in deploy config.
- File location: `ssdms-backend/.env.example`, `ssdms-backend/app.js` (cookie parser)
- Risk level: High
- Repair action: Require `COOKIE_SECRET` in env validation and fail startup if absent.
- Verification result: Manual code change recommended; not yet applied.

3) Redis not available locally
- Root cause: Local environment lacks Redis binary / Docker
- File location: `docker-compose.yml`, `ssdms-backend/config/redis.js`
- Risk level: High (background workers disabled)
- Repair action: Install Redis or run via Docker; ensure `REDIS_HOST`/`REDIS_PORT` configured in deployment secrets.
- Verification result: Confirmed — `health` endpoint reports `redis: unavailable` when Redis absent.

Validation Checklist (automatable):
- [x] `JWT_SECRET` exists in `.env` (placeholder present)
- [ ] `JWT_SECRET` strong enough (must be >=32 bytes); current placeholder must be replaced
- [x] `DB_*` present in `.env` placeholders
- [x] `REDIS_*` present in `.env` placeholders
- [ ] `COOKIE_SECRET` enforced

Next steps:
- Rotate secrets immediately and push to a secrets manager.
- Add runtime env validation to `ssdms-backend/config/env.js` to enforce minimum entropy for secrets.
