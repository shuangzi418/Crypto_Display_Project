#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_TEMPLATE="$ROOT_DIR/.env.docker.example"
ENV_FILE="$ROOT_DIR/.env"

print_step() {
  printf '\n==> %s\n' "$1"
}

require_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    echo '当前安装脚本仅支持 Linux 服务器。' >&2
    exit 1
  fi
}

as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

pkg_install() {
  if command -v apt-get >/dev/null 2>&1; then
    as_root apt-get update -y
    as_root apt-get install -y "$@"
  elif command -v dnf >/dev/null 2>&1; then
    as_root dnf install -y "$@"
  elif command -v yum >/dev/null 2>&1; then
    as_root yum install -y "$@"
  else
    echo '未识别的包管理器，请手动安装依赖。' >&2
    exit 1
  fi
}

ensure_base_tools() {
  local missing=()
  for cmd in curl git; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done
  if (( ${#missing[@]} )); then
    print_step "安装基础工具: ${missing[*]}"
    pkg_install "${missing[@]}"
  fi
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    print_step '安装 Docker'
    curl -fsSL https://get.docker.com | as_root sh
  fi

  if command -v systemctl >/dev/null 2>&1; then
    as_root systemctl enable docker
    as_root systemctl restart docker
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo 'Docker Compose 插件不可用，请检查 Docker 安装。' >&2
    exit 1
  fi
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48
  fi
}

server_ip() {
  hostname -I 2>/dev/null | awk '{print $1}'
}

public_scheme() {
  if [[ "$(current_env_value ENABLE_HTTPS)" == "true" ]]; then
    printf 'https'
  else
    printf 'http'
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

current_env_value() {
  local key="$1"
  if grep -q "^${key}=" "$ENV_FILE"; then
    grep "^${key}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-
  else
    printf ''
  fi
}

ensure_env_value() {
  local key="$1"
  local desired="$2"
  local current
  current="$(current_env_value "$key")"
  if [[ -z "$current" ]]; then
    set_env_value "$key" "$desired"
  fi
}

ensure_secret_value() {
  local key="$1"
  shift
  local current
  current="$(current_env_value "$key")"
  if [[ -z "$current" ]]; then
    set_env_value "$key" "$(random_secret)"
    return
  fi
  for placeholder in "$@"; do
    if [[ "$current" == "$placeholder" ]]; then
      set_env_value "$key" "$(random_secret)"
      return
    fi
  done
}

prepare_env_file() {
  print_step '准备部署环境变量'
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
  fi

  ensure_env_value ENABLE_HOST_NGINX false
  ensure_env_value ENABLE_HTTPS false
  ensure_env_value APP_DOMAIN ""
  ensure_env_value ADMIN_DOMAIN ""
  ensure_env_value H5_DOMAIN ""
  ensure_env_value LETSENCRYPT_EMAIL ""
  ensure_env_value H5_MYSQL_DATABASE crypto_quiz_h5
  ensure_env_value H5_MYSQL_USER crypto_h5_user
  ensure_env_value H5_DB_ADMIN_USER root
  ensure_env_value REACT_APP_H5_HOSTS ""
  ensure_env_value FRONTEND_BIND_ADDRESS 0.0.0.0
  ensure_env_value BACKEND_BIND_ADDRESS 0.0.0.0
  ensure_env_value RUOYI_ADMIN_BIND_ADDRESS 0.0.0.0
  ensure_env_value RUOYI_UI_BIND_ADDRESS 0.0.0.0

  local host_ip frontend_url admin_url h5_url cors_origin h5_hosts scheme app_domain admin_domain h5_domain
  host_ip="$(server_ip)"
  scheme="$(public_scheme)"
  app_domain="$(current_env_value APP_DOMAIN)"
  admin_domain="$(current_env_value ADMIN_DOMAIN)"
  h5_domain="$(current_env_value H5_DOMAIN)"
  frontend_url="${scheme}://${host_ip:-127.0.0.1}"
  admin_url="${scheme}://${host_ip:-127.0.0.1}:8081"
  h5_url=""
  h5_hosts=""

  if [[ -n "$app_domain" ]]; then
    frontend_url="${scheme}://${app_domain}"
  fi

  if [[ -n "$admin_domain" ]]; then
    admin_url="${scheme}://${admin_domain}"
  fi

  if [[ -n "$h5_domain" ]]; then
    h5_url="${scheme}://${h5_domain}"
    h5_hosts="$h5_domain"
  fi

  cors_origin="$frontend_url,$admin_url"
  if [[ -n "$h5_url" ]]; then
    cors_origin="$cors_origin,$h5_url"
  fi

  ensure_secret_value JWT_SECRET replace_with_a_strong_secret change_this_jwt_secret
  ensure_secret_value H5_JWT_SECRET replace_with_h5_jwt_secret change_this_h5_jwt_secret
  ensure_secret_value RUOYI_TOKEN_SECRET replace_with_another_strong_secret change_this_ruoyi_secret
  ensure_secret_value MYSQL_ROOT_PASSWORD root123456
  ensure_secret_value MYSQL_PASSWORD crypto_pass
  ensure_secret_value H5_MYSQL_PASSWORD replace_with_h5_db_password crypto_h5_pass
  ensure_secret_value ADMIN_PASSWORD change_this_password change_this_admin_password
  set_env_value FRONTEND_URL "$frontend_url"
  set_env_value CORS_ORIGIN "$cors_origin"
  set_env_value REACT_APP_ADMIN_PORTAL_URL "$admin_url"
  set_env_value REACT_APP_H5_HOSTS "$h5_hosts"
  ensure_env_value RUOYI_API_DOCS_ENABLED false
  ensure_env_value RUOYI_SWAGGER_UI_ENABLED false

  if [[ "$(current_env_value ENABLE_HOST_NGINX)" == "true" ]]; then
    set_env_value FRONTEND_BIND_ADDRESS 127.0.0.1
    set_env_value BACKEND_BIND_ADDRESS 127.0.0.1
    set_env_value RUOYI_ADMIN_BIND_ADDRESS 127.0.0.1
    if [[ "$(current_env_value FRONTEND_PORT)" == "80" || -z "$(current_env_value FRONTEND_PORT)" ]]; then
      set_env_value FRONTEND_PORT 3000
    fi
    if [[ -n "$(current_env_value ADMIN_DOMAIN)" ]]; then
      set_env_value RUOYI_UI_BIND_ADDRESS 127.0.0.1
    else
      set_env_value RUOYI_UI_BIND_ADDRESS 0.0.0.0
    fi
  fi
}

deploy_stack() {
  print_step '构建并启动容器'
  cd "$ROOT_DIR"
  docker compose up -d --build
}

run_healthcheck() {
  print_step '执行健康检查'
  bash "$ROOT_DIR/scripts/deploy/healthcheck.sh"
}

configure_nginx_if_needed() {
  print_step '检查 Nginx 反向代理配置'
  bash "$ROOT_DIR/scripts/deploy/configure-nginx.sh"
}

print_summary() {
  local host_ip h5_summary_url
  host_ip="$(server_ip)"
  h5_summary_url="http://${host_ip:-127.0.0.1}/h5/national-security-challenge"
  if [[ -n "${H5_DOMAIN:-}" ]]; then
    h5_summary_url="$(public_scheme)://${H5_DOMAIN}"
  fi
  cat <<EOF

部署完成。

用户前台: http://${host_ip:-127.0.0.1}
Node API: http://${host_ip:-127.0.0.1}:5000/health
RuoYi 后台: http://${host_ip:-127.0.0.1}:8081/login
RuoYi 后端: http://${host_ip:-127.0.0.1}:8080/captchaImage
H5 挑战: ${h5_summary_url}

首次登录 RuoYi 后台请使用初始化账号 admin / admin123，并按提示立即修改密码。
.env 已写入到: $ENV_FILE
EOF
}

main() {
  require_linux
  bash "$ROOT_DIR/scripts/deploy/check-env.sh"
  ensure_base_tools
  ensure_docker
  prepare_env_file
  deploy_stack
  print_step '初始化数据库脚本'
  bash "$ROOT_DIR/scripts/deploy/init-db.sh"
  configure_nginx_if_needed
  run_healthcheck
  print_summary
}

main "$@"
