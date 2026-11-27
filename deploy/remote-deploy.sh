#!/usr/bin/env bash
# Runs on the VM (called by .github/workflows/deploy.yml). Nothing needs to be
# set up by hand: it pulls the image built on GitHub from ghcr.io, starts it, attaches it to the existing Caddy
# container's network, and adds the site to that Caddy's config.
#
# stdin carries two lines: the SSH password (only used for sudo when the SSH
# user cannot talk to Docker directly) and a short-lived ghcr.io pull token.
set -euo pipefail
cd "$(dirname "$0")/.."

IFS= read -r SUDO_PASS || true
IFS= read -r GHCR_TOKEN || true

if docker info >/dev/null 2>&1; then
  run_docker() { docker "$@"; }
else
  run_docker() { printf '%s\n' "$SUDO_PASS" | sudo -S -p '' docker "$@"; }
fi

fail() { echo "::error::$*" >&2; exit 1; }
log() { echo "==> $*"; }

# Deploy settings written by the workflow:
#   IMAGE, REGISTRY, REGISTRY_USER, DOMAIN, APP_PORT, CADDY_CONTAINER, CADDY_NETWORK
# shellcheck disable=SC1091
source ./.deploy.env
APP_PORT="${APP_PORT:-9500}"
APP_CONTAINER=personal-tools-app
MARK_NAME=personal-tools-app
[ -n "${IMAGE:-}" ] || fail "IMAGE is missing from .deploy.env"
[ -n "$GHCR_TOKEN" ] || fail "No registry token received on stdin"

run_docker compose version >/dev/null 2>&1 \
  || fail "Docker Engine with the compose plugin must be installed on the VM"

# --- 1. Pull the image and start the app ----------------------------------------
# Log in with a throwaway Docker config so the token is never saved in
# ~/.docker or root's config, and never needs stdin (sudo may be reading it).
REG_CONFIG=$(mktemp -d)
trap 'rm -rf "$REG_CONFIG"' EXIT
chmod 700 "$REG_CONFIG"
AUTH=$(printf '%s:%s' "$REGISTRY_USER" "$GHCR_TOKEN" | base64 | tr -d '\n')
printf '{"auths":{"%s":{"auth":"%s"}}}\n' "$REGISTRY" "$AUTH" > "$REG_CONFIG/config.json"

log "Pulling $IMAGE"
if ! run_docker --config "$REG_CONFIG" pull "$IMAGE"; then
  ARCH=$(uname -m)
  fail "Could not pull $IMAGE. This VM is $ARCH; if that is not x86_64, set the IMAGE_PLATFORM variable in GitHub, for example linux/arm64."
fi
rm -rf "$REG_CONFIG"

log "Starting $APP_CONTAINER on port $APP_PORT"
# sudo drops the environment, so compose reads IMAGE and APP_PORT from the file.
run_docker compose --env-file ./.deploy.env up -d --remove-orphans

# --- 2. Find the existing Caddy container ------------------------------------
if [ -z "${CADDY_CONTAINER:-}" ]; then
  CADDY_CONTAINER=$(run_docker ps --format '{{.Names}} {{.Image}}' \
    | awk -v self="$APP_CONTAINER" '$1 != self && tolower($0) ~ /caddy/ {print $1; exit}')
fi
[ -n "$CADDY_CONTAINER" ] || fail "No running Caddy container found. Set the CADDY_CONTAINER variable in GitHub."
run_docker inspect "$CADDY_CONTAINER" >/dev/null 2>&1 || fail "Container '$CADDY_CONTAINER' not found"
log "Using Caddy container: $CADDY_CONTAINER"

caddy_exec() { run_docker exec "$CADDY_CONTAINER" "$@"; }

# --- 3. Put the app on Caddy's network ---------------------------------------
CADDY_NETWORKS=$(run_docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$CADDY_CONTAINER")
if [ "$(run_docker inspect -f '{{.HostConfig.NetworkMode}}' "$CADDY_CONTAINER")" = "host" ]; then
  UPSTREAM="localhost:$APP_PORT"
  log "Caddy uses host networking; proxying to $UPSTREAM"
else
  if [ -z "${CADDY_NETWORK:-}" ]; then
    CADDY_NETWORK=$(echo "$CADDY_NETWORKS" | awk '{print $1}')
  fi
  [ -n "$CADDY_NETWORK" ] || fail "Could not determine the Caddy container's network"
  if ! run_docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$APP_CONTAINER" \
      | tr ' ' '\n' | grep -qx "$CADDY_NETWORK"; then
    run_docker network connect "$CADDY_NETWORK" "$APP_CONTAINER"
  fi
  UPSTREAM="$APP_CONTAINER:$APP_PORT"
  log "$APP_CONTAINER joined network $CADDY_NETWORK; proxying to $UPSTREAM"
fi

# --- 4. Add the site to Caddy's config ---------------------------------------
# Config path: value after --config in the container's command, else the default.
CADDY_CONFIG=$(run_docker inspect -f '{{range .Config.Entrypoint}}{{println .}}{{end}}{{range .Config.Cmd}}{{println .}}{{end}}' "$CADDY_CONTAINER" \
  | awk 'prev == "--config" {print; exit} {prev = $0}')
CADDY_CONFIG=${CADDY_CONFIG:-/etc/caddy/Caddyfile}
case "$CADDY_CONFIG" in
  *.json) fail "Caddy uses a JSON config ($CADDY_CONFIG); only Caddyfile configs can be updated automatically" ;;
