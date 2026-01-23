#!/usr/bin/env bash
set -euo pipefail

FILE="src/app/portal/status/page.tsx"
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found."
  echo "Run: ls src/app/portal/status && tell me the filename(s) there."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "${FILE}.bak_${TS}"
echo "Backup created: ${FILE}.bak_${TS}"

python - <<'PY'
from pathlib import Path
import re

p = Path("src/app/portal/status/page.tsx")
s = p.read_text(encoding="utf-8")

# This patch is intentionally conservative:
# It looks for a common "outputs not available yet" gating check and
# replaces it with a check that matches the backend response:
# { found: true, outputs: {...} }

# Replace any check like:
# if (!outputs || Object.keys(outputs).length === 0) ...
# with a safer extraction:
# const outputsMap = (outputsResp?.outputs ?? outputsResp ?? {});
# const hasOutputs = outputsResp?.found === true && Object.keys(outputsMap).length > 0;

# Add helper extraction near where outputs response is handled.
if "outputsResp?.found" in s and "outputsMap" in s:
  print("Looks already patched; no changes made.")
  raise SystemExit(0)

# Try to find where outputs are fetched and stored in state.
# If you have state like const [outputs, setOutputs] = useState(...)
# we won't rename it; we’ll just ensure the check uses outputs.outputs when present.

# Inject a small helper function near top-level of component (best-effort).
inject = """
  function normalizeOutputs(resp: any): { found: boolean; outputs: Record<string, any> } {
    if (!resp) return { found: false, outputs: {} };
    // Backend shape: { run_id, found, status, outputs, updated_at }
    if (typeof resp === "object" && "found" in resp && "outputs" in resp) {
      return { found: !!resp.found, outputs: resp.outputs || {} };
    }
    // Fallback: some builds might return outputs directly as an object map
    if (typeof resp === "object") {
      return { found: true, outputs: resp };
    }
    return { found: false, outputs: {} };
  }
"""

# Insert helper after "export default function" line or inside component start
m = re.search(r"(export default function .*?\{\n)", s)
if not m:
  raise SystemExit("Could not locate component function to inject helper.")
pos = m.end()
s = s[:pos] + inject + s[pos:]

# Now replace the "outputs not available" conditional text block trigger if present.
# We search for the literal message and ensure it uses normalizeOutputs.
if "Terraform outputs not available yet" in s:
  # Try to find a variable name used in render, commonly outputs or infraOutputs
  # We'll add a derived variable before render uses it:
  # const norm = normalizeOutputs(infraOutputs);
  # const hasOutputs = norm.found && Object.keys(norm.outputs).length > 0;
  # Then in render use norm.outputs
  # Best effort: insert near start of return or before render.
  insert2 = """
  const __normOutputs = normalizeOutputs(infraOutputs ?? outputs);
  const __hasOutputs = __normOutputs.found && Object.keys(__normOutputs.outputs || {}).length > 0;
"""
  # Insert right before "return (" in component
  s = re.sub(r"\n\s*return\s*\(", "\n" + insert2 + "\n  return(", s, count=1)

  # Replace any usage of outputs object in JSON render to use __normOutputs.outputs
  s = s.replace("JSON.stringify(outputs", "JSON.stringify(__normOutputs.outputs")
  s = s.replace("JSON.stringify(infraOutputs", "JSON.stringify(__normOutputs.outputs")

  # If a conditional currently checks outputs length, replace with __hasOutputs
  s = re.sub(r"Object\.keys\((infraOutputs|outputs)\s*\)\.length\s*===\s*0", "(!__hasOutputs)", s)
  s = re.sub(r"!\s*(infraOutputs|outputs)", "!__hasOutputs", s)

p.write_text(s, encoding="utf-8")
print("Patched status page to normalize outputs response shape.")
PY

echo "Done. Restart dev server:"
echo "  Ctrl+C then npm run dev"
