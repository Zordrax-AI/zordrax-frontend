#!/usr/bin/env bash
set -euo pipefail

FILE="src/lib/api.ts"
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Run from frontend-repo root."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "${FILE}.bak_dupefix_${TS}"
echo "Backup created: ${FILE}.bak_dupefix_${TS}"

python - <<'PY'
from pathlib import Path
import re

p = Path("src/lib/api.ts")
s = p.read_text(encoding="utf-8")

# Remove ONLY the later duplicate: Promise<any> version
pattern = r"""
\nexport\s+async\s+function\s+getInfraOutputs
\(\s*runId:\s*string\s*\)\s*:\s*Promise<any>\s*
\{\s*
return\s+fetchJson<any>\(\s*`/api/infra/outputs/\$\{runId\}`\s*,\s*\{\s*method:\s*"GET"\s*\}\s*\)\s*;
\s*\}\s*
"""

new_s, n = re.subn(pattern, "\n", s, flags=re.VERBOSE)

if n == 0:
  raise SystemExit("ERROR: Did not find the duplicate Promise<any> getInfraOutputs(). Nothing changed.")
if n > 1:
  raise SystemExit(f"ERROR: Found {n} matches; expected 1. Aborting to avoid deleting too much.")

p.write_text(new_s, encoding="utf-8")
print("Removed duplicate getInfraOutputs (Promise<any>) successfully.")
PY

echo ""
echo "Now restart dev server:"
echo "  (Ctrl+C) then: npm run dev"
