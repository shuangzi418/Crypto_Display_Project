#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${AUTO_REDEPLOY_ROOT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LOCK_DIR="${AUTO_REDEPLOY_LOCK_DIR:-$ROOT_DIR/.deploy/auto-redeploy.lock}"

CHECK_ONLY=false
FORCE=false
SERVICES=()
CHANGED_FILES=()
DEPLOY_SCOPE='none'
RUN_INIT_DB=false
RUN_HEALTHCHECK=false

usage() {
  cat <<'EOF'
Usage: auto-redeploy.sh [--check-only] [--force]

  --check-only  Only fetch and report whether updates are pending.
  --force       Run redeploy even if HEAD already matches upstream.
EOF
}

log() {
  printf '[AUTO-REDEPLOY] %s %s\n' "$(date '+%F %T%z')" "$1"
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

add_service() {
  local service="$1"
  local existing

  for existing in "${SERVICES[@]:-}"; do
    if [[ "$existing" == "$service" ]]; then
      return 0
    fi
  done

  SERVICES+=("$service")
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

collect_changed_files() {
  mapfile -t CHANGED_FILES < <(git diff --name-only "$CURRENT_SHA..$TARGET_SHA")
}

classify_changes() {
  local file

  SERVICES=()
  DEPLOY_SCOPE='none'
  RUN_INIT_DB=false
  RUN_HEALTHCHECK=false

  for file in "${CHANGED_FILES[@]}"; do
    case "$file" in
      frontend/*)
        add_service frontend
        RUN_HEALTHCHECK=true
        ;;
      backend/*)
        add_service backend
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      admin/ruoyi-vue/ruoyi-ui/*)
        add_service ruoyi-ui
        RUN_HEALTHCHECK=true
        ;;
      admin/ruoyi-vue/sql/*)
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      admin/ruoyi-vue/*)
        add_service ruoyi-admin
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      docker-compose.yml|scripts/deploy/init-db.sh|scripts/deploy/healthcheck.sh|scripts/deploy/install.sh|scripts/deploy/update.sh)
        DEPLOY_SCOPE='full'
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      frontend/Dockerfile)
        add_service frontend
        RUN_HEALTHCHECK=true
        ;;
      backend/Dockerfile)
        add_service backend
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      admin/ruoyi-vue/ruoyi-admin/Dockerfile)
        add_service ruoyi-admin
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
      admin/ruoyi-vue/ruoyi-ui/Dockerfile)
        add_service ruoyi-ui
        RUN_HEALTHCHECK=true
        ;;
      docs/*|README.md|scripts/deploy/systemd/*|.gitattributes|.gitignore|.editorconfig)
        ;;
      *)
        DEPLOY_SCOPE='full'
        RUN_INIT_DB=true
        RUN_HEALTHCHECK=true
        ;;
    esac
  done

  if [[ "$DEPLOY_SCOPE" != 'full' ]]; then
    if (( ${#SERVICES[@]} > 0 )); then
      DEPLOY_SCOPE='services'
    elif [[ "$RUN_INIT_DB" == true || "$RUN_HEALTHCHECK" == true ]]; then
      DEPLOY_SCOPE='maintenance'
    fi
  fi

  if [[ "$FORCE" == true && "$DEPLOY_SCOPE" == 'none' ]]; then
    DEPLOY_SCOPE='full'
    RUN_INIT_DB=true
    RUN_HEALTHCHECK=true
  fi
}

log_change_plan() {
  if (( ${#CHANGED_FILES[@]} > 0 )); then
    log "Changed files: ${CHANGED_FILES[*]}"
  fi

  case "$DEPLOY_SCOPE" in
    full)
      log 'Deploy scope: full stack rebuild'
      ;;
    services)
      log "Deploy scope: services -> ${SERVICES[*]}"
      ;;
    maintenance)
      log 'Deploy scope: maintenance only (no service rebuild)'
      ;;
    none)
      log 'Deploy scope: source update only; no runtime changes detected.'
      ;;
  esac
}

run_default_deploy() {
  case "$DEPLOY_SCOPE" in
    full)
      log 'Rebuilding and restarting full compose stack'
      docker compose up -d --build
      ;;
    services)
      log "Rebuilding and restarting services: ${SERVICES[*]}"
      docker compose up -d --no-deps --build "${SERVICES[@]}"
      ;;
    maintenance|none)
      log 'Skipping compose rebuild for this update'
      ;;
  esac

  if [[ "$RUN_INIT_DB" == true ]]; then
    log 'Running database initialization'
    bash "$ROOT_DIR/scripts/deploy/init-db.sh"
  fi

  if [[ "$RUN_HEALTHCHECK" == true ]]; then
    log 'Running deployment health checks'
    bash "$ROOT_DIR/scripts/deploy/healthcheck.sh"
  fi
}

run_deploy() {
  export AUTO_REDEPLOY_DEPLOY_SCOPE="$DEPLOY_SCOPE"
  export AUTO_REDEPLOY_SERVICES="$(IFS=,; printf '%s' "${SERVICES[*]}")"
  export AUTO_REDEPLOY_RUN_INIT_DB="$RUN_INIT_DB"
  export AUTO_REDEPLOY_RUN_HEALTHCHECK="$RUN_HEALTHCHECK"

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

  collect_changed_files
  classify_changes
  log_change_plan

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

  if [[ "$DEPLOY_SCOPE" == 'none' ]]; then
    log 'Source updated without runtime-impacting changes; skipping redeploy.'
    exit 0
  fi

  run_deploy
  log 'Auto redeploy finished successfully.'
}

main "$@"
