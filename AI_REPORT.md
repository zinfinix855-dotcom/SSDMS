# AI_REPORT.md

Summary:
- Reviewed `services/ai/*`, `workers/AIWorker.js`, and `PriorityService` integration.

Findings:
1) Deterministic heuristics vs ML
- Root cause: Current `AIEngine` uses heuristics (RiskModel, TimeEstimator, etc.), not trainable ML.
- File location: `ssdms-backend/services/ai/*.js`, `ssdms-backend/workers/AIWorker.js`
- Risk level: Informational
- Repair action: If ML training desired, add data capture pipelines, model training jobs, and a model registry; otherwise market as "Predictive Intelligence Engine".
- Verification result: Verified — functions execute synchronously and are unit-tested.

2) Queue integration
- Root cause: AIWorker relies on BullMQ `ai-scoring` queue.
- File location: `ssdms-backend/workers/AIWorker.js`, `ssdms-backend/services/QueueService.js`
- Risk level: High (depends on Redis availability)
- Repair action: Add graceful retry/backoff, and persistent checkpoints for long-running recalculations.
- Verification result: Static verification complete; runtime verification requires Redis and end-to-end test.

3) Performance
- Root cause: Potential CPU/memory usage when scoring many files concurrently.
- File location: `ssdms-backend/services/ai/*`
- Risk level: Medium
- Repair action: Add concurrency controls, CPU profiling, and limit batch sizes.
- Verification result: Pending (needs load testing).

4) Test coverage
- Root cause: Unit tests present for AIService but more integration tests needed.
- File location: `ssdms-backend/tests/unit/AIService.test.js`
- Risk level: Low
- Repair action: Add integration tests that simulate queue processing and DB updates.
- Verification result: Unit tests passed locally.

Next steps:
- If upgrading to ML, implement data collection and offline training pipelines (e.g., scheduled jobs writing labelled data to a dataset store).
- Create end-to-end AI worker tests using ephemeral Redis.
