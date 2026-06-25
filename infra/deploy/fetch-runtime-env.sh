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
require_command sed

validate_dotenv_file() {
  local path="$1"

  if [ ! -s "$path" ]; then
    fail "Runtime env file is empty."
  fi

  if grep -q $'\r' "$path"; then
    fail "Runtime env file still contains CRLF line endings after normalization."
  fi

  if grep -Eq '^[[:space:]]*[{\[]' "$path"; then
    fail "Runtime secret looks like JSON. Store plain dotenv KEY=value text instead."
  fi

  if ! awk '
    /^[[:space:]]*$/ { next }
    /^[[:space:]]*#/ { next }
    /^[A-Za-z_][A-Za-z0-9_]*=/ { next }
    { bad = 1 }
    END { exit bad }
  ' "$path"; then
    fail "Runtime env file contains invalid dotenv lines. Expected KEY=value, comments, or blank lines only."
  fi
}

require_dotenv_key() {
  local path="$1"
  local key="$2"

  if ! grep -Eq "^${key}=.+" "$path" || grep -Eq "^${key}=([[:space:]]*|\"\"|'')$" "$path"; then
    fail "Required runtime env key ${key} is missing or blank."
  fi
}

validate_required_runtime_keys() {
  local path="$1"

  require_dotenv_key "$path" "NEXT_PUBLIC_SUPABASE_URL"
  require_dotenv_key "$path" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
}

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

sed -i 's/\r$//' "$TMP_FILE"
validate_dotenv_file "$TMP_FILE"
validate_required_runtime_keys "$TMP_FILE"

install -d -o root -g root -m 750 "$ENV_DIR"
install -o root -g root -m 600 "$TMP_FILE" "$APP_ENV_FILE"
sed -i 's/\r$//' "$APP_ENV_FILE"
chown root:root "$APP_ENV_FILE"
chmod 600 "$APP_ENV_FILE"
validate_dotenv_file "$APP_ENV_FILE"
validate_required_runtime_keys "$APP_ENV_FILE"

log "Runtime env file written to $APP_ENV_FILE with root-only permissions"
log "Secret values were not printed"
