#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Waseet — backup / restore.  Captures EVERYTHING: Postgres DB + object storage
#  (uploaded images, documents, logos) into a single timestamped archive.
#
#    ./backup.sh create           make a new full backup
#    ./backup.sh list             list existing backups
#    ./backup.sh restore <file>   restore DB + storage from a backup (asks to confirm)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="./backups"
PROJECT="waseet"
COMPOSE="docker compose"
mkdir -p "$BACKUP_DIR"

# load DB creds from .env
if [ -f .env ]; then set -a; . ./.env; set +a; fi
PGUSER="${POSTGRES_USER:-waseet}"
PGDB="${POSTGRES_DB:-waseet}"

c_green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
c_red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }

create() {
  local ts out tmp
  ts=$(date +%Y%m%d-%H%M%S)
  out="$BACKUP_DIR/waseet-backup-$ts.tar.gz"
  tmp=$(mktemp -d)

  echo "▸ Dumping PostgreSQL…"
  $COMPOSE exec -T postgres pg_dump -U "$PGUSER" -d "$PGDB" --clean --if-exists > "$tmp/db.sql"

  echo "▸ Archiving object storage…"
  docker run --rm -v "${PROJECT}_rustfsdata":/data -v "$tmp":/backup alpine \
    sh -c "cd /data && tar czf /backup/storage.tar.gz ." 2>/dev/null || echo "  (storage volume empty or unavailable)"

  echo "▸ Bundling…"
  tar czf "$out" -C "$tmp" db.sql $( [ -f "$tmp/storage.tar.gz" ] && echo storage.tar.gz )
  rm -rf "$tmp"
  c_green "✅ Backup created: $out ($(du -h "$out" | cut -f1))"
}

list() {
  if ls "$BACKUP_DIR"/*.tar.gz >/dev/null 2>&1; then
    ls -lh "$BACKUP_DIR"/*.tar.gz | awk '{print $9"  ("$5")"}'
  else
    echo "No backups yet in $BACKUP_DIR"
  fi
}

restore() {
  local file="${1:-}"
  [ -z "$file" ] && { c_red "Usage: ./backup.sh restore <backup-file.tar.gz>"; exit 1; }
  [ -f "$file" ] || { c_red "File not found: $file"; exit 1; }

  c_red "⚠️  This will OVERWRITE the current database and storage with: $file"
  printf "Type 'yes' to continue: "; read -r ans
  [ "$ans" = "yes" ] || { echo "Aborted."; exit 0; }

  local tmp; tmp=$(mktemp -d)
  tar xzf "$file" -C "$tmp"

  echo "▸ Restoring database…"
  $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" < "$tmp/db.sql"

  if [ -f "$tmp/storage.tar.gz" ]; then
    echo "▸ Restoring object storage…"
    $COMPOSE stop rustfs >/dev/null 2>&1 || true
    docker run --rm -v "${PROJECT}_rustfsdata":/data -v "$tmp":/backup alpine \
      sh -c "rm -rf /data/* /data/..?* /data/.[!.]* 2>/dev/null; cd /data && tar xzf /backup/storage.tar.gz"
    $COMPOSE start rustfs >/dev/null 2>&1 || true
  fi

  rm -rf "$tmp"
  echo "▸ Restarting backend…"; $COMPOSE restart backend >/dev/null 2>&1 || true
  c_green "✅ Restore complete."
}

case "${1:-}" in
  create)  create ;;
  list)    list ;;
  restore) restore "${2:-}" ;;
  *) echo "Usage: ./backup.sh {create|list|restore <file>}"; exit 1 ;;
esac
