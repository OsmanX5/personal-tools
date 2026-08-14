#!/usr/bin/env bash
#
# Build and run the personal-tools production image.
#
# Picks a host port: tries 3000 (or $PORT), and if it's taken, asks for another
# one until it finds a free port.
#
#   ./scripts/run-prod.sh              # interactive, defaults to port 3000
#   PORT=3001 ./scripts/run-prod.sh    # start from a different port
#   ./scripts/run-prod.sh --yes        # never prompt (fails if the port is busy)
#
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE_NAME="personal-tools"
CONTAINER_NAME="personal-tools"
DEFAULT_PORT="${PORT:-3000}"
ASSUME_YES=false

for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=true ;;
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# --- env file -----------------------------------------------------------------

ENV_FILE=""
for candidate in .env.production .env.local .env; do
  if [ -f "$candidate" ]; then ENV_FILE="$candidate"; break; fi
done

if [ -z "$ENV_FILE" ]; then
  echo "No .env.production or .env.local found." >&2
  echo "Create one with MONGODB_URI, MONGODB_DB_NAME, APP_PASSWORD and SESSION_SECRET." >&2
  exit 1
fi

for required in MONGODB_URI APP_PASSWORD SESSION_SECRET; do
  if ! grep -q "^${required}=" "$ENV_FILE"; then
    echo "$ENV_FILE is missing $required" >&2
    exit 1
  fi
done

# --- port selection -----------------------------------------------------------

port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$1" 2>/dev/null | grep -q LISTEN
  else
    # No probe available — assume free and let `docker run` fail if it isn't.
    return 1
  fi
}

valid_port() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) [ "$1" -ge 1 ] && [ "$1" -le 65535 ] ;;
  esac
}

# Prompts read from the terminal directly, so they still work when stdin is a pipe.
can_prompt() { [ "$ASSUME_YES" != true ] && [ -r /dev/tty ]; }

HOST_PORT="$DEFAULT_PORT"
while port_in_use "$HOST_PORT"; do
  echo "Port $HOST_PORT is already in use." >&2
  if ! can_prompt; then
    echo "Re-run with PORT=<free port> to pick another one." >&2
    exit 1
  fi
  read -r -p "Enter a different port (e.g. $((HOST_PORT + 1))): " HOST_PORT < /dev/tty
  if ! valid_port "$HOST_PORT"; then
    echo "'$HOST_PORT' is not a valid port number (1-65535)." >&2
    HOST_PORT="$DEFAULT_PORT"
  fi
done

# --- replace any previous container ------------------------------------------

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  if can_prompt; then
    read -r -p "Container '$CONTAINER_NAME' already exists. Replace it? [y/N] " reply < /dev/tty
    case "$reply" in
      [yY]*) ;;
      *) echo "Aborted."; exit 1 ;;
    esac
  fi
  echo "Removing existing container '$CONTAINER_NAME'..."
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

# --- build and run ------------------------------------------------------------

echo "Building $IMAGE_NAME..."
docker build -t "$IMAGE_NAME" .

echo "Starting $CONTAINER_NAME on port $HOST_PORT (env: $ENV_FILE)..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  --restart unless-stopped \
  -p "${HOST_PORT}:3000" \
  "$IMAGE_NAME"

echo
echo "Running at http://localhost:${HOST_PORT}"
echo "Logs:  docker logs -f $CONTAINER_NAME"
echo "Stop:  docker stop $CONTAINER_NAME"