esac

# The file must live on a mount (or the change would be lost when Caddy is recreated).
# Find the mount that holds it and the matching path on the VM. The mount may be
# read-only inside Caddy, so the file is edited on the VM side, not via Caddy.
HOST_CONFIG=""
BEST_LEN=0
while IFS='|' read -r src dest; do
  [ -n "$dest" ] || continue
  case "$CADDY_CONFIG" in
    "$dest"|"$dest"/*)
      if [ ${#dest} -gt $BEST_LEN ]; then
        BEST_LEN=${#dest}
        HOST_CONFIG="$src${CADDY_CONFIG#"$dest"}"
      fi ;;
  esac
done < <(run_docker inspect -f '{{range .Mounts}}{{.Source}}|{{.Destination}}{{println}}{{end}}' "$CADDY_CONTAINER")
[ -n "$HOST_CONFIG" ] || fail "$CADDY_CONFIG is not on a volume/bind mount in $CADDY_CONTAINER, so it can't be changed permanently"
CADDY_IMAGE=$(run_docker inspect -f '{{.Config.Image}}' "$CADDY_CONTAINER")
log "Caddy config: $CADDY_CONFIG (on the VM: $HOST_CONFIG)"

# Each app owns its own marked block, so this never touches the portfolio's block.
BEGIN_MARK="# BEGIN $MARK_NAME (managed by personal-tools deploy workflow - do not edit)"
END_MARK="# END $MARK_NAME"

CURRENT=$(caddy_exec cat "$CADDY_CONFIG") || fail "Could not read $CADDY_CONFIG in $CADDY_CONTAINER"
STRIPPED=$(printf '%s\n' "$CURRENT" | awk -v b="$BEGIN_MARK" -v e="$END_MARK" '
  $0 == b {skip = 1; next}
  $0 == e {skip = 0; next}
  !skip')
# Drop trailing blank lines left behind by a previous block.
STRIPPED=$(printf '%s\n' "$STRIPPED" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')

NEW=$(cat <<EOF
$STRIPPED

$BEGIN_MARK
$DOMAIN {
	encode zstd gzip
	request_body {
		max_size 10MB
	}
	reverse_proxy $UPSTREAM
}
$END_MARK
EOF
)

if [ "$NEW" = "$CURRENT" ]; then
  log "Caddy config already up to date"
else
  CONFIG_DIR=$(dirname "$CADDY_CONFIG")
  CANDIDATE="$CONFIG_DIR/.$MARK_NAME-candidate.Caddyfile"
  BACKUP=".caddy-backup.Caddyfile"
  printf '%s\n' "$CURRENT" > "$BACKUP"

  # Content is passed base64-encoded as an argument because stdin may carry the sudo password.
  b64() { printf '%s\n' "$1" | base64 | tr -d '\n'; }
  # Candidate file inside the running Caddy (next to the real one, so relative imports resolve).
  write_candidate() { caddy_exec sh -c "echo '$(b64 "$2")' | base64 -d > '$1'"; }
  # The real file is written on the VM through a throwaway container using Caddy's own image,
  # so it works regardless of file ownership. Writing in place keeps the inode, so
  # single-file bind mounts see the change.
  write_config() {
    run_docker run --rm --entrypoint sh -v "$HOST_CONFIG:/target" "$CADDY_IMAGE" \
      -c "echo '$(b64 "$1")' | base64 -d > /target"
  }

  write_candidate "$CANDIDATE" "$NEW"
  if ! caddy_exec caddy validate --config "$CANDIDATE" --adapter caddyfile; then
    caddy_exec rm -f "$CANDIDATE" || true
    fail "The updated Caddy config is invalid (is $DOMAIN already defined in $CADDY_CONFIG?). Nothing was changed."
  fi
  caddy_exec rm -f "$CANDIDATE"

  write_config "$NEW" || fail "Could not write $HOST_CONFIG. Nothing was changed."
  log "Updated $HOST_CONFIG (backup of previous version: $PWD/$BACKUP)"

  if caddy_exec caddy reload --config "$CADDY_CONFIG" --adapter caddyfile; then
    log "Caddy reloaded"
  else
    echo "::warning::caddy reload failed (admin API may be disabled); restarting $CADDY_CONTAINER"
    if ! run_docker restart "$CADDY_CONTAINER"; then
      write_config "$CURRENT"
      run_docker restart "$CADDY_CONTAINER" || true
      fail "Could not apply the Caddy config; the previous config was restored"
    fi
  fi
fi

# --- 5. Clean up ---------------------------------------------------------------
# Remove older images of this app only, not other apps on the VM.
IMAGE_REPO="${IMAGE%:*}"
run_docker images "$IMAGE_REPO" --format '{{.Repository}}:{{.Tag}}' \
  | grep -vx "$IMAGE" \
  | while read -r old; do run_docker rmi "$old" >/dev/null 2>&1 || true; done
run_docker image prune -f >/dev/null
run_docker compose --env-file ./.deploy.env ps
