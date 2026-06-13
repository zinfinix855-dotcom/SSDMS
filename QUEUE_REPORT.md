# QUEUE_REPORT.md

Summary:
- Static review of `QueueService`, `workers/*`, and Redis config performed. Runtime resilience partly validated: workers do not start when Redis unavailable.

Findings:
1) Redis unavailable handling
- Root cause: `redis` client configured with `lazyConnect` and `enableOfflineQueue: false`; `QueueService.initialize()` checks `isRedisAvailable()` before init.
- File location: `ssdms-backend/config/redis.js`, `ssdms-backend/services/QueueService.js`, `ssdms-backend/server.js`
- Risk level: Medium
- Repair action: Keep current approach; add exponential backoff and alerting when Redis is unavailable for >X minutes.
- Verification result: Verified — when Redis is down, workers are not initialized and the API stays up. (Confirmed via health endpoint: `redis: unavailable`).

2) Worker recovery and duplicate jobs
- Root cause: Need to validate idempotency in job processors and job deduplication strategies (jobId usage).
- File location: `ssdms-backend/services/QueueService.js`, `ssdms-backend/workers/*`
- Risk level: High
- Repair action: Add end-to-end test: enqueue job while Redis up, stop Redis mid-processing, restart Redis, ensure job completes exactly-once and no duplicates are created. Use jobId deterministic patterns and `removeOnComplete` options.
- Verification result: Blocked — requires live Redis; provide test plan (below).

3) Dead-letter / retry behavior
- Root cause: Some jobs set `attempts` and `backoff` default options; no centralized DLQ observed.
- File location: `ssdms-backend/services/QueueService.js`
- Risk level: Medium
- Repair action: Implement explicit failure handling and a `failed-jobs` queue for manual inspection; ensure alerting.
- Verification result: Pending — needs runtime tests.

Test plan to execute when Redis is available:
1. Start Redis.
2. Start backend (workers should initialize).
3. Enqueue a test job `ai-scoring` with jobId `test-1` and observe processing.
4. Stop Redis while job running; restart Redis.
5. Confirm job either completes once or is retried without duplication.
6. Check Redis/BullMQ metrics and job counts.

Commands (example):
```bash
# enqueue via Node script or API endpoint
node scripts/enqueue_test_job.js
# or via redis-cli list keys
redis-cli -p 6379 --raw keys "*"
```

Conclusion:
- Queue code is defensive and will not crash the API when Redis is absent. Full verification requires Redis integration testing.
