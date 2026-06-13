# PERFORMANCE_REPORT.md

Summary:
- Load testing is required but cannot be fully executed in this environment (no k6, no Dockerized stack with realistic DB). This file contains a test plan and observed local resource usage notes.

Planned tests:
- k6 scenarios: 100, 500, 1000 virtual users hitting `/api/dashboard/stats` and key endpoints.

k6 script (example):
```js
import http from 'k6/http';
import { sleep } from 'k6';
export let options = { vus: 100, duration: '1m' };
export default function () {
  http.get('http://localhost:5000/api/dashboard/stats');
  sleep(1);
}
```

Metrics to collect:
- Response times (p95, p99)
- CPU / memory of backend container
- DB slow queries and locks
- Redis queue lengths and job latencies

Findings (current environment):
- Local dev build is functional; however, realistic load tests require a production-like dataset and deployed services (Docker + proper DB size).

Next steps to execute load tests:
1. Stand up `docker compose up -d` with DB and Redis.
2. Populate DB with realistic seed data (use `scripts/` or import from production scrubbed dump).
3. Run k6 scenarios and collect metrics via Grafana/Influx or k6 cloud.

Verification result: Blocked due to absent Docker/k6 in this environment.
