#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Waseet — one-command installer.  On a fresh VPS:
#      git clone <repo> waseet && cd waseet && bash install.sh
#  Installs Docker if needed, asks a few questions, boots the whole stack in
#  containers, and (optionally) points a domain at it with automatic HTTPS —
#  WITHOUT disturbing any other sites already running on the server.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

VERSION="1.0.0"
SUDO=''; [ "$(id -u)" -ne 0 ] && SUDO='sudo'

# ---- pretty helpers ----------------------------------------------------------
B=$'\033[1m'; DIM=$'\033[2m'; G=$'\033[0;32m'; Y=$'\033[0;33m'; R=$'\033[0;31m'; C=$'\033[0;36m'; N=$'\033[0m'
say()  { printf '%s\n' "$1"; }
ok()   { printf '%s✅ %s%s\n' "$G" "$1" "$N"; }
warn() { printf '%s⚠️  %s%s\n' "$Y" "$1" "$N"; }
err()  { printf '%s❌ %s%s\n' "$R" "$1" "$N"; }
step() { printf '\n%s▸ %s%s\n' "$B" "$1" "$N"; }
rand() { openssl rand -hex 24; }

banner() {
  clear 2>/dev/null || true
  printf '%s' "$C"
  cat <<'EOF'
   ██╗    ██╗ █████╗ ███████╗███████╗███████╗████████╗
   ██║    ██║██╔══██╗██╔════╝██╔════╝██╔════╝╚══██╔══╝
   ██║ █╗ ██║███████║███████╗█████╗  █████╗     ██║
   ██║███╗██║██╔══██║╚════██║██╔══╝  ██╔══╝     ██║
   ╚███╔███╔╝██║  ██║███████║███████╗███████╗   ██║
    ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝   وسيط
EOF
  printf '%s' "$N"
  printf '   %sB2B Real-Estate Marketplace · Installer v%s%s\n\n' "$DIM" "$VERSION" "$N"
}

# ---- 0. detect existing install --------------------------------------------
banner
if [ -f .env ]; then
  warn "An existing .env was found — this looks like an already-installed instance."
  printf "Re-run installer and OVERWRITE config? Existing data is kept. [y/N]: "; read -r again
  [ "${again:-n}" = "y" ] || { say "Nothing changed. To update instead run: ${B}bash update.sh${N}"; exit 0; }
fi

# ---- 1. Docker ---------------------------------------------------------------
step "Checking Docker…"
if ! command -v docker >/dev/null 2>&1; then
  warn "Docker not found — installing (official script)…"
  curl -fsSL https://get.docker.com | $SUDO sh
  $SUDO systemctl enable --now docker 2>/dev/null || true
fi
if ! docker compose version >/dev/null 2>&1; then
  err "Docker Compose v2 plugin is required. Install it, then re-run."; exit 1
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') ready"

# ---- 2. onboarding -----------------------------------------------------------
step "Let's configure your Waseet instance."

printf "%sAdmin email%s [admin@waseet.com]: " "$B" "$N"; read -r ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@waseet.com}

