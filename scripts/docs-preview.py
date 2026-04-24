#!/usr/bin/env python3
"""Build docs/_preview.html from docs.json nav order using pandoc."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
OUTPUT = DOCS / "_preview.html"
CSS = REPO / "scripts" / "docs-preview.css"
NAV_JSON = DOCS / "docs.json"

YAML_FM = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
HEADING_RE = re.compile(r"^(#{1,6})(?=\s)", re.MULTILINE)

# Demote each page's internal headings by this many levels so they nest under
# the `### {page_title}` wrapper emitted by collect_nav() (which lives at h3,
# inside tab=h1 > group=h2 > page=h3). Capped at h6.
PAGE_HEADING_SHIFT = 3


def demote_headings(body: str, shift: int = PAGE_HEADING_SHIFT) -> str:
    return HEADING_RE.sub(
        lambda m: "#" * min(len(m.group(1)) + shift, 6),
        body,
    )


def read_page(page_rel: str) -> tuple[str, str]:
    for ext in (".md", ".mdx"):
        src = DOCS / f"{page_rel}{ext}"
        if src.exists():
            break
    else:
        fallback = page_rel.rsplit("/", 1)[-1].replace("-", " ").title()
        return fallback, f"> *missing source: `{page_rel}`*"

    raw = src.read_text(encoding="utf-8")
    title = None
    body = raw
    m = YAML_FM.match(raw)
    if m:
        for line in m.group(1).splitlines():
            stripped = line.strip()
            if stripped.startswith("title:"):
                title = stripped.split(":", 1)[1].strip().strip('"').strip("'")
                break
        body = raw[m.end():]
    if not title:
        title = src.stem.replace("-", " ").title()
    return title, demote_headings(body)


def collect_nav(nav: dict) -> str:
    parts: list[str] = []
    for tab in nav.get("tabs", []):
        parts.append(f"# {tab['tab']}\n")
        for group in tab.get("groups", []):
            parts.append(f"\n## {group['group']}\n")
            seen: set[str] = set()
            for page in group.get("pages", []):
                if not isinstance(page, str) or page in seen:
                    continue
                seen.add(page)
                title, body = read_page(page)
                parts.append(f"\n### {title}\n\n{body.strip()}\n")
    return "\n".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--open", action="store_true", help="Open the result in the default browser")
    args = parser.parse_args()

    if not NAV_JSON.exists():
        print(f"error: {NAV_JSON} not found", file=sys.stderr)
        return 1
    if not CSS.exists():
        print(f"error: {CSS} not found", file=sys.stderr)
        return 1

    nav = json.loads(NAV_JSON.read_text(encoding="utf-8"))["navigation"]
    combined = collect_nav(nav)

    header_file = OUTPUT.with_suffix(".header.tmp")
    header_file.write_text(
        (
            '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n'
            '<meta http-equiv="Pragma" content="no-cache">\n'
            '<meta http-equiv="Expires" content="0">\n'
            f"<style>\n{CSS.read_text(encoding='utf-8')}\n</style>\n"
        ),
        encoding="utf-8",
    )
    try:
        result = subprocess.run(
            [
                "pandoc",
                "--standalone",
                "--toc", "--toc-depth=3",
                "--metadata", "title=Proactiva Docs (local preview)",
                "--metadata", "subtitle=Generated from docs/docs.json — rebuild with `pnpm docs:preview`",
                "--from=markdown+yaml_metadata_block+fenced_code_blocks+pipe_tables+backtick_code_blocks",
                "--to=html5",
                "--include-in-header", str(header_file),
                "-o", str(OUTPUT),
            ],
            input=combined,
            text=True,
            check=False,
        )
    finally:
        header_file.unlink(missing_ok=True)

    if result.returncode != 0:
        print(f"pandoc exited {result.returncode}", file=sys.stderr)
        return result.returncode

    print(f"built: {OUTPUT.relative_to(REPO)}")
    if args.open:
        subprocess.run(["open", str(OUTPUT)], check=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
