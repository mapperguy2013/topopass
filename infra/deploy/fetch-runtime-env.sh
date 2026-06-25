#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-west-2}"
RUNTIME_SECRET_NAME="${RUNTIME_SECRET_NAME:-topopass/production/app-env}"
APP_ENV_FILE="${TOPOPASS_APP_ENV_FILE:-/srv/topopass/env/app.env}"

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"
}

fail() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required on this host"
}

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  fail "Run this script as root, for example: sudo bash infra/deploy/fetch-runtime-env.sh"
fi

require_command aws
require_command install
require_command mktemp

ENV_DIR="$(dirname "$APP_ENV_FILE")"
TMP_FILE="$(mktemp)"

cleanup() {
  rm -f "$TMP_FILE"
}

trap cleanup EXIT

umask 077

log "Fetching runtime env from AWS Secrets Manager secret $RUNTIME_SECRET_NAME"

if ! aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$RUNTIME_SECRET_NAME" \
  --query SecretString \
  --output text > "$TMP_FILE"; then
  fail "Unable to fetch runtime secret. Confirm the secret exists, has a current value, and the EC2 role can read it."
fi

if [ ! -s "$TMP_FILE" ]; then
  fail "Runtime secret is empty."
fi

if grep -qx "None" "$TMP_FILE"; then
  fail "Runtime secret has no SecretString value. Store plain dotenv text in the secret value."
fi

if ! grep -Eq '^[A-Za-z_][A-Za-z0-9_]*=' "$TMP_FILE"; then
  fail "Runtime secret does not look like dotenv text. Expected KEY=value lines."
fi

install -d -o root -g root -m 750 "$ENV_DIR"
install -o root -g root -m 600 "$TMP_FILE" "$APP_ENV_FILE"

log "Runtime env file written to $APP_ENV_FILE with root-only permissions"
log "Secret values were not printed"
