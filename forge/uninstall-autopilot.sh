#!/usr/bin/env bash
# Remove the forge autopilot launchd agent.

set -euo pipefail

LABEL="com.proactiva.forge"
PLIST_DST="$HOME/Library/LaunchAgents/$LABEL.plist"

if launchctl list "$LABEL" >/dev/null 2>&1; then
  launchctl bootout "gui/$(id -u)" "$PLIST_DST" 2>/dev/null || true
  echo "Booted out: $LABEL"
fi

if [[ -L "$PLIST_DST" || -f "$PLIST_DST" ]]; then
  rm -f "$PLIST_DST"
  echo "Removed: $PLIST_DST"
fi

echo "Uninstall complete. The forge/ directory is untouched."
