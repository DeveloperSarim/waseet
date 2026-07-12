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

# read specific keys from .env WITHOUT sourcing it (values may contain spaces / < > etc.)
env_get() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true; }
PGUSER="$(env_get POSTGRES_USER)"; PGUSER="${PGUSER:-waseet}"
PGDB="$(env_get POSTGRES_DB)"; PGDB="${PGDB:-waseet}"

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

# pretty "YYYY-MM-DD HH:MM:SS" from a waseet-backup-YYYYMMDD-HHMMSS.tar.gz filename
human_ts() {
  basename "$1" | sed -E 's/^waseet-backup-([0-9]{4})([0-9]{2})([0-9]{2})-([0-9]{2})([0-9]{2})([0-9]{2})\.tar\.gz$/\1-\2-\3 \4:\5:\6/'
}

# collect backups (newest first) into the global BACKUPS array
collect() {
  BACKUPS=()
  local f
  for f in $(ls -1t "$BACKUP_DIR"/waseet-backup-*.tar.gz 2>/dev/null || true); do BACKUPS+=("$f"); done
}

list() {
  collect
  if [ ${#BACKUPS[@]} -eq 0 ]; then echo "No backups yet in $BACKUP_DIR"; return; fi
  printf '%-4s %-21s %-8s %s\n' "  #" "WHEN" "SIZE" "FILE"
  local i=1 f
  for f in "${BACKUPS[@]}"; do
    printf '  %-2s %-21s %-8s %s\n' "$i" "$(human_ts "$f")" "$(du -h "$f" | cut -f1)" "$(basename "$f")"
    i=$((i+1))
  done
}

# interactive picker → sets PICKED. $1 = the action word shown in the prompt.
pick_backup() {
  collect
  if [ ${#BACKUPS[@]} -eq 0 ]; then c_red "No backups found in $BACKUP_DIR"; return 1; fi
  echo "Which backup do you want to $1?"; echo
  list
  echo
  printf "Enter the number to %s (or q to cancel): " "$1"; read -r choice
  [ "$choice" = "q" ] || [ "$choice" = "Q" ] && return 1
  case "$choice" in ''|*[!0-9]*) c_red "Please enter a number."; return 1 ;; esac
  if [ "$choice" -lt 1 ] || [ "$choice" -gt ${#BACKUPS[@]} ]; then c_red "That number isn't in the list."; return 1; fi
  PICKED="${BACKUPS[$((choice-1))]}"
  return 0
}

restore() {
  local file="${1:-}"
  if [ -z "$file" ]; then
    pick_backup "restore" || { echo "Cancelled."; exit 0; }
    file="$PICKED"
  fi
  [ -f "$file" ] || { c_red "File not found: $file"; exit 1; }

  c_red "⚠️  This will OVERWRITE the current database and storage with:"
  echo  "    $(basename "$file")   ($(human_ts "$file"), $(du -h "$file" | cut -f1))"
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

delete() {
  local file="${1:-}"
  if [ -z "$file" ]; then
    pick_backup "delete" || { echo "Cancelled."; exit 0; }
    file="$PICKED"
  fi
  [ -f "$file" ] || { c_red "File not found: $file"; exit 1; }
  c_red "Delete this backup permanently?"
  echo  "    $(basename "$file")   ($(human_ts "$file"), $(du -h "$file" | cut -f1))"
  printf "Type 'yes' to delete: "; read -r ans
  [ "$ans" = "yes" ] && { rm -f "$file"; c_green "🗑️  Deleted."; } || echo "Aborted."
}

case "${1:-}" in
  create)  create ;;
  list)    list ;;
  restore) restore "${2:-}" ;;
  delete)  delete "${2:-}" ;;
  *) echo "Usage: ./backup.sh {create | list | restore [file] | delete [file]}"; echo "       (restore/delete with no file → pick from a numbered list)"; exit 1 ;;
esac
