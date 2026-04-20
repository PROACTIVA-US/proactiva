#!/usr/bin/env python3
"""
sync_upstream.py — Sync proactiva with latest paperclip via rebrand.

Architecture:
    1. Shallow-clone paperclip into a temp dir (no persistent local clone needed)
    2. Run rebrand.py on the clone
    3. Diff against current proactiva (summary)
    4. Rsync the result into proactiva (excluding .git, forge/)
    5. Report what changed
    6. Commit and update cursor

Usage:
    python3 sync_upstream.py [--dry-run] [--no-clone]

    --dry-run   Show what would change without applying
    --no-clone  Skip clone, reuse existing workspace (for re-runs after fixing rebrand)
"""

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PAPERCLIP_REPO = "https://github.com/paperclipai/paperclip.git"
PROACTIVA_DIR = Path.home() / "Projects" / "proactiva"
FORGE_DIR = PROACTIVA_DIR / "forge"
REBRAND_SCRIPT = FORGE_DIR / "rebrand.py"
CURSOR_FILE = FORGE_DIR / ".cursors" / "paperclip.last"
WORK_DIR = Path.home() / "Projects" / ".proactiva-sync-workspace"
PROACTIVA_ONLY_FILE = FORGE_DIR / "proactiva-only.txt"
STATUS_FILE = FORGE_DIR / ".autopilot-status.json"


def run(cmd, cwd=None, check=True):
    """Run a command and return the result."""
    result = subprocess.run(
        cmd, capture_output=True, text=True, cwd=cwd, timeout=600
    )
    if check and result.returncode != 0:
        print(f"  ERROR: {' '.join(cmd)}")
        print(f"  {result.stderr[:500]}")
    return result


def step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def write_status(outcome: str, detail: str, cursor: str | None = None) -> None:
    """Persist the autopilot outcome so logs / external tooling can see it."""
    try:
        STATUS_FILE.write_text(
            json.dumps(
                {
                    "outcome": outcome,
                    "detail": detail,
                    "cursor": cursor,
                    "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                },
                indent=2,
            )
            + "\n"
        )
    except OSError as err:
        print(f"  (could not write status file: {err})")


def run_gate(label: str, cmd: list[str], cwd: Path) -> bool:
    """Run a safety gate command. Returns True on success, False on failure."""
    print(f"\n  Gate: {label}")
    result = run(cmd, cwd=str(cwd), check=False)
    if result.returncode == 0:
        print(f"  Gate passed: {label}")
        return True
    # Preserve tail of stderr/stdout for the log.
    print(f"  Gate failed: {label} (exit {result.returncode})")
    tail = (result.stderr or result.stdout or "")[-800:]
    if tail:
        print(f"  --- tail ---\n{tail}\n  --- end ---")
    return False


def notify(title: str, message: str) -> None:
    """Send a native macOS notification. No-op on failure."""
    try:
        script = f'display notification {json.dumps(message)} with title {json.dumps(title)} sound name "Glass"'
        subprocess.run(["osascript", "-e", script], capture_output=True, timeout=5)
    except Exception:
        pass


def current_branch(cwd: Path) -> str:
    result = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=str(cwd), check=False)
    return result.stdout.strip()


