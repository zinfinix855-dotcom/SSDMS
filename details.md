# 📁 SSDMS — Sehat Sahulat Department Management System

> A full-stack web application for managing patient file workflows across multiple departments in the Sehat Sahulat Programme.

---

## 📌 Overview

SSDMS is an internal department management system built for healthcare workers to:
- Track patient files through a **DB-Driven 10-stage hospital workflow**
- Manage and search patient visit records with **AI-powered prioritization**
- Control user access by roles (Admin, Moderator, Employee)
- **Real-time synchronization** of file movements and SLA breaches via Sockets
- **Enterprise-grade security**: Two-Factor Authentication (TOTP), Refresh token rotation, Audit hash-chaining, and Multitenancy support.
- **Automated Lifecycle**: Background archiving and stale-file escalation via BullMQ.
- **Management Intelligence**: AI-powered narrative file summaries and predictive SLA forecasting.
- Export data and generate audit logs for accountability

---

## 🏗️ Project Structure

```
SSDMS/
├── ssdms-backend/       # Node.js + Express REST API
├── ssdms-frontend/      # React (Vite) SPA
├── package.json         # Root-level scripts
└── details.md           # This file
```

---

## 🖥️ Backend (`ssdms-backend`)

### Tech Stack
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | Web framework / REST API |
| `mysql2` | ^3.18.1 | MySQL database driver (connection pool) |
| `jsonwebtoken` | ^9.0.3 | JWT-based authentication |
| `bcrypt` | ^6.0.0 | Password hashing |
| `dotenv` | ^17.3.1 | Environment variable management |
| `helmet` | ^8.1.0 | HTTP security headers |
| `cors` | ^2.8.6 | Cross-origin resource sharing |
| `express-rate-limit` | ^8.2.1 | API rate limiting (100 req / 15 min) |
| `express-validator` | ^7.3.1 | Input validation |
| `multer` | ^2.1.0 | File/image upload handling |
| `morgan` | ^1.10.1 | HTTP request logging (dev mode) |
| `winston` | ^3.19.0 | Application-level logging (Standardized) |
| `eslint` | ^9.x.x | JS Linting (Standardized) |
| `prettier` | ^3.x.x | Code Formatting |
| `xlsx` | ^0.18.5 | Excel export generation (Multi-sheet) |
| `socket.io` | ^4.8.3 | Real-time bi-directional event communication |
| `knex` | ^3.2.9 | Enterprise migration & seed management |
| `file-type` | ^16.5.4 | Deep Magic Byte signature validation |
| `xss` | ^1.0.15 | Recursive deep-sanitization engine |
| `nodemon` | ^3.1.14 | Dev auto-restart (devDependency) |

### Directory Layout
```
ssdms-backend/
├── server.js              # Entry point — starts Express + tests DB
├── app.js                 # App config (middleware, routes, error handlers)
├── config/
│   ├── env.js             # Loads & exports .env values
│   └── database.js        # MySQL connection pool
├── routes/
│   ├── index.js           # API versioning (v1) and route mounting
│   └── api/
│       ├── auth.js        # Authentication & Token Refresh
│       ├── workflow.js    # Core stage transitions
│       └── ...            # Other modular route files
├── controllers/           # Standardized handlers (camelCase.js)
│   ├── authController.js
│   ├── workflowController.js
│   └── ...
├── services/              # Business logic (PascalCase.js)
│   ├── WorkflowService.js
│   ├── PriorityService.js # AI scoring engine
│   ├── SLAService.js      # Deadline & Escalation manager
│   ├── SocketService.js   # Real-time bridge
│   └── ...
├── repositories/          # Data access layer (PascalCase.js)
│   ├── FileRepository.js
│   ├── WorkflowRepository.js # Rules & SLA config access
│   └── BaseRepository.js
├── middlewares/
│   ├── auth.js            # JWT + RBAC (restrictTo)
│   ├── validate.js        # Joi validation wrapper
│   └── errorHandler.js    # Standardized error response
├── utils/
│   ├── response.js        # Standardized API response layout
│   ├── Cache.js           # In-memory TTL caching
│   └── logger.js          # Centralized Winston logging
├── validations/           # Joi schemas for all requests
├── database/
│   ├── migrations/        # Knex baseline & schema evolution scripts
│   └── seeds/             # Initial roles, admin, and SLA data
└── uploads/               # Stage-specific attachments
```

### Environment Variables (`.env`)
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ssdms
DB_PORT=3306

