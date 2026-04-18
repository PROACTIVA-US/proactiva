# forge

Sync tooling that keeps `proactiva/` in sync with upstream `paperclipai/paperclip`, rebranded to Proactiva.

## Files

- `sync_upstream.py` — shallow-clone upstream, rebrand, rsync into `proactiva/`, commit, update cursor.
- `rebrand.py` — idempotent transform from paperclip → proactiva (text, file/dir renames, asset swaps).
- `.cursors/paperclip.last` — last synced upstream commit SHA.
- `assets/` — placeholder branded assets (logos, favicons). Replace with real assets when available.

## Usage

```bash
# Preview changes without applying
python3 forge/sync_upstream.py --dry-run

# Apply sync (clones upstream, rebrands, rsyncs, commits)
python3 forge/sync_upstream.py

# Re-run after editing rebrand.py without re-cloning
python3 forge/sync_upstream.py --no-clone
```

## Adding rebrand rules

Edit `rebrand.py`:

- `TEXT_REPLACEMENTS` — string substitutions (order matters; specific before generic).
- `DIR_RENAMES` — explicit directory moves.
- `ASSET_SWAPS` — copy files from `forge/assets/` to paths in the target.
- `DIRS_TO_DELETE` / `FILES_TO_DELETE` — remove upstream content not wanted in proactiva.
- `VERIFY_EXCEPTIONS` — paths allowed to keep old brand references (e.g., changelogs).

After editing, re-run with `--no-clone` to iterate quickly on the same workspace.

## Invariants

- The sync excludes `forge/` itself — this directory is never overwritten.
- The sync excludes `.git`, `node_modules`, `.DS_Store`.
- `--delete` is enabled, so files removed upstream are removed from proactiva.
- Running twice with no upstream changes is a no-op (cursor match).

## Upstream

- Repo: https://github.com/paperclipai/paperclip
- Branch: `master`
