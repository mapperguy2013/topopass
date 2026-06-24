#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      cat <<'HELP'
Usage: backup-postgres.sh [--dry-run]

Creates a custom-format pg_dump from the running Postgres container and uploads
it to S3. Runtime configuration is read from BACKUP_ENV_FILE, defaulting to
/opt/topopass/.env.production.
HELP
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

ENV_FILE="${BACKUP_ENV_FILE:-/opt/topopass/.env.production}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-topopass}"
POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-supabase-db}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
BACKUP_WORK_DIR="${BACKUP_WORK_DIR:-/srv/topopass-data/backups/postgres}"
LOG_DIR="${BACKUP_LOG_DIR:-/var/log/topopass/backups}"
COMPOSE_PROJECT_DIR="${COMPOSE_PROJECT_DIR:-}"

require_value() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_value "BACKUP_S3_BUCKET" "$BACKUP_S3_BUCKET"
require_value "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
require_command docker
require_command aws

if [ -n "$COMPOSE_PROJECT_DIR" ]; then
  cd "$COMPOSE_PROJECT_DIR"
fi

mkdir -p "$BACKUP_WORK_DIR" "$LOG_DIR"
LOG_FILE="$LOG_DIR/postgres-backup.log"
exec >>"$LOG_FILE" 2>&1

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
month_prefix="$(date -u +"%Y/%m")"
backup_file="$BACKUP_WORK_DIR/topopass-postgres-$timestamp.dump"
s3_key="${BACKUP_S3_PREFIX%/}/postgres/$month_prefix/topopass-postgres-$timestamp.dump"
s3_uri="s3://$BACKUP_S3_BUCKET/$s3_key"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting Postgres backup"
echo "Backup target: $s3_uri"

if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete. No dump or upload was created."
  exit 0
fi

if ! docker inspect "$POSTGRES_CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Postgres container not found: $POSTGRES_CONTAINER_NAME" >&2
  exit 1
fi

docker exec \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  "$POSTGRES_CONTAINER_NAME" \
  pg_dump -Fc --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  > "$backup_file"

if [ ! -s "$backup_file" ]; then
  echo "Backup file is empty: $backup_file" >&2
  exit 1
fi

aws s3 cp "$backup_file" "$s3_uri" --only-show-errors
rm -f "$backup_file"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Postgres backup uploaded successfully"
