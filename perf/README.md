Performance test scripts (k6)

Usage:
- Install k6: https://k6.io/docs/getting-started/installation/
- Run locally against a running stack (backend + DB + Redis):

```bash
k6 run perf/k6_100.js
k6 run perf/k6_500.js
k6 run perf/k6_1000.js
```

Notes:
- Ensure the endpoint `/api/dashboard/stats` exists and is a representative read operation.
- Seed the database with realistic data before running large VU tests.
- Collect system metrics (CPU, memory, DB slow queries) during tests.
