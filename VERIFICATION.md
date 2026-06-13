# SSDMS Verification Guide

This guide shows commands to run full-stack verification locally or via CI.

Local pre-requisites:
- Docker & Docker Compose
- Node 20
- k6 (for load testing)

Steps to run full verification locally:

1) Build and start services (MySQL, Redis, backend, frontend)
```bash
docker compose up -d --build
```

2) Run migrations and seeds
```bash
docker compose exec backend npx knex migrate:latest --knexfile knexfile.js
docker compose exec backend npx knex seed:run --knexfile knexfile.js
```

3) Run backend tests (inside container)
```bash
docker compose exec backend npm test
```

4) Run Redis recovery test
```bash
# inside backend container
node scripts/redis_recovery_test.js
# Or from host if Redis is reachable
node ssdms-backend/scripts/redis_recovery_test.js
```

5) Run performance tests (k6)
```bash
k6 run perf/k6_100.js
k6 run perf/k6_500.js
k6 run perf/k6_1000.js
```

CI
- A GitHub Actions workflow `.github/workflows/integration.yml` has been added to run integration tests using MySQL and Redis services in CI.

Notes
- Rotate secrets and configure environment variables via your CI/CD secret manager.
- For realistic load tests, seed the DB with production-like data.
