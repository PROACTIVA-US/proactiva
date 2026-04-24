#!/usr/bin/env python3
"""
rebrand.py — Transform a paperclip codebase into Proactiva branding.

Usage:
    python rebrand.py <target_dir>

The target directory should be a COPY of the paperclip repo (not the original).
This script is idempotent — running it multiple times produces the same result.

Lives in: ~/Projects/proactiva/forge/
"""

import os
import shutil
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Where placeholder branded assets live (inside the forge directory itself)
FORGE_DIR = Path(__file__).resolve().parent
PROACTIVA_ASSETS = FORGE_DIR / "assets"

# Binary file extensions — skip text replacement for these
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".icns", ".woff", ".woff2",
    ".ttf", ".eot", ".otf", ".zip", ".tar", ".gz", ".bz2", ".xz",
    ".pdf", ".mp3", ".mp4", ".wav", ".ogg", ".webm", ".webp", ".avif",
    ".heic", ".heif", ".tiff", ".bmp", ".DS_Store",
    ".pyc", ".pyo", ".so", ".dylib", ".dll", ".exe", ".bin",
    ".lock", ".yarn", ".sqlite", ".db",
}

# Directories to skip entirely during text replacement
SKIP_DIRS = {".git", "node_modules", ".build", "dist", ".next", "__pycache__",
             ".turbo", ".vercel", "forge"}

# Files that intentionally reference old brand names (lore/meta-docs/changelogs).
# Relative paths from target root.
VERIFY_EXCEPTIONS = set()

# ---------------------------------------------------------------------------
# Text replacements (order matters — more specific patterns first)
# ---------------------------------------------------------------------------

TEXT_REPLACEMENTS = [
    # GitHub org URLs (most specific first — full repo paths before bare org)
    ("github.com/paperclipai/paperclip-evals", "github.com/PROACTIVA-US/proactiva-evals"),
    ("github.com/paperclipai/paperclip", "github.com/PROACTIVA-US/proactiva"),
    ("github.com/paperclipai/companies", "github.com/PROACTIVA-US/companies"),
    ("github.com/paperclip-ai/paperclip", "github.com/PROACTIVA-US/proactiva"),
    ("github.com/paperclipai/", "github.com/PROACTIVA-US/"),
    ("github.com/paperclip-ai/", "github.com/PROACTIVA-US/"),

    # Domains — Proactiva brand owns proactiva.us (never .ing, never .com).
    # The .ing rewrite is defensive: previous syncs left `proactiva.ing`
    # strings behind (including in UI docs links, TOS URLs, telemetry
    # defaults, and the synthetic commit-author email). This rule makes
    # sure they cannot come back through a paperclip re-sync.
    ("paperclip.com", "proactiva.us"),
    ("paperclipai.com", "proactiva.us"),
    ("paperclip.ing", "proactiva.us"),
    ("paperclipai.ing", "proactiva.us"),
    ("proactiva.ing", "proactiva.us"),

    # npm scope
    ("@paperclipai/", "@proactiva/"),

    # "paperclipai" identifier (used as npm script names, org handle)
    ("paperclipai", "proactiva"),
    ("paperclip-ai", "proactiva"),

    # Core branding — case variants, most specific first
    ("PAPERCLIP", "PROACTIVA"),
    ("Paperclip", "Proactiva"),
    ("paperclip", "proactiva"),
]

# ---------------------------------------------------------------------------
# Directory renames (parent dirs first so children exist)
# ---------------------------------------------------------------------------

DIR_RENAMES = [
    # No top-level dirs currently named paperclip; rename phase handles nested
    # *paperclip* dirs like .claude/skills/paperclip, skills/paperclip, etc.
]

# ---------------------------------------------------------------------------
# Asset swap map: (target_relative_path_in_paperclip, source_path_in_forge/assets)
# ---------------------------------------------------------------------------

ASSET_SWAPS = [
    # Favicon / logo placeholders — only swap paths that exist in upstream.
    # Missing source files are warned; missing targets are silently skipped.
    ("ui/public/favicon.svg", "proactiva-logo.svg"),
]

# ---------------------------------------------------------------------------
# Content to delete
# ---------------------------------------------------------------------------

DIRS_TO_DELETE: list[str] = []
FILES_TO_DELETE: list[str] = []


# ===========================================================================
# Implementation
# ===========================================================================

def log(msg: str) -> None:
    print(f"  {msg}")


