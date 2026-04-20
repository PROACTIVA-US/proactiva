#!/usr/bin/env bash
# Install the forge autopilot launchd agent.
# Idempotent — safe to re-run.

set -euo pipefail

FORGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_SRC="$FORGE_DIR/launchd/com.proactiva.forge.plist"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
PLIST_DST="$LAUNCH_AGENTS/com.proactiva.forge.plist"
LABEL="com.proactiva.forge"

if [[ ! -f "$PLIST_SRC" ]]; then
  echo "ERROR: plist source not found: $PLIST_SRC" >&2
  exit 1
fi

mkdir -p "$LAUNCH_AGENTS"

# Unload a previous version if it's already running.
if launchctl list "$LABEL" >/dev/null 2>&1; then
  echo "Bootout existing agent…"
  launchctl bootout "gui/$(id -u)" "$PLIST_DST" 2>/dev/null || true
fi

# Symlink keeps the plist under version control — edit in the repo, reload here.
ln -sf "$PLIST_SRC" "$PLIST_DST"
echo "Linked: $PLIST_DST -> $PLIST_SRC"

launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
launchctl enable "gui/$(id -u)/$LABEL"
echo "Loaded: $LABEL"

echo
echo "Install complete. Autopilot runs every 6 hours."
echo "  Trigger a run now:  launchctl kickstart -k gui/\$(id -u)/$LABEL"
echo "  Tail the log:       tail -f $FORGE_DIR/logs/autopilot.log"
echo "  Last status:        cat $FORGE_DIR/.autopilot-status.json"
echo "  Uninstall:          $FORGE_DIR/uninstall-autopilot.sh"
