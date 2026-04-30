# Changelog
All notable changes to the SSDMS Enterprise ecosystem will be documented here.

## [Unreleased / Phase 6 & 7]
### Added
- **Global Error Handling**: Added `catchAsync` wrapper across backend controllers to trap unhandled promise rejections and stabilize the process.
- **Environment Validation**: Added `utils/envValidator.js` which verifies `DB_` and `REDIS_` configuration on startup, preventing runtime crashing.
- **Health Verification Center**: Implemented `/health` on the Express core and `/admin/health` logic for live AWS ELB and UI infrastructure tracking.
- **SLA Decay Architecture**: Upgraded `PriorityService.js` to utilize non-linear sigmoid wait-scoring and logarithmic financial volume scaling to perfectly weigh healthcare datasets.

### Changed
- **Socket Real-Time Events**: Decoupled workflow triggers into isolated rooms for multi-tenancy `[Phase 2]`. 
- **Dependency Rollback Stability**: Shifted `otplib` dependency from `v13.4.0` down to `v12.0.1` to maintain core CommonJS singleton compliance and permanently fix 2FA onboarding breakage.
- **Strict Linting Enforcement**: Formatted and neutralized >140 unused imports, orphaned variable allocations (e.g., `chartData` in Dashboard), and errant loop variables across `React Vite` and `Node Express`.

### Removed
- Unused debugging `console.log` and `console.error` logs inside production files (`ArchiveService.js`, etc) were stripped and replaced with centralized `winston` file appenders via `logger`.
