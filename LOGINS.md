# Waseet — Logins & Credentials

> ⚠️ Sab demo/local credentials hain. **Production par deploy karne se pehle sab change karo.**

---

## 🔑 App Logins (single login page)

Sabhi ek hi page se login karte hain → **http://localhost:5173/login**
(role ke hisaab se apne portal par redirect ho jate hain)

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| **Admin** | `admin@waseet.com` | `admin1234` | `/admin` |
| **Realtor** | `realtor@waseet.com` | `Test@1234` | `/realtor` |
| **Developer** | `developer@waseet.com` | `Test@1234` | `/developer` |

- Ye teeno **seed** se bante hain (`waseet-backend` me `npm run seed`).
- Realtor account (Ahmed Al-Rashid) me poora demo data hai: projects, leads, 12 commissions, documents, wallet, etc.

---

## 🖥️ App URLs

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend API | http://localhost:19000 |
| API health check | http://localhost:19000/health |
| Marketplace (login-only) | http://localhost:5173/marketplace |

---

## 🗄️ Infra / Tools (Docker — `waseet-infra/`)

Sab `127.0.0.1` par bound hain (VPS-safe). Ports unique `19xxx` block me hain.

### pgweb (Postgres UI — simple & modern)
- URL: **http://localhost:19050**
- **Koi login nahi** — kholte hi DB se auto-connect ho jata hai.
- Left me tables ki list, click karo → rows table view me. "SQL Query" tab me query bhi chala sakte ho.
- (pgAdmin hata diya — ye zyada simple hai)

### PostgreSQL (database)
- Host: `localhost` · Port: `19432`
- User: `waseet` · Password: `waseet_secret`
- Database: `waseet`

### RustFS / Object Storage (MinIO-compatible)
- Console: **http://localhost:19901/rustfs/console/**  (note: `/rustfs/console/` path)
- S3 API endpoint: http://localhost:19900
- Access Key: `waseet`
- Secret Key: `waseet_minio_secret`
- Buckets: `waseet-public` (project images), `waseet-private` (documents/KYC)

### Redis (cache / API counter)
- Host: `localhost` · Port: `19379`
- Password: `waseet_redis_secret`

---

## 📧 SMTP (email) — configured in `waseet-backend/.env`

- Host: `smtp.titan.email` · Port: `587`
- User: `noreply@sarimtools.com`
- From: `Waseet <noreply@sarimtools.com>`
- (Emails: approval, rejection, admin custom email, test email — sab isse jate hain)

---

## ▶️ Kaise chalao

```bash
# 1) Infra (Postgres + RustFS + Redis) — Docker
cd "waseet-infra" && docker compose up -d

# 2) Backend
cd "waseet-backend" && npm run dev        # http://localhost:19000
#    (pehli baar / demo data reset:  npm run seed)

# 3) Frontend
cd "waseet-react" && npm run dev           # http://localhost:5173
```
