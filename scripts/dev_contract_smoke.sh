#!/usr/bin/env bash
set -euo pipefail

BASE="${NEXT_PUBLIC_AGENT_BASE_URL:-${AGENT_BASE_URL:-${ONBOARDING_BASE_URL:-}}}"
if [[ -z "$BASE" ]]; then
  echo "Missing BASE env (NEXT_PUBLIC_AGENT_BASE_URL/AGENT_BASE_URL/ONBOARDING_BASE_URL)" >&2
  exit 1
fi

TMP=$(mktemp)
curl -fsSL "$BASE/openapi.json" -o "$TMP"

missing=0
check() {
  local path="$1"
  if ! grep -q "\"$path\"" "$TMP"; then
    echo "MISSING $path"
    missing=1
  else
    echo "OK $path"
  fi
}

check "/api/brd/requirement-sets"
check "/api/brd/requirement-sets/{requirement_set_id}"
check "/api/deploy/plan"
check "/api/deploy/{run_id}/refresh"
check "/api/deploy/{run_id}/approve"
check "/runs/"

rm -f "$TMP"
exit $missing