def tree_is_clean(cwd: Path) -> bool:
    result = run(["git", "status", "--porcelain"], cwd=str(cwd), check=False)
    return not result.stdout.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Show changes without applying")
    parser.add_argument("--no-clone", action="store_true",
                        help="Skip clone, reuse existing workspace")
    parser.add_argument("--skip-gates", action="store_true",
                        help="Skip post-sync typecheck gates (NOT recommended for autopilot)")
    parser.add_argument("--autopilot", action="store_true",
                        help="Run in unattended mode: write status file, notify on failure/success, auto-push")
    parser.add_argument("--allow-any-branch", action="store_true",
                        help="Skip the 'must be on main' pre-flight check")
    parser.add_argument("--no-push", action="store_true",
                        help="In autopilot mode, skip the auto-push after commit")
    args = parser.parse_args()

    # ---------------------------------------------------------------
    # Pre-flight safety checks — never stomp uncommitted work or commit
    # to a feature branch.
    # ---------------------------------------------------------------
    branch = current_branch(PROACTIVA_DIR)
    if not args.allow_any_branch and branch != "main":
        msg = f"aborting: current branch is '{branch}', expected 'main' (use --allow-any-branch to override)"
        print(f"  {msg}")
        if args.autopilot:
            write_status("skipped", msg, cursor=None)
            notify("Forge sync skipped", f"Not on main (on '{branch}')")
        sys.exit(0 if args.autopilot else 1)

    if not tree_is_clean(PROACTIVA_DIR) and not args.dry_run:
        msg = "aborting: working tree has uncommitted changes (commit, stash, or discard them first)"
        print(f"  {msg}")
        if args.autopilot:
            write_status("skipped", msg, cursor=None)
            notify("Forge sync skipped", "Working tree dirty — commit or stash first")
        sys.exit(0 if args.autopilot else 1)

    # ---------------------------------------------------------------
    # Step 1: Clone paperclip to temp dir
    # ---------------------------------------------------------------
    step("Step 1: Get paperclip source")

    if args.no_clone:
        if not WORK_DIR.exists():
            print("  ERROR: --no-clone but no existing workspace found")
            sys.exit(1)
        print(f"  Reusing existing workspace: {WORK_DIR}")
    else:
        if WORK_DIR.exists():
            shutil.rmtree(WORK_DIR)

        print(f"  Cloning {PAPERCLIP_REPO} (shallow)...")
        result = run([
            "git", "clone", "--depth=1", "--single-branch", "--branch", "master",
            PAPERCLIP_REPO, str(WORK_DIR)
        ])
        if result.returncode != 0:
            print("  Clone failed. Aborting.")
            sys.exit(1)
        print("  Clone complete.")

    # Get current HEAD of the clone
    current_head = run(
        ["git", "rev-parse", "HEAD"], cwd=str(WORK_DIR)
    ).stdout.strip()

    cursor = CURSOR_FILE.read_text().strip() if CURSOR_FILE.exists() else "unknown"

    print(f"  Cursor was: {cursor[:12]}")
    print(f"  HEAD is:    {current_head[:12]}")

    if cursor == current_head:
        print("\n  Already up to date. Nothing to sync.")
        if not args.no_clone:
            shutil.rmtree(WORK_DIR)
        if args.autopilot:
            write_status("no_op", "cursor matches upstream HEAD", cursor=current_head)
        return

    # ---------------------------------------------------------------
    # Step 2: Remove .git from workspace (we just need the files)
    # ---------------------------------------------------------------
    step("Step 2: Prepare workspace")

    git_dir = WORK_DIR / ".git"
    if git_dir.exists():
        shutil.rmtree(git_dir)
        print("  Removed .git from workspace")

    pkg = WORK_DIR / "package.json"
    if not pkg.exists():
        print("  WARNING: No package.json found — workspace may not be a paperclip repo")

    # ---------------------------------------------------------------
    # Step 3: Run rebrand.py
    # ---------------------------------------------------------------
    step("Step 3: Run rebrand.py on workspace")

    result = run(
        [sys.executable, str(REBRAND_SCRIPT), str(WORK_DIR)],
        cwd=str(FORGE_DIR)
    )
    print(result.stdout[-2000:] if result.stdout else "  (no output)")
    if result.returncode not in (0, 2):
        # exit 2 = verification warnings (expected while rules are incomplete)
        print("  REBRAND FAILED. Aborting.")
        shutil.rmtree(WORK_DIR)
        sys.exit(1)

    # ---------------------------------------------------------------
    # Step 4: Diff summary
    # ---------------------------------------------------------------
    step("Step 4: Diff against current proactiva")

    result = run([
        "rsync", "-avn", "--delete",
        "--exclude=.git",
        "--exclude=node_modules",
        "--exclude=.DS_Store",
        "--exclude=forge/",
        f"--exclude-from={PROACTIVA_ONLY_FILE}",
        f"{WORK_DIR}/",
        f"{PROACTIVA_DIR}/"
    ], check=False)

    changes = result.stdout.strip().split("\n") if result.stdout.strip() else []
    file_changes = [
        l for l in changes
        if l and not l.startswith("sending") and not l.startswith("sent ")
        and not l.startswith("total ") and not l.endswith("/")
        and not l.startswith("created directory")
    ]

    print(f"  Files that would change: {len(file_changes)}")

    if len(file_changes) <= 50:
        for f in file_changes:
            print(f"    {f}")
    else:
        for f in file_changes[:30]:
            print(f"    {f}")
        print(f"    ... ({len(file_changes) - 40} more)")
        for f in file_changes[-10:]:
            print(f"    {f}")

    if not file_changes:
        print("\n  No changes detected. Already in sync.")
        shutil.rmtree(WORK_DIR)
        if args.autopilot:
            write_status("no_op", "workspace identical to current tree", cursor=current_head)
        return

    # ---------------------------------------------------------------
    # Step 5: Verify no old brand references in workspace
    # ---------------------------------------------------------------
    step("Step 5: Verification — check for remaining brand references")

    checks = ["paperclip", "Paperclip", "PAPERCLIP", "paperclipai"]
    all_clean = True
    for term in checks:
        result = run([
            "grep", "-rl", term,
            "--include=*.ts", "--include=*.tsx", "--include=*.json",
            "--include=*.md", "--include=*.yml", "--include=*.yaml",
            "--include=*.sh", "--include=*.py", "--include=*.css",
            "--include=*.html", "--include=*.mjs", "--include=*.js",
            "--include=*.mdx", "--include=*.toml",
            str(WORK_DIR)
        ], check=False)
        hits = [l for l in (result.stdout.strip().split("\n") if result.stdout.strip() else []) if l]
        if hits:
            print(f"  WARNING: '{term}' found in {len(hits)} files")
            all_clean = False
        else:
            print(f"  '{term}': clean")

    if not all_clean:
        print("\n  WARNING: Some branding references remain. Review before applying.")

    # ---------------------------------------------------------------
    # Step 6: Apply (or dry-run)
    # ---------------------------------------------------------------
    if args.dry_run:
        step("Step 6: DRY RUN — not applying changes")
        print(f"  Would sync {len(file_changes)} files to {PROACTIVA_DIR}")
        print("  Run without --dry-run to apply.")
        shutil.rmtree(WORK_DIR)
        if args.autopilot:
            write_status("dry_run", f"{len(file_changes)} files would change", cursor=current_head)
        return

    step("Step 6: Apply changes to proactiva")

    run([
        "rsync", "-av", "--delete",
        "--exclude=.git",
        "--exclude=node_modules",
        "--exclude=.DS_Store",
        "--exclude=forge/",
        f"--exclude-from={PROACTIVA_ONLY_FILE}",
        f"{WORK_DIR}/",
        f"{PROACTIVA_DIR}/"
    ], check=False)

    print("  Synced.")

    # ---------------------------------------------------------------
    # Step 6b: Safety gates
    # Run typecheck before we commit. If it fails we leave the working tree
    # as-is so the human can inspect + decide. We DON'T auto-revert because
    # partial syncs are informative — they tell you which upstream change
    # needs new POST_REBRAND_STRIPS or a structural code fix.
    # ---------------------------------------------------------------
    if not args.skip_gates:
        step("Step 6b: Safety gates")
        gate_ok = run_gate("pnpm typecheck", ["pnpm", "-r", "typecheck"], PROACTIVA_DIR)
        if not gate_ok:
            print(
                "\n  TYPECHECK FAILED. Leaving working tree uncommitted for review."
                "\n  To inspect: cd proactiva && git status"
                "\n  To revert:  git restore . && git clean -fd"
            )
            shutil.rmtree(WORK_DIR)
            if args.autopilot:
                write_status(
                    "failed",
                    "typecheck failed after sync; working tree left uncommitted",
                    cursor=current_head,
                )
                notify(
                    "Forge sync FAILED",
                    f"Typecheck broke after syncing {current_head[:12]}. Working tree left uncommitted.",
                )
                sys.exit(2)
            return

    # ---------------------------------------------------------------
    # Step 7: Update cursor, then commit (cursor goes into the same commit)
    # ---------------------------------------------------------------
    step("Step 7: Update cursor and commit")

    CURSOR_FILE.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_FILE.write_text(current_head)
    print(f"  Cursor updated to: {current_head[:12]}")

    run(["git", "add", "-A"], cwd=str(PROACTIVA_DIR))

    status = run(["git", "status", "--porcelain"], cwd=str(PROACTIVA_DIR))
    changed_files = len([l for l in status.stdout.strip().split("\n") if l.strip()])

    if changed_files == 0:
        print("  No changes to commit (files identical after sync)")
    else:
        rule_count = _count_rebrand_rules()
        commit_msg = (
            f"Sync upstream paperclip {datetime.now().strftime('%Y-%m-%d')}\n\n"
            f"Upstream HEAD: {current_head[:12]}\n"
            f"Previous cursor: {cursor[:12]}\n"
            f"Files changed: {changed_files}\n"
            f"Rebrand rules: {rule_count}"
        )
        run(["git", "commit", "-m", commit_msg], cwd=str(PROACTIVA_DIR))
        print(f"  Committed: {changed_files} files changed")

    # ---------------------------------------------------------------
    # Step 8: Auto-push (autopilot only)
    # Solo-operator default. Push current branch to origin. Push failure
    # is logged but doesn't roll back the local commit — the human can
    # resolve and push manually.
    # ---------------------------------------------------------------
    push_outcome = None
    if args.autopilot and not args.no_push and changed_files > 0:
        step("Step 8: Auto-push to origin")
        push_result = run(["git", "push", "origin", branch], cwd=str(PROACTIVA_DIR), check=False)
        if push_result.returncode == 0:
            print("  Pushed.")
            push_outcome = "pushed"
        else:
            print("  Push failed — commit is local only.")
            tail = (push_result.stderr or push_result.stdout or "")[-400:]
            if tail:
                print(f"  --- tail ---\n{tail}\n  --- end ---")
            push_outcome = "push_failed"

    # Cleanup
    step("Cleanup")
    shutil.rmtree(WORK_DIR)
    print("  Working directory removed.")
    print("\n  SYNC COMPLETE.")
    if args.autopilot:
        if changed_files == 0:
            write_status("no_op", "no changes to commit", cursor=current_head)
        elif push_outcome == "pushed":
            write_status("pushed", f"{changed_files} files committed and pushed", cursor=current_head)
            notify("Forge sync pushed", f"{changed_files} files committed and pushed ({current_head[:12]})")
        elif push_outcome == "push_failed":
            write_status(
                "push_failed",
                f"{changed_files} files committed locally; push to origin failed",
                cursor=current_head,
            )
            notify("Forge sync: push failed", f"Committed locally but push to origin failed. Resolve manually.")
        else:
            write_status("committed", f"{changed_files} files committed (push skipped)", cursor=current_head)
            notify("Forge sync committed", f"{changed_files} files committed (push skipped)")


def _count_rebrand_rules() -> int:
    """Count TEXT_REPLACEMENTS entries in rebrand.py for the commit message."""
    try:
        text = REBRAND_SCRIPT.read_text()
        # crude but stable: count tuples inside TEXT_REPLACEMENTS block
        start = text.index("TEXT_REPLACEMENTS = [")
        end = text.index("\n]", start)
        block = text[start:end]
        return block.count("), (") + (1 if "(" in block else 0)
    except (OSError, ValueError):
        return 0


if __name__ == "__main__":
    main()