JWT_SECRET=super_secret_jwt_key_ssdms_2026
JWT_EXPIRES_IN=8h
```

### API Endpoints Summary
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Employee login → returns JWT | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| GET | `/api/users` | List all users | Admin / Moderator |
| POST | `/api/users` | Create new user | Admin |
| POST | `/api/users/reset-password` | Reset a user's password | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| POST | `/api/files/admission` | Create new patient file — accepts `ssc_visit_number` | Admission section |
| GET | `/api/files` | Search files — supports `query`, `stage`, `status` params | ✅ |
| GET | `/api/files/:visitNumber` | Get file detail (also accepts `ssc_visit_number`) | ✅ |
| GET | `/api/files/:visitNumber/sections` | Get all stage section entries for a file | ✅ |
| POST | `/api/workflow/forward` | Forward file (Validates via DB Rules + Recalculates AI Priority) | ✅ |
| POST | `/api/workflow/return` | Return file (Validates via DB Rules + Recalculates AI Priority) | ✅ |
| POST | `/api/workflow/override` | Override file stage (Sets new AI baseline) | Admin |
| POST | `/api/workflow/bulk-action` | Batch forward/return/archive | Admin / Mod |
| GET | `/api/dashboard/stats` | Returns `{ totalFiles, inProgress, objected, completed, byStage[], byStatus[], staleFiles }` | ✅ |
| GET | `/api/dashboard/employee-stats` | Per-employee performance stats | Admin / Mod |
| GET | `/api/dashboard/logs` | Audit logs via dashboard | Admin |
| GET | `/api/dashboard/lead-time` | Bottleneck analysis (avg hours) | Admin / Mod |
| GET | `/api/dashboard/daily-summary` | 24h performance metrics | Admin / Mod |
| GET | `/api/export/excel` | Multi-sheet Excel Export | Admin / Mod |
| GET | `/api/finance/:visitNumber` | Get finance splits for a file | ✅ |
| POST | `/api/finance/:visitNumber/approve` | Approve finance splits | Admin |
| GET | `/api/notifications` | Get user notifications | ✅ |
| PUT | `/api/notifications/:id/read` | Mark notification as read | ✅ |
| POST | `/api/comments/:visitNumber/comments` | Add internal comment to a file | ✅ |
| GET | `/api/comments/:visitNumber/comments` | Get comments for a file | ✅ |
| POST | `/api/attachments/:visitNumber/upload` | Upload a stage document | ✅ |
| GET | `/api/attachments/:visitNumber/attachments` | List attachments for a file | ✅ |

---

## 🗄️ Database Schema (`ssdms`)

### Tables

| `user_sessions` | **NEW:** Multi-session tracking with Refresh Token rotation |
| `ai_config` | **NEW:** Dynamic AI weights for prioritization scoring |
| `workflow_rules` | Defines allowed transitions (from_stage, to_stage, role) |
| `sla_config` | Defines stage deadlines (max_hours, escalation_hours) |
| `files` | visit_number, **priority_score**, **deadline_at**, **escalation_level**, **hospital_id**, status |
| `audit_logs` | Tamper-proof logs with **previous_hash** and **current_hash** chain |
| `file_movements` | Audit trail of every stage transition a file goes through |
| `section_entries` | JSON data entered at each stage (diagnosis, dates, amounts) |
| `finance_splits` | Multiple doctor/payment entries for the Finance stage |
| `file_comments` | Internal collaborative notes per file |
| `file_attachments` | Metadata for uploaded digital documents |
| `monthly_archives` | Monthly snapshots of file data |
| `notifications` | System-triggered alerts for workflow changes |
| `roles` | Admin, Moderator, Employee roles with hospital isolation |
| `users` | Employee accounts with role assignment and **hospital_id** |

### Database & Schema Management
- **Enterprise Migrations**: The system uses `Knex.js` to manage the schema evolution. 
- **Baseline Migration**: `20260423101652_baseline_enterprise_schema.js` consolidates 14+ tables into a single managed unit.
- **Initial Seeding**: `initial_data.js` populates standard roles, a default admin, and health-department SLA rules.

### Workflow Stages (10 stages)
```
Admission → Discharge → Pre-Approval → Approval → File Verification
→ E-Claim → E-Claim Verification → Finance → Segregation → Indexation
```

### Default Admin Credentials
| Field | Value |
|---|---|
| Employee ID | `Admin01` (Updated from `ADMIN-001`) |
| Email | `admin@ssdms.local` |
| Password | `admin4755` (Updated from `admin123`) |

---

## 🌐 Frontend (`ssdms-frontend`)

### Tech Stack
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | React DOM rendering |
| `vite` | ^7.3.1 | Build tool & dev server |
| `react-router-dom` | ^7.13.1 | Client-side routing |
| `axios` | ^1.13.5 | HTTP requests to backend API |
| `bootstrap` | ^5.3.8 | UI components & layout |
| `react-bootstrap` | ^2.10.10 | Bootstrap components for React |
| `lucide-react` | ^0.575.0 | Icon library |
| `recharts` | ^3.7.0 | Charts & data visualization |
| `react-hot-toast` | ^2.6.0 | Toast notifications |
| `vite-plugin-pwa` | ^1.2.0 | Progressive Web App support (devDependency) |

### Directory Layout
```
ssdms-frontend/
├── index.html
├── vite.config.js
├── eslint.config.js
├── public/
├── src/
│   ├── main.jsx           # React app entry point
│   ├── App.jsx            # Router setup & route definitions
│   ├── App.css
│   ├── index.css          # Global styles
│   ├── api/               # Axios instance config
│   ├── assets/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── StageProgress.jsx
│   │   ├── workflow/      # Modular stage-specific forms
│   │   │   ├── AdmissionForm.jsx
│   │   │   ├── FinanceForm.jsx
│   │   │   ├── SegregationForm.jsx
│   │   │   ├── VerificationForm.jsx
│   │   │   └── SearchHero.jsx
│   │   └── file/          # Specialized file detail views
│   │       ├── PatientIdentityCard.jsx
│   │       ├── MovementLedger.jsx
│   │       ├── FinancialDistribution.jsx
│   │       ├── SupportiveEvidence.jsx
│   │       └── AuditThread.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── Dashboard.jsx
│       ├── SearchPage.jsx
│       ├── FileDetailPage.jsx
│       ├── StagePage.jsx
│       ├── ManageUsers.jsx
│       ├── LogsPage.jsx
│       └── ExportPage.jsx
└── dist/                  # Production build output
```

### Pages
| Route | Page | Access |
|---|---|---|
| `/login` | `LoginPage.jsx` | Public |
| `/dashboard` | `Dashboard.jsx` | All users |
| `/search` | `SearchPage.jsx` | All users |
| `/file/:visitNumber` | `FileDetailPage.jsx` | All users |
| `/stage/:stageName` | `StagePage.jsx` | Assigned employees |
| `/admin/users` | `ManageUsers.jsx` | Admin only |
| `/admin/logs` | `LogsPage.jsx` | Admin only |
| `/export` | `ExportPage.jsx` | Admin + Moderator |

### Key Components
| Component | Purpose |
|---|---|
| `Sidebar.jsx` | Navigation sidebar with role-aware menu items |
| `Topbar.jsx` | Top navigation bar showing current user |
| `Layout.jsx` | Wrapper that combines Sidebar + Topbar |
| `StageProgress.jsx` | Visual 10-step workflow progress bar |

### Auth Context (`AuthContext.jsx`)
- Stores JWT token in `localStorage`
- Exposes `user`, `isAdmin`, `isModerator` flags
- `PrivateRoute` component guards all protected pages

---

## 🚀 How to Run

### Prerequisites
- **Node.js** v18+
- **MySQL** 8+ running locally
- Database `ssdms` created via `schema.sql`

## 🛠️ Troubleshooting Login Issues

If you cannot log in with the default admin credentials:

1. **Check Password Hash:** Ensure the `password_hash` in your `users` table matches the one in `schema.sql`.
2. **Manual Update:** If the database is already seeded, run this SQL command:
   ```sql
   UPDATE users SET password_hash = '$2b$10$R.X6eC2Ex4Qmrsd35vsbx.ZzhLSXzRP7PoE62oiX77uAGwCpShPc2' WHERE employee_id = 'ADMIN-001';
   ```
3. **Check .env:** Verify `JWT_SECRET` is set in `ssdms-backend/.env`.
4. **CORS:** Ensure the frontend is running on `http://localhost:5173` (or your configured allowed origin).
5. **IPv4 / IPv6:** If you see `ECONNREFUSED ::1`, set `DB_HOST=127.0.0.1` in `.env` instead of `localhost` to force IPv4.