while :; do
  printf "%sAdmin password%s (min 8 chars): " "$B" "$N"; read -rs ADMIN_PASSWORD; echo
  [ ${#ADMIN_PASSWORD} -ge 8 ] || { warn "Too short."; continue; }
  printf "Confirm password: "; read -rs ADMIN_PASSWORD2; echo
  [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD2" ] && break || warn "Passwords didn't match."
done

printf "%sLoad demo data%s (sample projects/developers/leads)? [y/N]: " "$B" "$N"; read -r SEED
SEED=${SEED:-n}

printf "%sConnect a domain now%s (auto-HTTPS)? [y/N]: " "$B" "$N"; read -r DOMAIN_Q
DOMAIN=""; DOMAIN_Q=${DOMAIN_Q:-n}
if [ "$DOMAIN_Q" = "y" ]; then
  printf "Domain (e.g. waseet.example.com): "; read -r DOMAIN
fi

# host port for the web container (avoid clashing with other apps)
APP_PORT=8080
while $SUDO lsof -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1 || ss -ltn "( sport = :$APP_PORT )" 2>/dev/null | grep -q ":$APP_PORT"; do
  APP_PORT=$((APP_PORT+1))
done

# ---- 3. generate .env --------------------------------------------------------
step "Generating secrets + .env…"
PG_PASS=$(rand); REDIS_PASS=$(rand); S3_KEY=$(rand); S3_SECRET=$(rand)
JWT_A=$(rand)$(rand); JWT_R=$(rand)$(rand); ENC_KEY=$(openssl rand -base64 32)
# With a domain → HTTPS behind a reverse-proxy (bind loopback, secure cookies).
# Without a domain → serve the app directly on the server's public IP:port.
if [ -n "$DOMAIN" ]; then
  PUBLIC_URL="https://$DOMAIN"; COOKIE_SECURE=true; BIND_ADDR=127.0.0.1
else
  SERVER_IP=$(curl -fsS4 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
  SERVER_IP=${SERVER_IP:-YOUR_SERVER_IP}
  PUBLIC_URL="http://$SERVER_IP:$APP_PORT"; COOKIE_SECURE=false; BIND_ADDR=0.0.0.0
fi

cat > .env <<EOF
NODE_ENV=production
PORT=19000
APP_PORT=$APP_PORT
BIND_ADDR=$BIND_ADDR
APP_URL=$PUBLIC_URL
CORS_ORIGIN=$PUBLIC_URL
COOKIE_SECURE=$COOKIE_SECURE

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

POSTGRES_USER=waseet
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=waseet
DATABASE_URL=postgresql://waseet:$PG_PASS@postgres:5432/waseet

REDIS_PASSWORD=$REDIS_PASS
REDIS_URL=redis://:$REDIS_PASS@redis:6379

S3_ENDPOINT=http://rustfs:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=$S3_KEY
S3_SECRET_KEY=$S3_SECRET
S3_BUCKET_PUBLIC=waseet-public
S3_BUCKET_PRIVATE=waseet-private
S3_FORCE_PATH_STYLE=true
STORAGE_PUBLIC_BASE=/storage

JWT_ACCESS_SECRET=$JWT_A
JWT_REFRESH_SECRET=$JWT_R
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
ENCRYPTION_KEY=$ENC_KEY

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Waseet <no-reply@${DOMAIN:-localhost}>"
EOF
chmod 600 .env
ok ".env written (secrets auto-generated)"

# ---- 4. build + boot ---------------------------------------------------------
step "Building containers (first run downloads images — a few minutes)…"
docker compose build
step "Starting the stack…"
docker compose up -d

step "Waiting for the API to become healthy…"
for i in $(seq 1 60); do
  if docker compose exec -T backend wget -qO- http://localhost:19000/health >/dev/null 2>&1; then ok "API is up"; break; fi
  sleep 3
  [ "$i" = "60" ] && warn "API slow to start — check: docker compose logs -f backend"
done

# ---- 5. demo data ------------------------------------------------------------
if [ "$SEED" = "y" ]; then
  step "Loading demo data…"
  docker compose exec -T backend node prisma/seed.js || warn "Demo seed failed (you can retry later)."
fi

# ---- 6. domain + HTTPS (safe: adds ONE vhost, leaves other sites alone) ------
if [ -n "$DOMAIN" ]; then
  step "Configuring $DOMAIN with automatic HTTPS…"
  if ! command -v nginx >/dev/null 2>&1; then
    $SUDO apt-get update -y && $SUDO apt-get install -y nginx
  fi
  if ! command -v certbot >/dev/null 2>&1; then
    $SUDO apt-get install -y certbot python3-certbot-nginx || warn "Could not install certbot automatically."
  fi
  CONF="/etc/nginx/conf.d/waseet-${DOMAIN}.conf"
  $SUDO tee "$CONF" >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  if $SUDO nginx -t 2>/dev/null; then
    $SUDO systemctl reload nginx
    ok "Reverse-proxy vhost added (existing sites untouched)"
    # certbot --nginx edits ONLY this domain's server block → other domains stay intact
    if command -v certbot >/dev/null 2>&1; then
      $SUDO certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect \
        && ok "HTTPS enabled + auto-renewal scheduled by certbot" \
        || warn "SSL step failed — make sure $DOMAIN's DNS A-record points to this server, then run: sudo certbot --nginx -d $DOMAIN"
    fi
  else
    warn "nginx config test failed — vhost written to $CONF but not enabled. Review manually."
  fi
fi

# ---- 6b. firewall for direct IP:port access (no domain / no proxy) ----------
if [ -z "$DOMAIN" ]; then
  step "Opening the firewall for port $APP_PORT…"
  if command -v ufw >/dev/null 2>&1; then
    $SUDO ufw allow "$APP_PORT"/tcp >/dev/null 2>&1 && ok "ufw: port $APP_PORT allowed" || warn "Could not update ufw automatically."
  else
    warn "No ufw detected — if the app isn't reachable, open port $APP_PORT in your VPS panel firewall."
  fi
fi

# ---- 7. nightly backup cron --------------------------------------------------
step "Scheduling automatic nightly backups…"
CRON="/etc/cron.d/waseet-backup"
DIR="$(pwd)"
$SUDO tee "$CRON" >/dev/null <<EOF
# Waseet nightly backup at 03:15, keep the 14 most recent
15 3 * * * root cd $DIR && bash backup.sh create >/dev/null 2>&1 && ls -1t backups/*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
EOF
$SUDO chmod 644 "$CRON"
ok "Nightly backups scheduled (03:15, 14-day retention)"

# ---- done --------------------------------------------------------------------
printf '\n%s────────────────────────────────────────────────────────%s\n' "$G" "$N"
ok "Waseet is installed and running!"
say ""
say "  ${B}URL${N}         $PUBLIC_URL"
say "  ${B}Admin${N}       $ADMIN_EMAIL"
say "  ${B}Password${N}    (the one you set)"
say ""
say "  ${DIM}Manage:${N}  docker compose ps   ·   docker compose logs -f"
say "  ${DIM}Update:${N}  bash update.sh"
say "  ${DIM}Backup:${N}  bash backup.sh create | list | restore <file>"
if [ -z "$DOMAIN" ]; then
  say ""
  say "  🌐 App is live at ${B}$PUBLIC_URL${N} — open it in your browser."
  warn "Plain HTTP (no SSL) — great for testing. For a real domain + HTTPS, re-run: ${B}bash install.sh${N}"
  say "  ${DIM}If it doesn't load, also allow port $APP_PORT in your VPS panel firewall.${N}"
fi
printf '%s────────────────────────────────────────────────────────%s\n' "$G" "$N"
