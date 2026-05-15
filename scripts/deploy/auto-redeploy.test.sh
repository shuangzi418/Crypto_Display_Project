#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WRAPPER="$REPO_ROOT/scripts/deploy/auto-redeploy.sh"

PASS_COUNT=0

assert_eq() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  if [[ "$expected" != "$actual" ]]; then
    printf 'ASSERT FAILED: %s\nExpected: %s\nActual:   %s\n' "$message" "$expected" "$actual" >&2
    exit 1
  fi
}

assert_file_missing() {
  local path="$1"
  local message="$2"

  if [[ -e "$path" ]]; then
    printf 'ASSERT FAILED: %s\nUnexpected file: %s\n' "$message" "$path" >&2
    exit 1
  fi
}

assert_file_exists() {
  local path="$1"
  local message="$2"

  if [[ ! -e "$path" ]]; then
    printf 'ASSERT FAILED: %s\nMissing file: %s\n' "$message" "$path" >&2
    exit 1
  fi
}

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '[PASS] %s\n' "$1"
}

assert_contains() {
  local needle="$1"
  local file="$2"
  local message="$3"

  if ! grep -q "$needle" "$file"; then
    printf 'ASSERT FAILED: %s\nMissing pattern: %s\nFile: %s\n' "$message" "$needle" "$file" >&2
    exit 1
  fi
}

create_fixture() {
  local base_dir="$1"
  local origin_dir="$base_dir/origin.git"
  local work_dir="$base_dir/work"
  local author_dir="$base_dir/author"

  git init --bare --initial-branch=main "$origin_dir" >/dev/null 2>&1
  git clone "$origin_dir" "$work_dir" >/dev/null 2>&1

  (
    cd "$work_dir"
    git config user.name 'Auto Redeploy Test'
    git config user.email 'auto-redeploy@example.com'
    mkdir -p scripts/deploy
    cat > deploy-stub.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
log_file="${AUTO_REDEPLOY_LOG_FILE:-.auto-deploy.log}"
mkdir -p "$(dirname "$log_file")"
printf 'scope=%s;services=%s;initdb=%s;healthcheck=%s\n' "${AUTO_REDEPLOY_DEPLOY_SCOPE:-}" "${AUTO_REDEPLOY_SERVICES:-}" "${AUTO_REDEPLOY_RUN_INIT_DB:-}" "${AUTO_REDEPLOY_RUN_HEALTHCHECK:-}" >> "$log_file"
EOF
    chmod +x deploy-stub.sh
    cat > deploy-hold.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
log_file="${AUTO_REDEPLOY_LOG_FILE:-.auto-deploy.log}"
mkdir -p "$(dirname "$log_file")"
printf 'hold\n' >> "$log_file"
sleep 2
EOF
    chmod +x deploy-hold.sh
    cat > deploy-fail.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
log_file="${AUTO_REDEPLOY_LOG_FILE:-.auto-deploy.log}"
mkdir -p "$(dirname "$log_file")"
printf 'fail\n' >> "$log_file"
exit 1
EOF
    chmod +x deploy-fail.sh
    cat > scripts/deploy/init-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
:
EOF
    chmod +x scripts/deploy/init-db.sh
    cat > scripts/deploy/healthcheck.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
:
EOF
    chmod +x scripts/deploy/healthcheck.sh
    echo 'initial' > README.md
    git add README.md deploy-stub.sh deploy-hold.sh deploy-fail.sh scripts/deploy/init-db.sh scripts/deploy/healthcheck.sh
    git commit -m 'init fixture' >/dev/null 2>&1
    git push -u origin main >/dev/null 2>&1
  )

  git clone "$origin_dir" "$author_dir" >/dev/null 2>&1
  (
    cd "$author_dir"
    git config user.name 'Auto Redeploy Author'
    git config user.email 'auto-redeploy-author@example.com'
  )

  printf '%s\n%s\n%s\n' "$origin_dir" "$work_dir" "$author_dir"
}

