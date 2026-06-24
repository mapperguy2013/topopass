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
Usage: backup-storage.sh [--dry-run]

Archives a mounted Supabase Storage directory and uploads it to S3. This is
optional until self-hosted Supabase Storage is mounted on the EC2 host.
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
STORAGE_SOURCE_DIR="${STORAGE_SOURCE_DIR:-/srv/topopass-data/storage}"
BACKUP_WORK_DIR="${BACKUP_WORK_DIR:-/srv/topopass-data/backups/storage}"
LOG_DIR="${BACKUP_LOG_DIR:-/var/log/topopass/backups}"

if [ -z "$BACKUP_S3_BUCKET" ]; then
  echo "Missing required environment variable: BACKUP_S3_BUCKET" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Missing required command: aws" >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "Missing required command: tar" >&2
  exit 1
fi

mkdir -p "$BACKUP_WORK_DIR" "$LOG_DIR"
LOG_FILE="$LOG_DIR/storage-backup.log"
exec >>"$LOG_FILE" 2>&1

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
month_prefix="$(date -u +"%Y/%m")"
archive_file="$BACKUP_WORK_DIR/topopass-storage-$timestamp.tar.gz"
s3_key="${BACKUP_S3_PREFIX%/}/storage/$month_prefix/topopass-storage-$timestamp.tar.gz"
s3_uri="s3://$BACKUP_S3_BUCKET/$s3_key"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting storage backup"
echo "Storage source: $STORAGE_SOURCE_DIR"
echo "Backup target: $s3_uri"

if [ ! -d "$STORAGE_SOURCE_DIR" ]; then
  echo "Storage directory does not exist: $STORAGE_SOURCE_DIR" >&2
  exit 1
fi

if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete. No archive or upload was created."
  exit 0
fi

tar -C "$STORAGE_SOURCE_DIR" -czf "$archive_file" .

if [ ! -s "$archive_file" ]; then
  echo "Storage archive is empty: $archive_file" >&2
  exit 1
fi

aws s3 cp "$archive_file" "$s3_uri" --only-show-errors
rm -f "$archive_file"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Storage backup uploaded successfully"
