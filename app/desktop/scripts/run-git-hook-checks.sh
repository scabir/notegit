#!/bin/sh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-pre-commit}"

run_step() {
  label="$1"
  shift

  printf '%s\n' "--------------"
  printf '%s\n' "-- ${label} --"
  printf '%s\n' "--------------"
  "$@"
  printf '\n'
}

run_pre_commit_checks() {
  run_step "pnpm run format:check" pnpm --dir "$PROJECT_ROOT" run format:check
  run_step "pnpm run lint" pnpm --dir "$PROJECT_ROOT" run lint
  run_step "pnpm run build" pnpm --dir "$PROJECT_ROOT" run build
}

run_pre_push_checks() {
  run_pre_commit_checks
  run_step "pnpm run test" pnpm --dir "$PROJECT_ROOT" run test
}

case "$MODE" in
  pre-commit)
    run_pre_commit_checks
    ;;
  pre-push)
    run_pre_push_checks
    ;;
  *)
    printf '%s\n' "Unknown hook mode: $MODE" >&2
    printf '%s\n' "Usage: $0 [pre-commit|pre-push]" >&2
    exit 1
    ;;
esac
