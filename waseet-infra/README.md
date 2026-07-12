# Waseet — Local Infrastructure (Docker)

PostgreSQL + pgAdmin + RustFS (storage) + Redis — sab ek `docker compose` se.

## Access (browser me kholo)

| Service | URL | Login |
|---|---|---|
| **pgAdmin** (Postgres UI) | http://localhost:19050 | email `admin@waseet.com` · pass `waseet_admin` |
| **RustFS Console** (storage UI) | http://localhost:19901/rustfs/console/ | Account `waseet` · Key `waseet_minio_secret` |

> **Storage engine = RustFS** (S3-compatible, Apache-2.0, Rust) — MinIO ka drop-in replacement with a modern built-in console. MinIO ne apne free console se UI hata di thi, isliye RustFS use kiya. Poori tarah S3-compatible hai (MinIO ka `mc`, AWS SDK, sab chalta hai) + built-in KMS encryption. Console **root `/` pe nahi, `/rustfs/console/` path pe** khulta hai.

> pgAdmin desktop-mode me hai (koi login screen nahi). "Waseet Postgres" server left panel me pehle se register hai — expand karo, DB password `waseet_secret` maangega.

## Connection details (backend/app ke liye)

| Service | Host | Port | Creds |
|---|---|---|---|
| PostgreSQL | localhost | **19432** | user `waseet` · pass `waseet_secret` · db `waseet` |
| RustFS (S3 API) | localhost | **19900** | key `waseet` · secret `waseet_minio_secret` |
| Redis | localhost | **19379** | pass `waseet_redis_secret` |

**Postgres URL:** `postgresql://waseet:waseet_secret@localhost:19432/waseet`

> **Ports** unique `19xxx` block me hain (VPS pe default-port conflicts se bachne ke liye) aur sab `127.0.0.1` pe bound hain — yani ye services **publicly expose nahi** hoti. VPS pe pgAdmin/RustFS console access karne ke liye SSH tunnel use karo, e.g. `ssh -L 19050:127.0.0.1:19050 user@vps`. Ports `.env` (`waseet-infra/.env`) me change ho sakte hain.

## Storage buckets (RustFS)
- `waseet-public` — public read (project images) — serve directly
- `waseet-private` — private (FAL licenses, Iqama/ID, bank proofs, dispute evidence) — sirf signed URLs se

## Commands

```bash
cd waseet-infra

docker compose up -d          # start sab
docker compose ps             # status
docker compose logs -f postgres   # logs
docker compose stop           # rokna (data safe rehta hai)
docker compose down           # containers hataana (volumes/data safe)
docker compose down -v        # SAB kuch mita do (volumes bhi) — careful!
```

## Data kahan hai
Docker named volumes me (host pe safe, restart se nahi jaata):
`waseet_pgdata`, `waseet_rustfsdata`, `waseet_redisdata`, `waseet_pgadmin_data`

## Ports (unique 19xxx block)
| Service | Host port |
|---|---|
| Backend API | 19000 |
| pgAdmin | 19050 |
| Redis | 19379 |
| PostgreSQL | 19432 |
| RustFS S3 API | 19900 |
| RustFS Console | 19901 |

## Notes
- Ye **DEV credentials** hain (`.env` me). Production/VPS pe **saare passwords change** karna.
- Container-to-container me hostname service ka naam hota hai (`postgres`, `rustfs`, `redis`) aur **internal** ports (5432/9000/6379) — ye 19xxx wale sirf host-side mapping hain. `localhost:19xxx` sirf host se access ke liye.