---

## 👥 User Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full access — manage users, reset passwords, view logs, export, all stages, override workflow |
| **Moderator** | View dashboard (incl. employee stats), search files, export data, bulk actions |
| **Employee** | Access only to assigned workflow stage(s) |

---

## 📋 Notes & Conventions

- **Visit Number format:** `SS-0000001` (auto-incremented by system)
- **SSC Visit Number:** Optional secondary ID `ssc_visit_number` — user-supplied, UNIQUE, searchable
- **Employee ID format:** `EMP-001` or `ADMIN-001`
- **Real-Time Integration:** Socket.IO bridge notifies frontend of all `FILE_MOVE` and `SLA_VIOLATION` events instantly.
- **AI Scoring:** `priority_score` is recalculated on every move based on latency, stage weight, and financial volume.
- **SLA Enforcement:** `deadline_at` is injected on stage entry; background daemon `SLAService` monitors for breaches.
- **Workflow State Machine:** Transitions are strictly validated against `workflow_rules` table.
- All sensitive actions are recorded in `audit_logs` with IP address
- Admin can use `/api/workflow/override` to move a file to any stage outside the normal flow
- Finance stage supports multiple split entries per file (`finance_splits` table)
- Internal comments facilitate cross-department communication
- Bottleneck analytics track average lead time across all 10 stages
- Attachments are stored in `ssdms-backend/uploads/` and their metadata in the `file_attachments` table

