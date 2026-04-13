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
H5_MYSQL_DATABASE="${H5_MYSQL_DATABASE:-crypto_quiz_h5}"
H5_MYSQL_USER="${H5_MYSQL_USER:-crypto_h5_user}"
H5_MYSQL_PASSWORD="${H5_MYSQL_PASSWORD:-crypto_h5_pass}"

run_mysql_query() {
  docker compose exec -T mysql mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -Nse "$1" "$MYSQL_DATABASE"
}

run_mysql_file() {
  local file="$1"
  docker compose exec -T mysql sh -c "mysql --default-character-set=utf8mb4 -uroot -p\"$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\" < \"$file\""
}

ensure_h5_database() {
  local sql
  read -r -d '' sql <<SQL || true
create database if not exists \`${H5_MYSQL_DATABASE}\` character set utf8mb4 collate utf8mb4_unicode_ci;
create user if not exists '${H5_MYSQL_USER}'@'%' identified by '${H5_MYSQL_PASSWORD}';
alter user '${H5_MYSQL_USER}'@'%' identified by '${H5_MYSQL_PASSWORD}';
grant all privileges on \`${H5_MYSQL_DATABASE}\`.* to '${H5_MYSQL_USER}'@'%';
flush privileges;
SQL
  docker compose exec -T mysql mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" -Nse "$sql"
}

repair_text_encoding() {
  local sql
  read -r -d '' sql <<'SQL' || true
update sys_menu set menu_name = '权限管理' where menu_id = 1;
update sys_menu set menu_name = '管理员账号' where menu_id = 100;
update sys_menu set menu_name = '权限角色' where menu_id = 101;
update sys_menu set menu_name = '菜单权限' where menu_id = 102;
update sys_menu set menu_name = '竞赛运营' where menu_id = 2000;
update sys_menu set menu_name = '题目管理' where menu_id = 2001;
update sys_menu set menu_name = '竞赛管理' where menu_id = 2002;
update sys_menu set menu_name = '业务用户' where menu_id = 2003;
update sys_menu set menu_name = '昵称审核' where menu_id = 2004;
update sys_menu set menu_name = '头像审核' where menu_id = 2005;
update sys_menu set menu_name = '排行榜展示' where menu_id = 2006;
update sys_menu set menu_name = '数据管理' where menu_id = 2007;
update sys_role set role_name = '超级管理员' where role_id = 1;
update sys_role set role_name = '普通角色' where role_id = 2;
update sys_role set role_name = '竞赛平台管理员' where role_key = 'platform_super_admin';
update sys_role set role_name = '题库管理员' where role_key = 'question_admin';
update sys_role set role_name = '竞赛管理员' where role_key = 'competition_admin';
update sys_role set role_name = '审核管理员' where role_key = 'audit_admin';
update sys_dict_type set dict_name = '菜单状态' where dict_type = 'sys_show_hide';
update sys_dict_type set dict_name = '系统开关' where dict_type = 'sys_normal_disable';
update sys_dict_data set dict_label = '显示' where dict_type = 'sys_show_hide' and dict_value = '0';
update sys_dict_data set dict_label = '隐藏' where dict_type = 'sys_show_hide' and dict_value = '1';
update sys_dict_data set dict_label = '正常' where dict_type = 'sys_normal_disable' and dict_value = '0';
update sys_dict_data set dict_label = '停用' where dict_type = 'sys_normal_disable' and dict_value = '1';
update sys_user set nick_name = '平台管理员' where user_name = 'admin';
update sys_user set nick_name = '演示账号' where user_name = 'ry';
SQL
  run_mysql_query "$sql" >/dev/null
}

main() {
  cd "$ROOT_DIR"
  printf '[INIT] 创建 H5 独立用户数据库\n'
  ensure_h5_database

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
  printf '[INIT] 修正常用中文展示文本\n'
  repair_text_encoding
}

main "$@"
