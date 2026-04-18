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
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

PAPERCLIP_REPO = "https://github.com/paperclipai/paperclip.git"
PROACTIVA_DIR = Path.home() / "Projects" / "proactiva"
FORGE_DIR = PROACTIVA_DIR / "forge"
REBRAND_SCRIPT = FORGE_DIR / "rebrand.py"
CURSOR_FILE = FORGE_DIR / ".cursors" / "paperclip.last"
WORK_DIR = Path.home() / "Projects" / ".proactiva-sync-workspace"


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Show changes without applying")
    parser.add_argument("--no-clone", action="store_true",
                        help="Skip clone, reuse existing workspace")
    args = parser.parse_args()

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
        return

    step("Step 6: Apply changes to proactiva")

    run([
        "rsync", "-av", "--delete",
        "--exclude=.git",
        "--exclude=node_modules",
        "--exclude=.DS_Store",
        "--exclude=forge/",
        f"{WORK_DIR}/",
        f"{PROACTIVA_DIR}/"
    ], check=False)

    print("  Synced.")

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

    # Cleanup
    step("Cleanup")
    shutil.rmtree(WORK_DIR)
    print("  Working directory removed.")
    print("\n  SYNC COMPLETE.")


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
