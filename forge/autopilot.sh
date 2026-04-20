#!/usr/bin/env bash
# Proactiva forge autopilot — runs the upstream sync unattended.
#
# Intended entry point for launchd / cron. Logs to forge/logs/autopilot.log,
# writes a machine-readable status to forge/.autopilot-status.json.
#
# Decisions made here:
#   1. Use the user's own Homebrew / Node paths explicitly so launchd's
#      minimal PATH doesn't break pnpm resolution.
#   2. Serialize runs via a simple lockfile so a long run can't overlap
#      with the next cron tick.
#   3. Never auto-push. The user reviews `git log` + `git diff` before pushing.
#      This is deliberate — pushing unreviewed upstream changes to a shared
#      branch is irreversible from other consultants' POV.

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Projects/proactiva}"
FORGE_DIR="$REPO_DIR/forge"
LOG_DIR="$FORGE_DIR/logs"
LOCK_FILE="$FORGE_DIR/.autopilot.lock"
LOG_FILE="$LOG_DIR/autopilot.log"

# Resolve the user's real PATH — launchd's default omits Homebrew etc.
# Adjust these if your tooling lives elsewhere.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:$PATH"

mkdir -p "$LOG_DIR"

# Rotate log if it grows past 1 MB.
if [[ -f "$LOG_FILE" ]] && [[ $(wc -c < "$LOG_FILE") -gt 1048576 ]]; then
  mv "$LOG_FILE" "$LOG_FILE.1"
fi

# Lockfile prevents overlapping runs.
if [[ -f "$LOCK_FILE" ]]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "[$(date -u +%FT%TZ)] another autopilot run (pid $pid) is active, exiting" >> "$LOG_FILE"
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

{
  echo
  echo "=============================================="
  echo "autopilot run @ $(date -u +%FT%TZ)"
  echo "=============================================="
  cd "$REPO_DIR"
  echo "repo:      $REPO_DIR"
  echo "branch:    $(git rev-parse --abbrev-ref HEAD)"
  echo "head:      $(git rev-parse HEAD)"
  echo
  /usr/bin/env python3 "$FORGE_DIR/sync_upstream.py" --autopilot
} >> "$LOG_FILE" 2>&1
