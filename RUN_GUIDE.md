# RUN_GUIDE

This guide documents the procedures for securely booting and initializing the SSDMS v4 Enterprise application locally or in a deployed environment.

## 0. Prerequisite Stack
- **Node.js**: v18.x or v20.x
- **Database**: MySQL Server `v8.x`
- **Cache & Event Bus**: Redis Server `v6.x+` (Exposed at `127.0.0.1:6379`)

## 1. Environment Configurations
Clone `.env.example` to `.env` inside both `/ssdms-backend/` and `/ssdms-frontend/`. 
Ensure you map the following critically required keys:

**Backend**:
```
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ssdms
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=super_secret_jwt_key
```

**Frontend**:
```
VITE_API_URL=http://localhost:5000/api/v1
```

## 2. Database Initialization & Migrations
Before booting the application for the first time, you must initialize the schema using the Enterprise Migration System (Knex).

```bash
cd ssdms-backend
# Run the baseline migration
npx knex migrate:latest

# Seed the initial enterprise data (Roles, Admin User, SLA Rules)
npx knex seed:run
```

## 3. Booting the Backend
Navigate to the backend directory.

```bash
cd ssdms-backend
npm install
npm run dev
```

The Application has a hard environment check. If Redis or MySQL drivers are inaccessible, it will immediately halt the cluster safely and notify you.

## 3. Booting the Frontend
Navigate to the frontend directory.

```bash
cd ssdms-frontend
npm install
npm run dev
```

Vite will serve the client directly connected to the backend. Open your browser as prompted.

## 4. Workflows & Architecture Notes
- The application automatically registers 4 `BullMQ` workers on boot (`SLAWorker`, `AIWorker`, `BulkWorker`, `MaintenanceWorker`).
- They safely pool inside Redis. Wait for the `QueueService` online status in the console before conducting workflow movements.