advance_upstream() {
  local author_dir="$1"
  local message="$2"
  local file_path="${3:-CHANGELOG.md}"

  (
    cd "$author_dir"
    mkdir -p "$(dirname "$file_path")"
    printf '%s\n' "$message" >> "$file_path"
    git add "$file_path"
    git commit -m "$message" >/dev/null 2>&1
    git push >/dev/null 2>&1
  )
}

test_no_upstream_change() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER"

  assert_file_missing "$work_dir/.auto-deploy.log" 'No-op run should not redeploy'
  record_pass 'no upstream change skips redeploy'
}

test_upstream_change_redeploys_once() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"

  advance_upstream "$author_dir" 'advance frontend once' 'frontend/src/App.js'

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER"

  assert_file_exists "$work_dir/.auto-deploy.log" 'Deploy log should exist after upstream change'
  assert_eq 'scope=services;services=frontend;initdb=false;healthcheck=true' "$(tr -d '\r' < "$work_dir/.auto-deploy.log" | head -n 1)" 'Frontend-only change should target frontend service only'
  assert_eq "$(git -C "$work_dir" rev-parse HEAD)" "$(git -C "$work_dir" rev-parse origin/main)" 'Worktree should fast-forward to origin/main'
  record_pass 'upstream change triggers single redeploy'
}

test_docs_only_change_skips_runtime_redeploy() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"

  advance_upstream "$author_dir" 'advance docs only once' 'docs/deploy/auto-redeploy.md'

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER"

  assert_eq "$(git -C "$work_dir" rev-parse HEAD)" "$(git -C "$work_dir" rev-parse origin/main)" 'Docs-only update should still fast-forward local HEAD'
  assert_file_missing "$work_dir/.auto-deploy.log" 'Docs-only update must not trigger runtime deploy command'
  record_pass 'docs-only change skips runtime redeploy'
}

test_dirty_worktree_aborts() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"

  printf 'dirty\n' >> "$work_dir/README.md"

  if AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER" >/dev/null 2>&1; then
    printf 'ASSERT FAILED: dirty worktree should abort\n' >&2
    exit 1
  fi

  assert_file_missing "$work_dir/.auto-deploy.log" 'Dirty worktree must not run deploy command'
  record_pass 'dirty worktree aborts safely'
}

test_check_only_is_read_only() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"

  advance_upstream "$author_dir" 'advance upstream for check only' 'frontend/src/App.js'
  local before_head
  before_head="$(git -C "$work_dir" rev-parse HEAD)"

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER" --check-only >/dev/null

  assert_eq "$before_head" "$(git -C "$work_dir" rev-parse HEAD)" 'Check-only must not fast-forward local HEAD'
  assert_file_missing "$work_dir/.auto-deploy.log" 'Check-only must not run deploy command'
  record_pass 'check-only mode is read-only'
}

test_force_runs_without_upstream_change() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER" --force >/dev/null

  assert_file_exists "$work_dir/.auto-deploy.log" 'Force mode should run deploy command even without upstream change'
  assert_eq 'scope=full;services=;initdb=true;healthcheck=true' "$(tr -d '\r' < "$work_dir/.auto-deploy.log" | head -n 1)" 'Force mode should trigger full deploy when no path-based runtime change exists'
  record_pass 'force mode triggers redeploy'
}

test_concurrent_second_run_exits_cleanly() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local output_file="$tmp_dir/second-run.log"

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-hold.sh' bash "$WRAPPER" --force >/dev/null 2>&1 &
  local first_pid=$!
  sleep 1

  AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-hold.sh' bash "$WRAPPER" --force >"$output_file" 2>&1

  wait "$first_pid"

  local hold_count
  hold_count="$(grep -c '^hold$' "$work_dir/.auto-deploy.log")"
  assert_eq '1' "$hold_count" 'Concurrent second run must not execute deploy command twice'
  grep -q 'already in progress' "$output_file"
  record_pass 'concurrent second run exits cleanly'
}

