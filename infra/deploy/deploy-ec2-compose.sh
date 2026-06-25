#!/usr/bin/env bash
set -euo pipefail

APP_NAME="topopass"
REPO_DIR="${TOPOPASS_REPO_DIR:-/srv/topopass}"
COMPOSE_FILE="${TOPOPASS_COMPOSE_FILE:-$REPO_DIR/deploy/docker-compose.prod.yml}"
APP_ENV_FILE="${TOPOPASS_APP_ENV_FILE:-/srv/topopass/env/app.env}"
PROXY_ENV_FILE="${TOPOPASS_PROXY_ENV_FILE:-/srv/topopass/env/proxy.env}"
TOPOPASS_IMAGE="${TOPOPASS_IMAGE:-006419716542.dkr.ecr.eu-west-2.amazonaws.com/topopass-web:latest}"
AWS_REGION="${AWS_REGION:-eu-west-2}"
ECR_REGISTRY="${TOPOPASS_IMAGE%%/*}"

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

require_file() {
  [ -f "$1" ] || fail "Required file is missing: $1"
  [ -r "$1" ] || fail "Required file is not readable: $1. If it was fetched from Secrets Manager, run this deploy script with sudo."
}

log "Starting $APP_NAME EC2 Docker Compose deployment"

require_command aws
require_command docker

if ! docker compose version >/dev/null 2>&1; then
  fail "Docker Compose plugin is required"
fi

require_file "$COMPOSE_FILE"
require_file "$APP_ENV_FILE"
require_file "$PROXY_ENV_FILE"

mkdir -p /srv/topopass/logs/caddy /srv/topopass/logs/deploy /srv/topopass/env /srv/topopass-data

log "Authenticating Docker to ECR registry $ECR_REGISTRY"
aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null

export TOPOPASS_IMAGE
export TOPOPASS_APP_ENV_FILE="$APP_ENV_FILE"
export TOPOPASS_PROXY_ENV_FILE="$PROXY_ENV_FILE"

log "Pulling image $TOPOPASS_IMAGE"
docker compose -f "$COMPOSE_FILE" pull app

log "Validating Docker Compose configuration"
docker compose -f "$COMPOSE_FILE" config >/dev/null

log "Starting production stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "Container status"
docker compose -f "$COMPOSE_FILE" ps

APP_DOMAIN_VALUE="$(grep -E '^APP_DOMAIN=' "$PROXY_ENV_FILE" | tail -n1 | cut -d= -f2- || true)"

if [ "$APP_DOMAIN_VALUE" = ":80" ] || [ -z "$APP_DOMAIN_VALUE" ]; then
  log "Local IP-mode health check through Caddy"
  if curl -fsS --max-time 10 http://127.0.0.1/api/health >/dev/null; then
    log "Local health check passed: http://127.0.0.1/api/health"
  else
    fail "Local health check failed. Inspect logs with: docker compose -f $COMPOSE_FILE logs --tail 100"
  fi
else
  log "Skipping 127.0.0.1 Caddy health check because APP_DOMAIN is set to a hostname."
  log "Use the public HTTPS domain smoke test after DNS and certificates are ready."
fi

cat <<EOF

Deployment finished.

Useful smoke tests:
  curl -I http://127.0.0.1
  curl -fsS http://127.0.0.1/api/health
  curl -I http://<EC2_PUBLIC_IP>

Useful operations:
  docker compose -f $COMPOSE_FILE ps
  docker compose -f $COMPOSE_FILE logs --tail 100 app
  docker compose -f $COMPOSE_FILE logs --tail 100 caddy
  docker compose -f $COMPOSE_FILE restart app
  docker compose -f $COMPOSE_FILE down

No env file contents were printed.
EOF