## 🆕 UI Features (v2)

| Feature | Description |
|---|---|
| **Clickable Stat Cards** | Dashboard Total/In Progress/Objected/Completed cards navigate to filtered search |
| **Status URL Filter** | `/search?status=In+Progress` — auto-triggers filtered search |
| **SSC Visit Number** | Displayed and searchable on File Detail and Search pages |
| **Previous Section Data** | Button on File Detail page opens a slide-in offcanvas with all historical stage entries |
| **Modular Forms** | Extracted stage-specific logic into reusable components (Phase 3) |
| **Audit Logs (v2)** | Enhanced server-side logging with request metadata and stack traces |

---

## 🛠️ FINAL ARCHITECTURE RESTRUCTURE (PHASE 1-3 HARDENING)

### Concurrency & Data Isolation 🛡️
- **Row-Level Locking**: `SELECT ... FOR UPDATE` implemented across all core workflow transitions to prevent race conditions.
- **Multitenancy**: `hospital_id` integration across the entire schema and repository layer for hospital isolation.
- **Data Integrity**: Soft-delete strategy using `is_archived` and `archived_at` flags to preserve hospital history.

### Authentication & Sessions 🔑
- **Refresh Token Rotation**: Implemented a secure rotation mechanism with a dedicated `user_sessions` table.
- **Device Tracking**: Every session records the `ip_address` and `user_agent` for security audit trails.

### Scalable Real-Time Engine ⚡
- **BullMQ Integration**: Replaced DB-polling SLAs with precise, delayed BullMQ jobs triggered via Redis.
- **Socket Rooms**: Optimized real-time traffic using targeted stage-based and file-based rooms.
- **Event-Driven Architecture**: Decoupled side-effects (SLA, Notifications) from core logic via a centralized `WorkflowSubscriber`.

### Immutable Audit Logs 📝
- **SHA-256 Hash Chain**: Every mutating system event is logged with a `previous_hash` and `current_hash`, creating an immutable chain that detects manual database tampering.
- **Integrity Verification**: Admin UI component allows one-click traversal of the hash chain to verify log validity.

## 🚀 ADVANCED INTELLIGENCE & SCALE (PHASE 4-5)

### Scaling Workflow Operations 🏗️
- **Bulk Job System**: Large-scale file operations (Forwarding/Returning 100+ files) are offloaded to `BulkWorker.js` via Redis queues, returning instant feedback to the user.
- **Async AI Scoring**: Priority calculations are processed out-of-band by `AIWorker.js` to keep workflow transactions under 50ms.

### Automated Hospital Lifecycle 🕒
- **Maintenance Cron**: BullMQ repeatable jobs trigger daily archiving at 02:00 AM, moving historic data to `monthly_archives` and toggling `is_archived`.
- **Stale Triage**: Automatically identifies files with no activity for 7+ days and triggers notifications to stage managers.

### Predictive Monitoring 🧠
- **Risk Forecasting**: `PredictService.js` uses historical throughput data to calculate a "Risk of Breach" score for every active file.
- **Early Warning System**: Emits pro-active socket events when a file enters "High Risk" territory before an SLA violation occurs.

