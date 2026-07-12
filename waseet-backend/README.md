# Waseet Backend (Express API)

B2B real-estate marketplace API. **Express + Prisma (PostgreSQL) + Redis + S3 (RustFS)**.

## Requirements
- Node ≥ 20
- Infra chal raha ho (`../waseet-infra` → `docker compose up -d`): Postgres, Redis, RustFS.

## Setup
```bash
npm install
npm run prisma:generate     # Prisma client
npm run prisma:migrate      # apply migrations (creates tables)
npm run dev                 # start with --watch
```

## Endpoints (abhi)
- `GET /` — API info
- `GET /health` — DB + Redis + Storage health checks

API runs on **http://localhost:19000** (unique `19xxx` port block — see `waseet-infra`).

## Structure
```
src/
├── server.js            # entry (http server + graceful shutdown)
├── app.js               # express app + middleware
├── config/env.js        # env validation (zod)
├── lib/                 # prisma, redis, s3 clients
├── middleware/          # error handler, 404, (auth later)
├── modules/             # feature modules (health, + auth/projects/leads/... later)
└── utils/logger.js      # pino logger
prisma/schema.prisma     # DB schema (users, auth, audit → + domain models)
```

## Roadmap
1. ✅ Foundation: server, DB/Redis/S3 wired, health checks, users/auth/audit schema
2. Auth module (register / login / refresh / JWT + roles)
3. Domain: projects, unit types, media/docs (S3 upload + signed URLs)
4. Leads (lifecycle) + duplicate detection
5. Commissions + payouts + disputes + audit
6. Notifications + background jobs (Redis/BullMQ)
7. Dockerfile + compose integration for VPS deploy
