#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

main() {
  cd "$ROOT_DIR"
  git pull --ff-only
  bash "$ROOT_DIR/scripts/deploy/install.sh"
}

main "$@"
