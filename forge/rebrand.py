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

    # Domains
    ("paperclip.com", "proactiva.com"),
    ("paperclipai.com", "proactiva.com"),

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

DIRS_TO_DELETE: list[str] = [
    # Hermes is a third-party paperclip adapter published only under the
    # paperclip name on npm. Proactiva ships without it — see POST_REBRAND_STRIPS.
    "ui/src/adapters/hermes-local",
]
FILES_TO_DELETE: list[str] = [
    "ui/src/components/HermesIcon.tsx",
    # The paperclip 4-step onboarding wizard is replaced by wildvine-styled
    # PracticeSetup, NewCompany, and ClientIntake pages. Wipe the wizard
    # whenever the sync re-introduces it.
    "ui/src/components/OnboardingWizard.tsx",
    "ui/src/components/AsciiArtAnimation.tsx",
    "ui/src/lib/onboarding-route.ts",
    "ui/src/lib/onboarding-route.test.ts",
    "ui/src/lib/onboarding-launch.ts",
    "ui/src/lib/onboarding-launch.test.ts",
    "ui/src/lib/onboarding-goal.ts",
    "ui/src/lib/onboarding-goal.test.ts",
]

# ---------------------------------------------------------------------------
# Post-rebrand exact-string removals
#
# Each tuple: (rel_path, old_chunk, new_chunk). Applied after text replacement
# so the "paperclip → proactiva" rename has already landed. If old_chunk is not
# found verbatim, we warn loudly — that means upstream refactored and we need
# to update the patch here rather than let the diff quietly re-enter the tree.
# ---------------------------------------------------------------------------

