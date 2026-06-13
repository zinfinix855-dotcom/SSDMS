# DATABASE_REPORT.md

Summary:
- Executed `npx knex migrate:status` against local config; 3 migrations marked completed. No pending migrations.

Findings:
1) Migration status
- Root cause: N/A (status check)
- File location: `ssdms-backend/database/migrations/*`
- Risk level: Low
- Repair action: None required; keep migration hygiene.
- Verification result: `npx knex migrate:status` returned 3 completed migrations.

2) Index coverage on critical tables (static audit)
- Root cause: Need for explicit index verification via DB access; local DB connected but expensive to enumerate all EXPLAIN outputs.
- File location: `ssdms-backend/database/schema.sql`, `ssdms-backend/database/migrations/`
- Risk level: High (possible slow queries)
- Repair action: Run `EXPLAIN` on major queries in production-like DB and add missing indexes (suggested columns: `files.visit_number`, `file_movements.file_id`, `audit_logs.file_id`, `notifications.user_id`, `section_entries.section_id`).
- Verification result: Not fully verifiable here; partial checks require running queries against a production-sized dataset.

3) Foreign keys / constraints
- Root cause: Some migrations use application-level constraints rather than DB-level FKs.
- File location: `ssdms-backend/database/migrations/`
- Risk level: Medium
- Repair action: Encourage adding DB foreign key constraints where appropriate; create migration patches.
- Verification result: Pending — requires executing migrations against a test DB and validating referential integrity.

Next steps and commands:
```bash
# Run migrations and seeds in a test DB
npx knex migrate:latest --knexfile ssdms-backend/knexfile.js
npx knex seed:run --knexfile ssdms-backend/knexfile.js
# Example EXPLAIN command (run against test DB):
EXPLAIN SELECT * FROM files WHERE visit_number = 'SS-000145';
```

Recommended deliverables:
- `DATABASE_INDEX_REPORT.csv` listing slow queries and missing indexes (generate from production slow query log).
- Add migration to create missing indexes discovered during load testing.
