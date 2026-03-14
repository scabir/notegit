#!/bin/sh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$PROJECT_ROOT/../.." && pwd)"
WEBSITE_ROOT="$REPO_ROOT/app/website"
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
  run_step "pnpm run build" pnpm --dir "$PROJECT_ROOT" run build
}

run_website_checks() {
  if [ ! -d "$WEBSITE_ROOT" ]; then
    printf '%s\n' "Website project not found at $WEBSITE_ROOT" >&2
    exit 1
  fi
  run_step "pnpm run build (website)" pnpm --dir "$WEBSITE_ROOT" run build
}

get_changed_files_pre_commit() {
  git -C "$REPO_ROOT" diff --cached --name-only
}

get_changed_files_pre_push() {
  if git -C "$REPO_ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git -C "$REPO_ROOT" diff --name-only '@{u}...HEAD'
    return
  fi

  if git -C "$REPO_ROOT" rev-parse --verify origin/main >/dev/null 2>&1; then
    base_ref="$(git -C "$REPO_ROOT" merge-base HEAD origin/main)"
    git -C "$REPO_ROOT" diff --name-only "$base_ref...HEAD"
    return
  fi

  git -C "$REPO_ROOT" diff --name-only HEAD~1..HEAD 2>/dev/null || true
}

has_changes_in_prefix() {
  prefix="$1"
  if [ -z "$CHANGED_FILES" ]; then
    return 1
  fi
  printf '%s\n' "$CHANGED_FILES" | grep -Eq "^${prefix}"
}

case "$MODE" in
  pre-commit)
    CHANGED_FILES="$(get_changed_files_pre_commit | sed '/^$/d' || true)"
    ;;
  pre-push)
    CHANGED_FILES="$(get_changed_files_pre_push | sed '/^$/d' || true)"
    ;;
  *)
    printf '%s\n' "Unknown hook mode: $MODE" >&2
    printf '%s\n' "Usage: $0 [pre-commit|pre-push]" >&2
    exit 1
    ;;
esac

desktop_changed=false
website_changed=false

if has_changes_in_prefix "app/desktop/"; then
  desktop_changed=true
fi

if has_changes_in_prefix "app/website/"; then
  website_changed=true
fi

if [ "$desktop_changed" = false ] && [ "$website_changed" = false ]; then
  printf '%s\n' "No desktop/website changes detected for $MODE. Skipping hook checks."
  exit 0
fi

case "$MODE" in
  pre-commit)
    if [ "$desktop_changed" = true ]; then
      run_pre_commit_checks
    fi
    if [ "$website_changed" = true ]; then
      run_website_checks
    fi
    ;;
  pre-push)
    if [ "$desktop_changed" = true ]; then
      run_pre_push_checks
    fi
    if [ "$website_changed" = true ]; then
      run_website_checks
    fi
    ;;
esac
