"""
Utilities for merging AI-generated manifests with manual overrides
and previous session state.
"""

from __future__ import annotations
from typing import Any, Dict, Tuple


def merge_recommendations(
    *,
    ai_manifest: Dict[str, Any],
    manual_overrides: Dict[str, Any] | None = None,
    session_manifest: Dict[str, Any] | None = None,
    strict: bool = True,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Merge AI-generated manifest, manual overrides, and previous session manifest.

    Returns:
        merged_manifest: The final combined manifest.
        diffs: A dict describing what changed and from where.
    """

    manual_overrides = manual_overrides or {}
    session_manifest = session_manifest or {}

    diffs = {}

    # Start from AI manifest as the base
    merged = {**ai_manifest}

    # --- Merge session state (previous manifest) ---
    for key, value in session_manifest.items():
        if key not in merged:
            merged[key] = value
            diffs.setdefault("session", {})[key] = {"from": None, "to": value}
        elif merged[key] != value:
            diffs.setdefault("session", {})[key] = {
                "from": merged[key],
                "to": value,
            }

    # --- Merge manual overrides ---
    for key, value in manual_overrides.items():
        if key not in merged:
            merged[key] = value
            diffs.setdefault("overrides", {})[key] = {"from": None, "to": value}
        elif merged[key] != value:
            diffs.setdefault("overrides", {})[key] = {
                "from": merged.get(key),
                "to": value,
            }
            merged[key] = value

    # Strict mode: Ensure manifest has essential fields
    if strict:
        for required in ("id", "requirements", "components"):
            if required not in merged:
                raise ValueError(f"Manifest missing required field: {required}")

    return merged, diffs
