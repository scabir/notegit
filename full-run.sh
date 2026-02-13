#!/usr/bin/env bash
set -euo pipefail

run_step() {
  local label="$1"
  shift

  printf '%s\n' "--------------"
  printf '%s\n' "-- ${label} --"
  printf '%s\n' "--------------"
  "$@"
  printf '\n'
}

run_step "pnpm install" pnpm install
run_step "pnpm run format" pnpm run format
run_step "pnpm run format:check" pnpm run format:check
run_step "pnpm lint" pnpm lint
run_step "pnpm run build" pnpm run build
run_step "pnpm test:coverage" pnpm test:coverage
run_step "pnpm start" pnpm start