### Enterprise Visibility 📊
- **Executive Dashboard**: Integrated Recharts visualizations for throughput trends, stage distribution, and SLA compliance.
- **Infrastructure Vitals**: Real-time health monitoring of Redis, BullMQ queues, and system integrity via the Admin Health Dashboard.

## 🔐 ADVANCED SECURITY & AI (PHASE 6)

### Personal Security (2FA) 📱
- **TOTP Integration**: Standards-based 2FA using Google/Microsoft Authenticator. Users can self-enroll via the Profile & Security page.
- **Verification Flow**: Secure session bridging that requires an OTP token after password verification.

### AI Narrative Insights 🤖
- **File Biography**: Automatic generation of narrative history for files, highlighting bottlenecks, frequent returns, and stalled timelines.
- **Intelligent Visibility**: Staff can understand complex file journeys in seconds without manual log traversal.

### Deep Granular Auditing 🔍
- **Field-Level Diffing**: The system now tracks exactly *what* changed inside section data (e.g., "MR Number changed from X to Y").
- **Metadata Chain**: These diffs are baked into the immutable SHA-256 audit chain, ensuring full forensic traceability.

### Cloud Storage Abstraction ☁️
- **Storage Provider**: Decoupled file handling from local disk, allowing seamless migration to S3 or MinIO without code changes.

---

## 🛡️ ENTERPRISE PRODUCTION HARDENING (FINAL)

### High-Integrity Workflow Engine
- **Atomic Transactions**: Consolidated all workflow movements into single-unit DB transactions using `SELECT ... FOR UPDATE` row-level locking.
- **Rule-Based Routing**: Dynamic transition validation using the `workflow_rules` table, preventing unauthorized or illogical file movements.
- **Permanent Event Store**: Every system state change is logged to `event_store` within the transaction, providing a 100% reliable audit trail.

### Advanced Real-Time Sync
- **Socket Batching**: Global activity feed is throttled at 300ms using array-based batching (`feed:batch`) to preserve frontend performance during scale.
- **Surgical Room Management**: Precision room joining/leaving for stages and individual files to minimize unnecessary network traffic.

### Autonomous AI Priority Scoring
- **Multi-Factor Normalization**: Priority scores (0-100) are derived from waiting time (sigmoid), financial volume (logarithmic), and stage criticality.
- **SLA Proximity Boost**: Exponential priority increase as files approach their system-defined deadlines.
- **Dynamic Decay**: Automatic priority reduction for stale files (>7 days) to ensure active files remain visible.

### Performance & Memory Safety
- **Memory-Safe Hooks**: Custom `useSocket` implementation with automatic cleanup and robust reconnection logic.

### Zero-Fault Resiliency (Final Hardening)
- **Enterprise Migration Engine**: Moved from manual `.sql` files to a professional Knex-managed migration system for 100% schema reliability.
- **Deep Magic Byte Security**: All uploads are verified via `file-type` magic signatures, preventing extension spoofing and polyglot attacks.
- **Full-Chain CSRF Protection**: Frontend Axios automatically handles `X-XSRF-TOKEN` headers synced with Secure, HttpOnly cookies.
- **Recursive XSS Sanitization**: Custom `deepSanitize` engine scrubs complex JSON clinical blobs that standard middleware misses.
- **Fail-Safe Startup**: `envValidator.js` instantly aborts Express nodes if critical keys like `DB_HOST` or `REDIS_HOST` are missing.

---

## 📈 SSDMS Phase 2 Core Upgrades

### Upgrade 1: Multi-Hospital Support (Completed) 🏥
- **Backend Tenant Context isolation**: Added full `hospital_id` support across all dashboard repositories and query methods (`getGlobalStats`, `getFilesByStage`, `getEmployeePerformance`, `getAuditLogs`, `getLeadTimeAnalytics`).
- **Dynamic Hospital Access API**: Implemented a new secure `GET /api/v1/hospitals` endpoint which serves accessible hospitals according to the user's role (Admin receives all options; standard users receive only their assigned hospital).
- **Persistent Selection & Header Interceptor**: Built a React-scoped `HospitalContext` to manage active hospital selection, persisting to `localStorage` and attaching the `X-Hospital-Id` header to every outgoing Axios call.
- **Role-Based Header Layout**: Integrated a premium, interactive hospital selector dropdown into `ZenithHeader` for Admin users, while displaying a clean, responsive hospital info badge for standard staff.


