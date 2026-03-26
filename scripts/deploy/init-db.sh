#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

MYSQL_DATABASE="${MYSQL_DATABASE:-crypto_quiz}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root123456}"

run_mysql_query() {
  docker compose exec -T mysql mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -Nse "$1" "$MYSQL_DATABASE"
}

run_mysql_file() {
  local file="$1"
  docker compose exec -T mysql sh -c "mysql --default-character-set=utf8mb4 -uroot -p\"$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\" < \"$file\""
}

main() {
  cd "$ROOT_DIR"

  local has_sys_user
  has_sys_user="$(run_mysql_query "select count(*) from information_schema.tables where table_schema='${MYSQL_DATABASE}' and table_name='sys_user';")"
  if [[ "$has_sys_user" == "0" ]]; then
    printf '[INIT] 导入 RuoYi 系统表\n'
    run_mysql_file /docker-entrypoint-initdb.d/01-ruoyi.sql
  fi

  printf '[INIT] 应用后台裁剪与菜单角色脚本\n'
  run_mysql_file /docker-entrypoint-initdb.d/02-ruoyi-cleanup.sql
  run_mysql_file /docker-entrypoint-initdb.d/03-ruoyi-menu.sql
  run_mysql_file /docker-entrypoint-initdb.d/04-ruoyi-roles.sql
}

main "$@"
