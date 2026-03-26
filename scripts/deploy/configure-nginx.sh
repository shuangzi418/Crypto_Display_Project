#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
NGINX_SITE_NAME="cryptoquiz.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

install_nginx_stack() {
  if command -v apt-get >/dev/null 2>&1; then
    as_root apt-get update -y
    as_root apt-get install -y nginx certbot python3-certbot-nginx
  elif command -v dnf >/dev/null 2>&1; then
    as_root dnf install -y nginx certbot python3-certbot-nginx
  elif command -v yum >/dev/null 2>&1; then
    as_root yum install -y epel-release
    as_root yum install -y nginx certbot python3-certbot-nginx
  else
    echo '未识别的包管理器，无法自动安装 Nginx/Certbot。' >&2
    exit 1
  fi
}

is_true() {
  [[ "${1:-false}" == "true" ]]
}

is_ip() {
  [[ "$1" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]
}

render_server_block() {
  local server_name="$1"
  local upstream_port="$2"
  cat <<EOF
server {
    listen 80;
    server_name ${server_name};

    location / {
        proxy_pass http://127.0.0.1:${upstream_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

EOF
}

write_nginx_config() {
  local app_server_name admin_server_name
  app_server_name="${APP_DOMAIN:-_}"
  admin_server_name="${ADMIN_DOMAIN:-}"

  tmp_file="$(mktemp)"
  render_server_block "$app_server_name" "${FRONTEND_PORT:-3000}" >"$tmp_file"
  if [[ -n "$admin_server_name" ]]; then
    render_server_block "$admin_server_name" "${RUOYI_UI_PORT:-8081}" >>"$tmp_file"
  fi

  as_root mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  as_root cp "$tmp_file" "$NGINX_AVAILABLE"
  rm -f "$tmp_file"

  if [[ ! -e "$NGINX_ENABLED" ]]; then
    as_root ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  fi

  if [[ -e /etc/nginx/sites-enabled/default ]]; then
    as_root rm -f /etc/nginx/sites-enabled/default
  fi
}

enable_nginx_service() {
  if command -v systemctl >/dev/null 2>&1; then
    as_root systemctl enable nginx
    as_root systemctl restart nginx
  else
    as_root service nginx restart
  fi
}

configure_https() {
  if ! is_true "${ENABLE_HTTPS:-false}"; then
    return 0
  fi

  if [[ -z "${APP_DOMAIN:-}" ]] || is_ip "${APP_DOMAIN}"; then
    echo '[WARN] 未提供可签发证书的域名，跳过 HTTPS 证书申请。'
    return 0
  fi

  if [[ -z "${LETSENCRYPT_EMAIL:-}" ]]; then
    echo '[WARN] ENABLE_HTTPS=true 但未设置 LETSENCRYPT_EMAIL，跳过证书申请。'
    return 0
  fi

  local domains=(-d "$APP_DOMAIN")
  if [[ -n "${ADMIN_DOMAIN:-}" ]]; then
    domains+=(-d "$ADMIN_DOMAIN")
  fi

  as_root certbot --nginx --non-interactive --agree-tos --redirect -m "$LETSENCRYPT_EMAIL" "${domains[@]}"
}

main() {
  if ! is_true "${ENABLE_HOST_NGINX:-false}"; then
    echo '[INFO] ENABLE_HOST_NGINX=false，跳过 Nginx 配置。'
    exit 0
  fi

  install_nginx_stack
  write_nginx_config
  as_root nginx -t
  enable_nginx_service
  configure_https
  echo '[OK] Nginx 反向代理配置完成。'
}

main "$@"
