# Forge autopilot

Unattended upstream sync with safety gates and auto-push. Runs every 6 hours
under launchd. Designed for a solo operator on macOS.

## TL;DR

```sh
# Install (idempotent):
./forge/install-autopilot.sh

# Manual one-shot in your terminal (same code path, visible output):
./forge/sync-now.sh             # real run with gates
./forge/sync-now.sh --dry-run   # preview only

# Inspect:
tail -f forge/logs/autopilot.log
cat forge/.autopilot-status.json

# Stop:
./forge/uninstall-autopilot.sh
```

## What runs

```
launchd (every 6h, StartInterval=21600s)
  └─ forge/autopilot.sh
       ├─ lockfile (forge/.autopilot.lock)
       └─ python3 forge/sync_upstream.py --autopilot
            ├─ pre-flight: must be on main
            ├─ pre-flight: working tree must be clean
            ├─ shallow-clone upstream master
            ├─ if cursor matches HEAD → exit (outcome: no_op)
            ├─ strip .git, run rebrand.py (7 phases)
            ├─ diff summary + brand-ref verification
            ├─ rsync workspace → proactiva (respects forge/proactiva-only.txt)
            ├─ GATE: pnpm -r typecheck
            │    └─ fail → leave uncommitted, notify, exit 2
            ├─ update cursor, git add -A, local commit
            ├─ git push origin main
            │    └─ fail → commit stays local, notify
            └─ write forge/.autopilot-status.json + macOS notification
```

## Decision criteria

| Check | When it fires | Outcome | Rationale |
|-------|---------------|---------|-----------|
| Branch | Current branch ≠ `main` | `skipped`, banner, exit 0 | Never commit upstream sync to a feature branch you're working on. |
| Clean tree | Uncommitted changes present | `skipped`, banner, exit 0 | Never stomp in-flight work. Commit, stash, or discard first. |
| Cursor match | Upstream HEAD = `.cursors/paperclip.last` | `no_op`, silent | Cheapest possible: shallow clone + compare, exit fast. Silent because no news is good news. |
| Rebrand verify | grep finds residual brand strings | warning, continues | Phases 1-6 have already run; warnings flag leaks that couldn't be fully rebranded. Escalate to halt if drift shows up in practice. |
| POST_REBRAND_STRIPS miss | Exact-chunk patch doesn't match | warning, continues | Means upstream refactored a file we patch. The miss is logged; follow-up is to update the strip. |
| `proactiva-only.txt` | File listed here is in tree but not in upstream | rsync does NOT delete it | Protects Proactiva-exclusive files (ClientDashboard, ProactivaLogo, etc.). **Add new Proactiva-only files to that list when you create them.** |
| Typecheck | `pnpm -r typecheck` after rsync lands | exit 2, `failed`, notify | Broken TS would ship unrunnable code. Work tree stays uncommitted for manual repair or revert. |
| Auto-push | Commit succeeded, `--no-push` not set | `pushed` if OK, `push_failed` if not | Solo operator — round-trip to remote is the "finished" state. Push failure doesn't roll back. |

## Notifications

macOS native banners fire on:
- **FAILED** — typecheck broke after sync, working tree left uncommitted.
- **push failed** — committed locally, push didn't go through.
- **pushed** — success confirmation (kept because it's the positive signal you want when you walk back to your laptop).
- **skipped** — wrong branch or dirty tree (so you don't wonder why no sync happened).

`no_op` runs are silent — they're the 95% case.

## After a `failed` run

```sh
cat forge/.autopilot-status.json      # which gate failed
tail -200 forge/logs/autopilot.log    # full context
git status                            # changes are sitting uncommitted

# Repair path: fix the issue (POST_REBRAND_STRIPS, proactiva-only.txt, or code),
# then `git add -A && git commit` manually.
# Revert path: `git restore . && git clean -fd` — next run retries from scratch.
```

## Manual overrides

```sh
python3 forge/sync_upstream.py --dry-run           # preview
python3 forge/sync_upstream.py --autopilot         # same as sync-now.sh
python3 forge/sync_upstream.py --skip-gates        # bypass typecheck (emergency)
python3 forge/sync_upstream.py --no-push           # commit locally, don't push
python3 forge/sync_upstream.py --allow-any-branch  # run even on a feature branch
```

## Where the artifacts live

```
forge/
├── autopilot.sh                # launchd entry point
├── install-autopilot.sh        # one-shot install
├── uninstall-autopilot.sh      # one-shot uninstall
├── sync-now.sh                 # manual run in current terminal
├── sync_upstream.py            # main sync logic
├── rebrand.py                  # rebrand phases + POST_REBRAND_STRIPS
├── proactiva-only.txt          # rsync exclude list (Proactiva-exclusive files)
├── launchd/
│   └── com.proactiva.forge.plist
├── logs/
│   └── autopilot.log           # rotated at 1 MB
├── .cursors/
│   └── paperclip.last          # last synced upstream SHA
├── .autopilot-status.json      # last run outcome (machine-readable)
└── .autopilot.lock             # runtime-only, guards against overlap
```
