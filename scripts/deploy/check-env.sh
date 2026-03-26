#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

print_ok() {
  printf '[OK] %s\n' "$1"
}

print_warn() {
  printf '[WARN] %s\n' "$1"
}

print_fail() {
  printf '[FAIL] %s\n' "$1" >&2
}

require_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    print_fail '当前部署脚本仅支持 Linux 服务器。'
    exit 1
  fi
  print_ok "检测到 Linux 系统 ($(uname -m))"
}

check_command() {
  local cmd="$1"
  local tip="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    print_ok "已找到命令: $cmd"
  else
    print_warn "$cmd 不存在，$tip"
  fi
}

check_resource() {
  local mem_mb disk_mb
  mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
  disk_mb="$(df -Pm "$ROOT_DIR" | awk 'NR==2 {print $4}')"

  if (( mem_mb < 2048 )); then
    print_warn "系统内存仅 ${mem_mb}MB，建议至少 2GB。"
  else
    print_ok "系统内存 ${mem_mb}MB"
  fi

  if (( disk_mb < 4096 )); then
    print_warn "可用磁盘仅 ${disk_mb}MB，建议至少 4GB。"
  else
    print_ok "可用磁盘 ${disk_mb}MB"
  fi
}

check_ports() {
  local ports=(80 5000 8080 8081)
  for port in "${ports[@]}"; do
    if ss -ltn "( sport = :$port )" | grep -q ":$port"; then
      print_warn "端口 $port 已被占用，部署前请确认是否冲突。"
    else
      print_ok "端口 $port 当前空闲"
    fi
  done
}

check_docker() {
  if command -v docker >/dev/null 2>&1; then
    print_ok "Docker 已安装"
  else
    print_warn 'Docker 未安装，可执行 install.sh 自动安装。'
  fi

  if docker compose version >/dev/null 2>&1; then
    print_ok 'Docker Compose 插件可用'
  else
    print_warn 'Docker Compose 插件不可用，可执行 install.sh 自动安装。'
  fi
}

main() {
  require_linux
  check_command curl 'install.sh 会自动安装。'
  check_command git '安装 git 后再使用 clone 拉取仓库。'
  check_resource
  check_ports
  check_docker
}

main "$@"
