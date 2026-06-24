#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/opt/topopass/.env.production}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-topopass}"
BACKUP_KIND="${BACKUP_KIND:-postgres}"
MAX_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-36}"

if [ -z "$BACKUP_S3_BUCKET" ]; then
  echo "Missing required environment variable: BACKUP_S3_BUCKET" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Missing required command: aws" >&2
  exit 1
fi

latest_key="$(
  aws s3api list-objects-v2 \
    --bucket "$BACKUP_S3_BUCKET" \
    --prefix "${BACKUP_S3_PREFIX%/}/$BACKUP_KIND/" \
    --query 'sort_by(Contents || `[]`, &LastModified)[-1].Key' \
    --output text
)"

if [ -z "$latest_key" ] || [ "$latest_key" = "None" ]; then
  echo "No $BACKUP_KIND backup found in s3://$BACKUP_S3_BUCKET/${BACKUP_S3_PREFIX%/}/$BACKUP_KIND/" >&2
  exit 1
fi

read -r content_length last_modified < <(
  aws s3api head-object \
    --bucket "$BACKUP_S3_BUCKET" \
    --key "$latest_key" \
    --query '[ContentLength, LastModified]' \
    --output text
)

if [ "${content_length:-0}" -le 0 ]; then
  echo "Latest backup is empty: s3://$BACKUP_S3_BUCKET/$latest_key" >&2
  exit 1
fi

latest_epoch="$(date -u -d "$last_modified" +%s)"
now_epoch="$(date -u +%s)"
age_hours="$(( (now_epoch - latest_epoch) / 3600 ))"

if [ "$age_hours" -gt "$MAX_AGE_HOURS" ]; then
  echo "Latest backup is too old: ${age_hours}h > ${MAX_AGE_HOURS}h" >&2
  echo "Backup: s3://$BACKUP_S3_BUCKET/$latest_key" >&2
  exit 1
fi

echo "Latest $BACKUP_KIND backup is present, non-empty, and ${age_hours}h old: s3://$BACKUP_S3_BUCKET/$latest_key"
