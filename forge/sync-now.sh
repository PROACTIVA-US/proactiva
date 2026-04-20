#!/usr/bin/env bash
# Manual one-shot sync — same code path as the autopilot, runs in your terminal
# so you see output live. Use when you want to pick up upstream changes right
# now instead of waiting for the next scheduled run.
#
# Pass --dry-run to preview without applying.

set -euo pipefail

FORGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$FORGE_DIR/sync_upstream.py" --autopilot "$@"