def is_binary(path: Path) -> bool:
    """Check if a file is binary by extension or by reading a sample."""
    if path.suffix.lower() in BINARY_EXTENSIONS:
        return True
    try:
        with open(path, "rb") as f:
            chunk = f.read(8192)
            if b"\x00" in chunk:
                return True
    except (OSError, PermissionError):
        return True
    return False


def should_skip_dir(name: str) -> bool:
    return name in SKIP_DIRS


def replace_text_in_file(filepath: Path, replacements: list[tuple[str, str]]) -> bool:
    """Apply text replacements to a single file. Returns True if modified."""
    if is_binary(filepath):
        return False
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")
    except (OSError, PermissionError):
        return False

    original = content
    for old, new in replacements:
        content = content.replace(old, new)

    if content != original:
        try:
            filepath.write_text(content, encoding="utf-8")
            return True
        except (OSError, PermissionError) as e:
            log(f"  WARNING: Could not write {filepath}: {e}")
    return False


# ---------------------------------------------------------------------------
# Phase 1: Delete unwanted content
# ---------------------------------------------------------------------------

def phase_delete_content(target: Path) -> None:
    print("\n[Phase 1] Deleting unwanted content...")

    if not DIRS_TO_DELETE and not FILES_TO_DELETE:
        log("(nothing configured to delete)")
        return

    for d in DIRS_TO_DELETE:
        p = target / d
        if p.exists():
            shutil.rmtree(p)
            log(f"Deleted directory: {d}")

    for f in FILES_TO_DELETE:
        p = target / f
        if p.exists():
            p.unlink()
            log(f"Deleted file: {f}")


# ---------------------------------------------------------------------------
# Phase 2: Swap assets (before renames so paths still match)
# ---------------------------------------------------------------------------

def phase_swap_assets(target: Path) -> None:
    print("\n[Phase 2] Swapping brand assets...")

    if not ASSET_SWAPS:
        log("(no assets configured to swap)")
        return

    for target_rel, source_rel in ASSET_SWAPS:
        src = PROACTIVA_ASSETS / source_rel
        dst = target / target_rel

        if not src.exists():
            log(f"WARNING: Source asset not found: {src}")
            continue

        if not dst.parent.exists():
            log(f"Skipping (target dir doesn't exist): {target_rel}")
            continue

        shutil.copy2(src, dst)
        log(f"Copied: {source_rel} -> {target_rel}")


# ---------------------------------------------------------------------------
# Phase 3: Text replacements across all files
# ---------------------------------------------------------------------------

def phase_text_replacements(target: Path) -> None:
    print("\n[Phase 3] Applying text replacements...")
    count = 0

    for root, dirs, files in os.walk(target):
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in files:
            filepath = Path(root) / fname
            if replace_text_in_file(filepath, TEXT_REPLACEMENTS):
                count += 1

    log(f"Modified {count} files")


# ---------------------------------------------------------------------------
# Phase 4: Rename directories
# ---------------------------------------------------------------------------

def phase_rename_dirs(target: Path) -> None:
    print("\n[Phase 4] Renaming directories (explicit map)...")

    if not DIR_RENAMES:
        log("(no explicit dir renames configured)")
        return

    for old_rel, new_rel in DIR_RENAMES:
        old = target / old_rel
        new = target / new_rel
        if old.exists() and not new.exists():
            new.parent.mkdir(parents=True, exist_ok=True)
            old.rename(new)
            log(f"Renamed dir: {old_rel} -> {new_rel}")
        elif new.exists():
            log(f"Already renamed: {new_rel}")
        else:
            log(f"Not found (skipping): {old_rel}")


# ---------------------------------------------------------------------------
# Phase 5: Rename files containing old brand names
# ---------------------------------------------------------------------------

