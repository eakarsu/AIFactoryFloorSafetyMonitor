#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$project_root/.env" ]]; then
  echo "Missing .env. Copy .env.example and set real secrets." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$project_root/.env"
set +a

if [[ ! -d "$project_root/backend/node_modules" || ! -d "$project_root/frontend/node_modules" ]]; then
  echo "Dependencies are absent. Run ./scripts/bootstrap.sh explicitly." >&2
  exit 1
fi

for port in "${BACKEND_PORT:-4000}" "${FRONTEND_PORT:-3000}"; do
  ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "Port $port is already in use; refusing to terminate its owner." >&2; exit 1; }
done
if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  (cd "$project_root/backend" && node src/scripts/runtime-init.js)
fi

backend_pid=""
frontend_pid=""
cleanup() {
  [[ -n "$backend_pid" ]] && kill "$backend_pid" 2>/dev/null || true
  [[ -n "$frontend_pid" ]] && kill "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$project_root/backend" && npm start) &
backend_pid=$!
(cd "$project_root/frontend" && VITE_PROXY_TARGET="http://127.0.0.1:${BACKEND_PORT:-4000}" npm run dev -- --host "${HOST:-127.0.0.1}" --port "${FRONTEND_PORT:-3000}") &
frontend_pid=$!

echo "Started project-owned processes only: backend=$backend_pid frontend=$frontend_pid"
wait "$backend_pid" "$frontend_pid"