POST_REBRAND_STRIPS: list[tuple[str, str, str]] = [
    # --- ui/package.json: drop the external hermes dep line ---
    (
        "ui/package.json",
        '    "hermes-proactiva-adapter": "^0.2.0",\n',
        "",
    ),
    # --- server/package.json: drop the external hermes dep line ---
    (
        "server/package.json",
        '    "hermes-proactiva-adapter": "^0.2.0",\n',
        "",
    ),
    # --- ui/src/adapters/registry.ts: drop import + array entry ---
    (
        "ui/src/adapters/registry.ts",
        'import { openClawGatewayUIAdapter } from "./openclaw-gateway";\n'
        'import { hermesLocalUIAdapter } from "./hermes-local";\n'
        'import { processUIAdapter } from "./process";\n',
        'import { openClawGatewayUIAdapter } from "./openclaw-gateway";\n'
        'import { processUIAdapter } from "./process";\n',
    ),
    (
        "ui/src/adapters/registry.ts",
        "    claudeLocalUIAdapter,\n"
        "    codexLocalUIAdapter,\n"
        "    geminiLocalUIAdapter,\n"
        "    hermesLocalUIAdapter,\n"
        "    openCodeLocalUIAdapter,\n",
        "    claudeLocalUIAdapter,\n"
        "    codexLocalUIAdapter,\n"
        "    geminiLocalUIAdapter,\n"
        "    openCodeLocalUIAdapter,\n",
    ),
    # --- ui/src/adapters/adapter-display-registry.ts: drop icon import + entry ---
    (
        "ui/src/adapters/adapter-display-registry.ts",
        'import { OpenCodeLogoIcon } from "@/components/OpenCodeLogoIcon";\n'
        'import { HermesIcon } from "@/components/HermesIcon";\n',
        'import { OpenCodeLogoIcon } from "@/components/OpenCodeLogoIcon";\n',
    ),
    (
        "ui/src/adapters/adapter-display-registry.ts",
        "  hermes_local: {\n"
        '    label: "Hermes Agent",\n'
        '    description: "Local Hermes CLI agent",\n'
        "    icon: HermesIcon,\n"
        "  },\n"
        "  pi_local: {\n",
        "  pi_local: {\n",
    ),
    # --- ui/src/adapters/use-adapter-capabilities.ts: drop hermes_local row ---
    (
        "ui/src/adapters/use-adapter-capabilities.ts",
        "  pi_local: { supportsInstructionsBundle: true, supportsSkills: true, supportsLocalAgentJwt: true, requiresMaterializedRuntimeSkills: true },\n"
        "  hermes_local: { supportsInstructionsBundle: true, supportsSkills: true, supportsLocalAgentJwt: true, requiresMaterializedRuntimeSkills: false },\n"
        "  openclaw_gateway: ALL_FALSE,\n",
        "  pi_local: { supportsInstructionsBundle: true, supportsSkills: true, supportsLocalAgentJwt: true, requiresMaterializedRuntimeSkills: true },\n"
        "  openclaw_gateway: ALL_FALSE,\n",
    ),
    # --- server/src/adapters/registry.ts: drop imports, adapter def, array entry ---
    (
        "server/src/adapters/registry.ts",
        "import {\n"
        "  execute as hermesExecute,\n"
        "  testEnvironment as hermesTestEnvironment,\n"
        "  sessionCodec as hermesSessionCodec,\n"
        "  listSkills as hermesListSkills,\n"
        "  syncSkills as hermesSyncSkills,\n"
        "  detectModel as detectModelFromHermes,\n"
        '} from "hermes-proactiva-adapter/server";\n'
        "import {\n"
        "  agentConfigurationDoc as hermesAgentConfigurationDoc,\n"
        "  models as hermesModels,\n"
        '} from "hermes-proactiva-adapter";\n'
        'import { BUILTIN_ADAPTER_TYPES } from "./builtin-adapter-types.js";\n',
        'import { BUILTIN_ADAPTER_TYPES } from "./builtin-adapter-types.js";\n',
    ),
    (
        "server/src/adapters/registry.ts",
        "const hermesLocalAdapter: ServerAdapterModule = {\n"
        '  type: "hermes_local",\n'
        "  execute: hermesExecute,\n"
        "  testEnvironment: hermesTestEnvironment,\n"
        "  sessionCodec: hermesSessionCodec,\n"
        "  listSkills: hermesListSkills,\n"
        "  syncSkills: hermesSyncSkills,\n"
        "  models: hermesModels,\n"
        "  supportsLocalAgentJwt: true,\n"
        "  supportsInstructionsBundle: true,\n"
        '  instructionsPathKey: "instructionsFilePath",\n'
        "  requiresMaterializedRuntimeSkills: false,\n"
        "  agentConfigurationDoc: hermesAgentConfigurationDoc,\n"
        "  detectModel: () => detectModelFromHermes(),\n"
        "};\n"
        "\n"
        "const adaptersByType = new Map<string, ServerAdapterModule>();\n",
        "const adaptersByType = new Map<string, ServerAdapterModule>();\n",
    ),
    (
        "server/src/adapters/registry.ts",
        "    openclawGatewayAdapter,\n"
        "    hermesLocalAdapter,\n"
        "    processAdapter,\n",
        "    openclawGatewayAdapter,\n"
        "    processAdapter,\n",
    ),
    # --- server/src/adapters/builtin-adapter-types.ts ---
    (
        "server/src/adapters/builtin-adapter-types.ts",
        '  "pi_local",\n  "hermes_local",\n  "process",\n',
        '  "pi_local",\n  "process",\n',
    ),
    # --- server/src/services/heartbeat.ts: drop from SESSIONED_LOCAL_ADAPTERS ---
    (
        "server/src/services/heartbeat.ts",
        '  "gemini_local",\n  "hermes_local",\n  "opencode_local",\n  "pi_local",\n]);',
        '  "gemini_local",\n  "opencode_local",\n  "pi_local",\n]);',
    ),
    # --- packages/adapter-utils/src/session-compaction.ts: two chunks ---
    (
        "packages/adapter-utils/src/session-compaction.ts",
        '  "gemini_local",\n  "hermes_local",\n  "opencode_local",\n  "pi_local",\n]);',
        '  "gemini_local",\n  "opencode_local",\n  "pi_local",\n]);',
    ),
    (
        "packages/adapter-utils/src/session-compaction.ts",
        "  pi_local: {\n"
        "    supportsSessionResume: true,\n"
        '    nativeContextManagement: "unknown",\n'
        "    defaultSessionCompaction: DEFAULT_SESSION_COMPACTION_POLICY,\n"
        "  },\n"
        "  hermes_local: {\n"
        "    supportsSessionResume: true,\n"
        '    nativeContextManagement: "confirmed",\n'
        "    defaultSessionCompaction: ADAPTER_MANAGED_SESSION_POLICY,\n"
        "  },\n"
        "};\n",
        "  pi_local: {\n"
        "    supportsSessionResume: true,\n"
        '    nativeContextManagement: "unknown",\n'
        "    defaultSessionCompaction: DEFAULT_SESSION_COMPACTION_POLICY,\n"
        "  },\n"
        "};\n",
    ),
    # --- server/src/routes/agents.ts: drop hermes_local row from map ---
    (
        "server/src/routes/agents.ts",
        '    gemini_local: "instructionsFilePath",\n'
        '    hermes_local: "instructionsFilePath",\n'
        '    opencode_local: "instructionsFilePath",\n',
        '    gemini_local: "instructionsFilePath",\n'
        '    opencode_local: "instructionsFilePath",\n',
    ),
    # --- server/src/routes/adapters.ts: scrub a hermes-mentioning comment ---
    (
        "server/src/routes/adapters.ts",
        '    // e.g. "@henkey/hermes-proactiva-adapter@0.3.0" → packageName + version',
        '    // e.g. "@scope/some-adapter@0.3.0" → packageName + version',
    ),

    # --- lucide-react `Paperclip` icon removal ---
    # Upstream paperclip uses lucide's `Paperclip` icon as both its brand mark
    # and as an attachment-button icon. The sweeping paperclip → proactiva
    # text rename turns those imports into `Proactiva`, which lucide does not
    # export (white screen). Proactiva drops the paperclip iconography entirely:
    # brand spots use the ProactivaLogo SVG; attachment buttons use Image /
    # File / Upload depending on intent.
    (
        "ui/src/components/CompanyRail.tsx",
        'import { Proactiva, Plus } from "lucide-react";',
        'import { Plus } from "lucide-react";\nimport { ProactivaLogo } from "./ProactivaLogo";',
    ),
    (
        "ui/src/components/CompanyRail.tsx",
        '        <Proactiva className="h-5 w-5 text-foreground" />',
        '        <ProactivaLogo className="h-5 w-5 text-foreground" />',
    ),
    (
        "ui/src/components/CommentThread.tsx",
        'import { ArrowRight, Check, Copy, Proactiva } from "lucide-react";',
        'import { ArrowRight, Check, Copy, Image } from "lucide-react";',
    ),
    (
        "ui/src/components/CommentThread.tsx",
        '                  <Proactiva className="h-4 w-4" />',
        '                  <Image className="h-4 w-4" />',
    ),
    (
        "ui/src/components/IssueChatThread.tsx",
        'import { AlertTriangle, ArrowRight, Brain, Check, ChevronDown, Copy, Hammer, Loader2, MoreHorizontal, Proactiva, Search, Square, ThumbsDown, ThumbsUp } from "lucide-react";',
        'import { AlertTriangle, ArrowRight, Brain, Check, ChevronDown, Copy, Hammer, Image, Loader2, MoreHorizontal, Search, Square, ThumbsDown, ThumbsUp } from "lucide-react";',
    ),
    (
        "ui/src/components/IssueChatThread.tsx",
        '              <Proactiva className="h-4 w-4" />',
        '              <Image className="h-4 w-4" />',
    ),
    (
        "ui/src/components/NewIssueDialog.tsx",
        "  Calendar,\n  Proactiva,\n  FileText,",
        "  Calendar,\n  File,\n  Upload,\n  FileText,",
    ),
    (
        "ui/src/components/NewIssueDialog.tsx",
        '                            <Proactiva className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />',
        '                            <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />',
    ),
    (
        "ui/src/components/NewIssueDialog.tsx",
        '            <Proactiva className="h-3 w-3" />',
        '            <Upload className="h-3 w-3" />',
    ),
    (
        "ui/src/pages/IssueDetail.tsx",
        "  MoreVertical,\n  Proactiva,\n  Plus,",
        "  MoreVertical,\n  Upload,\n  Plus,",
    ),
    (
        "ui/src/pages/IssueDetail.tsx",
        '        <Proactiva className="h-3.5 w-3.5 mr-1.5" />',
        '        <Upload className="h-3.5 w-3.5 mr-1.5" />',
    ),
    (
        "ui/src/pages/CompanySkills.tsx",
        "  ExternalLink,\n  Proactiva,\n  Pencil,",
        "  ExternalLink,\n  Pencil,",
    ),
    (
        "ui/src/pages/CompanySkills.tsx",
        'import { EmptyState } from "../components/EmptyState";',
        'import { EmptyState } from "../components/EmptyState";\nimport { ProactivaLogo } from "../components/ProactivaLogo";',
    ),
    (
        "ui/src/pages/CompanySkills.tsx",
        '      return { icon: Proactiva, label: sourceLabel ?? "Proactiva", managedLabel: "Proactiva managed" };',
        '      return { icon: ProactivaLogo, label: sourceLabel ?? "Proactiva", managedLabel: "Proactiva managed" };',
    ),
]


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
# Phase 6b: Strip third-party paperclip-branded content (hermes, etc.)
#
# Upstream paperclip imports a third-party hermes adapter whose npm package
# only exists under the paperclip name. Proactiva ships without it. This phase
# removes the imports/registrations that the text-replacement phase would
# otherwise leave referencing a nonexistent `hermes-proactiva-adapter` package.
# If any patch misses, we warn — upstream likely refactored and the strip
# needs updating here, not silently left in the tree.
# ---------------------------------------------------------------------------

