#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

FRONTEND_PORT="${FRONTEND_PORT:-80}"
RUOYI_UI_PORT="${RUOYI_UI_PORT:-8081}"
RUOYI_ADMIN_PORT="${RUOYI_ADMIN_PORT:-8080}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root123456}"

check_url() {
  local name="$1"
  local url="$2"
  printf '[CHECK] %s -> %s\n' "$name" "$url"
  curl --fail --silent --show-error "$url" >/dev/null
}

main() {
  cd "$ROOT_DIR"
  docker compose ps >/dev/null
  docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" >/dev/null
  docker compose exec -T redis redis-cli ping | grep -q PONG

  check_url 'frontend' "http://127.0.0.1:${FRONTEND_PORT}/"
  check_url 'backend health' 'http://127.0.0.1:5000/health'
  check_url 'ruoyi login page' "http://127.0.0.1:${RUOYI_UI_PORT}/login"
  check_url 'ruoyi captcha' "http://127.0.0.1:${RUOYI_ADMIN_PORT}/captchaImage"

  printf '[OK] 所有核心服务均已通过健康检查。\n'
}

main "$@"
