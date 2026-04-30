# Architecture Report - SSDMS v4

## 1. Overview
The Sehat Sahulat Department Management System (SSDMS) operates on an enterprise-grade Layered Monolith pattern split across a high-performance React UI and an asynchronous Node.js controller backend.

## 2. Data Flow Structure
- **Frontend Layer (React/Vite)**: Features modular pages and UI components connected via internal React `ContextProviders`. Data fetch happens via custom API hooks utilizing `axios` interceptors to auto-manage JWT Refresh Token rotations.
- **Routing & Middleware**: Traffic enters the Express server guarded by caching limiters, `helmet` security headers, and JWT decode authorization bridges.
- **Controller/Service Boundary**: Controller paths (`workflowController`) are thin layers that pipe validated inputs directly to service classes. Services handle the intense domain logic (e.g., executing the atomic DB operations).
- **Persistence Layer (MySQL + Redis)**: Primary transactional data is locked inside MySQL InnoDB. Rapid caching, AI tracking, Socket.io user sessions, and delayed background jobs are maintained autonomously in Redis via `ioredis`.

## 3. Workflow Engine
The system uses `workflowEngine.js` as its deterministic finite-state coordinator.
All file movements must flow continuously through defined `STAGES`: `Admission` -> `Indexation`. 

If a movement creates a structural violation or an out-of-bounds stage jump, the system forcibly traps the request and throws a localized HTTP Exception. Background Jobs then parse completed movements synchronously executing post-commit actions like recalculating Neural-Logic (Priority AI scores) and re-evaluating remaining SLA deadlines. This completely decouples expensive calculations from the user HTTP request timeline allowing <20ms API response delays.