test_failed_sha_is_not_retried_automatically() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"
  local second_run_log="$tmp_dir/second-run.log"
  local fail_log="$tmp_dir/fail.log"

  advance_upstream "$author_dir" 'advance frontend failing attempt' 'frontend/src/App.js'

  if AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$fail_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-fail.sh' bash "$WRAPPER" >/dev/null 2>&1; then
    printf 'ASSERT FAILED: failing deploy should return non-zero\n' >&2
    exit 1
  fi

  assert_contains "$(git -C "$work_dir" rev-parse origin/main)" "$work_dir/.git/auto-redeploy/last-failed-sha" 'Failed deploy should record failing upstream SHA'

  if ! AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$fail_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-fail.sh' bash "$WRAPPER" >"$second_run_log" 2>&1; then
    printf 'ASSERT FAILED: second run on the same failed SHA should skip cleanly\n' >&2
    exit 1
  fi

  assert_eq '1' "$(grep -c '^fail$' "$fail_log")" 'Same failed SHA must not be retried automatically'
  assert_contains 'Skipping redeploy for previously failed upstream SHA' "$second_run_log" 'Second run should skip the same failed SHA'
  record_pass 'failed SHA is not retried automatically'
}

test_force_retries_failed_sha() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"
  local fail_log="$tmp_dir/fail.log"

  advance_upstream "$author_dir" 'advance frontend failing force retry' 'frontend/src/App.js'

  if AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$fail_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-fail.sh' bash "$WRAPPER" >/dev/null 2>&1; then
    printf 'ASSERT FAILED: failing deploy should return non-zero\n' >&2
    exit 1
  fi

  if AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$fail_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-fail.sh' bash "$WRAPPER" --force >/dev/null 2>&1; then
    printf 'ASSERT FAILED: forced retry should still return non-zero with failing deploy command\n' >&2
    exit 1
  fi

  assert_eq '2' "$(grep -c '^fail$' "$fail_log")" 'Force mode should retry the same failed SHA'
  record_pass 'force mode retries failed SHA'
}

test_new_sha_retries_after_previous_failure() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  mapfile -t fixture < <(create_fixture "$tmp_dir")
  local work_dir="${fixture[1]}"
  local author_dir="${fixture[2]}"
  local fail_log="$tmp_dir/fail.log"
  local success_log="$tmp_dir/success.log"

  advance_upstream "$author_dir" 'advance frontend failing once' 'frontend/src/App.js'

  if AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$fail_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-fail.sh' bash "$WRAPPER" >/dev/null 2>&1; then
    printf 'ASSERT FAILED: failing deploy should return non-zero\n' >&2
    exit 1
  fi

  advance_upstream "$author_dir" 'advance frontend succeeding after failure' 'frontend/src/App.js'

  if ! AUTO_REDEPLOY_ROOT_DIR="$work_dir" AUTO_REDEPLOY_LOG_FILE="$success_log" AUTO_REDEPLOY_DEPLOY_CMD='./deploy-stub.sh' bash "$WRAPPER" >/dev/null; then
    printf 'ASSERT FAILED: new upstream SHA should be attempted successfully after previous failure\n' >&2
    exit 1
  fi

  assert_eq 'fail' "$(tr -d '\r' < "$fail_log" | sed -n '1p')" 'First attempt should be recorded as failure'
  assert_eq 'scope=services;services=frontend;initdb=false;healthcheck=true' "$(tr -d '\r' < "$success_log" | sed -n '1p')" 'A newer upstream SHA should be attempted normally'
  assert_file_missing "$work_dir/.git/auto-redeploy/last-failed-sha" 'Successful redeploy should clear failed SHA marker'
  record_pass 'new upstream SHA retries after previous failure'
}

main() {
  test_no_upstream_change
  test_upstream_change_redeploys_once
  test_docs_only_change_skips_runtime_redeploy
  test_dirty_worktree_aborts
  test_check_only_is_read_only
  test_force_runs_without_upstream_change
  test_concurrent_second_run_exits_cleanly
  test_failed_sha_is_not_retried_automatically
  test_force_retries_failed_sha
  test_new_sha_retries_after_previous_failure
  printf '\n[PASS] All %d auto-redeploy contract tests passed.\n' "$PASS_COUNT"
}

main "$@"
