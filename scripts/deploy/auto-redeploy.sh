#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${AUTO_REDEPLOY_ROOT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LOCK_DIR="${AUTO_REDEPLOY_LOCK_DIR:-$ROOT_DIR/.deploy/auto-redeploy.lock}"

CHECK_ONLY=false
FORCE=false

usage() {
  cat <<'EOF'
Usage: auto-redeploy.sh [--check-only] [--force]

  --check-only  Only fetch and report whether updates are pending.
  --force       Run redeploy even if HEAD already matches upstream.
EOF
}

log() {
  printf '[AUTO-REDEPLOY] %s\n' "$1"
}

cleanup_lock() {
  rm -rf "$LOCK_DIR"
}

acquire_lock() {
  mkdir -p "$(dirname "$LOCK_DIR")"

  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    log 'Another redeploy run is already in progress; exiting.'
    exit 0
  fi

  trap cleanup_lock EXIT INT TERM
}

parse_args() {
  while (( "$#" )); do
    case "$1" in
      --check-only)
        CHECK_ONLY=true
        ;;
      --force)
        FORCE=true
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown argument: %s\n' "$1" >&2
        usage >&2
        exit 1
        ;;
    esac
    shift
  done
}

require_clean_worktree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    printf 'Working tree is dirty; aborting auto redeploy.\n' >&2
    exit 1
  fi
}

resolve_upstream() {
  if [[ -n "${AUTO_REDEPLOY_UPSTREAM:-}" ]]; then
    printf '%s' "$AUTO_REDEPLOY_UPSTREAM"
    return 0
  fi

  git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null
}

update_worktree() {
  if [[ "$CURRENT_SHA" != "$TARGET_SHA" ]]; then
    log "Fast-forwarding to $UPSTREAM_REF"
    git pull --ff-only
  else
    log 'HEAD already matches upstream; skipping pull.'
  fi
}

run_default_deploy() {
  log 'Rebuilding and restarting compose stack'
  docker compose up -d --build

  log 'Running database initialization'
  bash "$ROOT_DIR/scripts/deploy/init-db.sh"

  log 'Running deployment health checks'
  bash "$ROOT_DIR/scripts/deploy/healthcheck.sh"
}

run_deploy() {
  if [[ -n "${AUTO_REDEPLOY_DEPLOY_CMD:-}" ]]; then
    log 'Running custom deploy command'
    bash -lc "$AUTO_REDEPLOY_DEPLOY_CMD"
    return 0
  fi

  run_default_deploy
}

main() {
  parse_args "$@"
  acquire_lock

  cd "$ROOT_DIR"

  UPSTREAM_REF="$(resolve_upstream)"
  if [[ -z "$UPSTREAM_REF" ]]; then
    printf 'No upstream branch configured; aborting auto redeploy.\n' >&2
    exit 1
  fi

  require_clean_worktree

  log 'Fetching latest upstream refs'
  git fetch --prune

  CURRENT_SHA="$(git rev-parse HEAD)"
  TARGET_SHA="$(git rev-parse "$UPSTREAM_REF")"

  if [[ "$CHECK_ONLY" == true ]]; then
    if [[ "$CURRENT_SHA" == "$TARGET_SHA" ]]; then
      log 'No upstream changes detected.'
    else
      log "Upstream update available: $CURRENT_SHA -> $TARGET_SHA"
    fi
    exit 0
  fi

  if [[ "$FORCE" != true && "$CURRENT_SHA" == "$TARGET_SHA" ]]; then
    log 'No upstream changes detected; skipping redeploy.'
    exit 0
  fi

  update_worktree
  run_deploy
  log 'Auto redeploy finished successfully.'
}

main "$@"