def phase_rename_files(target: Path) -> None:
    print("\n[Phase 5] Renaming files/dirs containing brand names...")
    count = 0

    # Filename replacement patterns (order matters — most specific first)
    name_replacements = [
        ("PAPERCLIP", "PROACTIVA"),
        ("Paperclip", "Proactiva"),
        ("paperclipai", "proactiva"),
        ("paperclip-ai", "proactiva"),
        ("paperclip", "proactiva"),
    ]

    renames: list[tuple[Path, Path]] = []

    # Bottom-up walk so we rename deepest first and parent paths stay stable
    for root, dirs, files in os.walk(target, topdown=False):
        # Skip excluded dirs from descent on the way down; topdown=False still honors this
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in files:
            new_name = fname
            for old, new in name_replacements:
                if old in new_name:
                    new_name = new_name.replace(old, new)
            if new_name != fname:
                renames.append((Path(root) / fname, Path(root) / new_name))

        for dname in dirs:
            new_dname = dname
            for old, new in name_replacements:
                if old in new_dname:
                    new_dname = new_dname.replace(old, new)
            if new_dname != dname:
                renames.append((Path(root) / dname, Path(root) / new_dname))

    for old_path, new_path in renames:
        if old_path.exists() and not new_path.exists():
            new_path.parent.mkdir(parents=True, exist_ok=True)
            old_path.rename(new_path)
            count += 1

    log(f"Renamed {count} files/directories")


# ---------------------------------------------------------------------------
# Phase 6: Second-pass text replacements (catch references in renamed files)
# ---------------------------------------------------------------------------

def phase_second_pass(target: Path) -> None:
    print("\n[Phase 6] Second-pass text replacements...")
    count = 0

    for root, dirs, files in os.walk(target):
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in files:
            filepath = Path(root) / fname
            if replace_text_in_file(filepath, TEXT_REPLACEMENTS):
                count += 1

    log(f"Modified {count} files in second pass")


# ---------------------------------------------------------------------------
# Phase 7: Verification
# ---------------------------------------------------------------------------

def phase_verify(target: Path) -> dict[str, list[str]]:
    print("\n[Phase 7] Verification...")

    search_terms = [
        "paperclip", "Paperclip", "PAPERCLIP",
        "paperclipai", "paperclip-ai",
        "paperclip.com", "paperclipai.com",
        "paperclip.ing", "paperclipai.ing",
        # Brand owns proactiva.us, not .ing — any surviving match here
        # means the rebrand pass missed one.
        "proactiva.ing",
    ]
    filename_terms = ["paperclip", "Paperclip", "PAPERCLIP"]

    issues: dict[str, list[str]] = {}

    for term in search_terms:
        matches = []
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if not should_skip_dir(d)]
            for fname in files:
                filepath = Path(root) / fname
                if is_binary(filepath):
                    continue
                try:
                    content = filepath.read_text(encoding="utf-8", errors="replace")
                    if term in content:
                        rel = filepath.relative_to(target)
                        if str(rel) in VERIFY_EXCEPTIONS:
                            continue
                        n = content.count(term)
                        matches.append(f"{rel} ({n} occurrences)")
                except (OSError, PermissionError):
                    pass
        if matches:
            issues[f"grep '{term}'"] = matches

    for term in filename_terms:
        matches = []
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if not should_skip_dir(d)]
            for fname in files + dirs:
                if term.lower() in fname.lower():
                    rel = (Path(root) / fname).relative_to(target)
                    matches.append(str(rel))
        if matches:
            issues[f"find -iname '*{term}*'"] = matches

    if not issues:
        log("CLEAN — no remaining references found!")
    else:
        log(f"Found {len(issues)} issue categories:")
        for check, matches in issues.items():
            log(f"\n  {check}:")
            for m in matches[:20]:
                log(f"    - {m}")
            if len(matches) > 20:
                log(f"    ... and {len(matches) - 20} more")

    return issues


# ===========================================================================
# Main
# ===========================================================================

def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <target_directory>")
        print("  The target should be a COPY of the paperclip repo.")
        sys.exit(1)

    target = Path(sys.argv[1]).resolve()

    if not target.exists():
        print(f"ERROR: Target directory does not exist: {target}")
        sys.exit(1)

    if not (target / "package.json").exists():
        print(f"ERROR: {target} does not look like a paperclip repo (no package.json)")
        sys.exit(1)

    print("=== Proactiva Rebrand Script ===")
    print(f"Target: {target}")
    print(f"Assets: {PROACTIVA_ASSETS}")

    phase_delete_content(target)
    phase_swap_assets(target)
    phase_text_replacements(target)
    phase_rename_dirs(target)
    phase_rename_files(target)
    phase_second_pass(target)
    issues = phase_verify(target)

    print("\n=== Done ===")
    if issues:
        print(f"WARNING: {len(issues)} verification checks have remaining matches.")
        print("Review the output above and add rules or exceptions as needed.")
        sys.exit(2)
    else:
        print("All verification checks passed — branding scrub is complete!")


if __name__ == "__main__":
    main()