def phase_post_rebrand_strips(target: Path) -> None:
    print("\n[Phase 6b] Applying post-rebrand strips (hermes, etc.)...")

    if not POST_REBRAND_STRIPS:
        log("(nothing configured to strip)")
        return

    applied = 0
    missed = []
    for rel_path, old_chunk, new_chunk in POST_REBRAND_STRIPS:
        p = target / rel_path
        if not p.exists():
            log(f"WARNING: Target not found (skipping): {rel_path}")
            missed.append(rel_path)
            continue
        try:
            content = p.read_text(encoding="utf-8")
        except (OSError, PermissionError) as e:
            log(f"WARNING: Could not read {rel_path}: {e}")
            missed.append(rel_path)
            continue

        if old_chunk not in content:
            # Already stripped (idempotent re-run) OR upstream refactored.
            # Distinguish by checking whether new_chunk is present.
            if new_chunk and new_chunk in content:
                continue  # already applied
            log(f"WARNING: Strip did not match {rel_path} — upstream may have refactored. Update POST_REBRAND_STRIPS.")
            missed.append(rel_path)
            continue

        p.write_text(content.replace(old_chunk, new_chunk, 1), encoding="utf-8")
        applied += 1

    log(f"Applied {applied} strips, {len(missed)} misses")
    if missed:
        log("Review the warnings above — unexpected misses usually mean hermes leaked back in.")


# ---------------------------------------------------------------------------
# Phase 7: Verification
# ---------------------------------------------------------------------------

def phase_verify(target: Path) -> dict[str, list[str]]:
    print("\n[Phase 7] Verification...")

    search_terms = [
        "paperclip", "Paperclip", "PAPERCLIP",
        "paperclipai", "paperclip-ai",
        "paperclip.com", "paperclipai.com",
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
    phase_post_rebrand_strips(target)
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
