#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-dev}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${PORT:-3000}"
APP_BASE_PATH="${APP_BASE_PATH:-/celex}"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP="false"

cleanup() {
  if [[ "$CLEANED_UP" == "true" ]]; then
    return
  fi
  CLEANED_UP="true"

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

case "$MODE" in
  dev)
    BACKEND_CMD=(npm run dev)
    FRONTEND_CMD=(npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT")
    ;;
  prod)
    BACKEND_CMD=(npm run start)
    FRONTEND_CMD=(npm run preview -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT")
    ;;
  *)
    echo "Modo inválido: $MODE"
    echo "Uso: $0 [dev|prod]"
    exit 1
    ;;
esac

echo "Iniciando backend ($MODE) en puerto ${BACKEND_PORT}..."
(cd "$ROOT_DIR" && "${BACKEND_CMD[@]}") &
BACKEND_PID=$!

echo "Iniciando frontend ($MODE) en ${FRONTEND_HOST}:${FRONTEND_PORT}..."
(cd "$ROOT_DIR/frontend" && "${FRONTEND_CMD[@]}") &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "API: http://localhost:${BACKEND_PORT}${APP_BASE_PATH}"
echo "Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}${APP_BASE_PATH}/"
echo "Presiona Ctrl+C para detener ambos procesos."

set +e
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
set -e

if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Uno de los procesos finalizó con error (código $EXIT_CODE)."
else
  echo "Uno de los procesos finalizó."
fi

cleanup
wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true

exit "$EXIT_CODE"
