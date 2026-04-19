#!/usr/bin/env python3
"""
Proactiva Content Engine Prototype

Generates newsletter editions and social posts for the Wildvine ecosystem
content flywheel. Uses local Ollama models when available, falls back to
structured templates.

Usage:
    python3 content_engine.py                    # Generate all content types
    python3 content_engine.py --type newsletter   # Newsletter only
    python3 content_engine.py --type social       # Social posts only
    python3 content_engine.py --topic "AI agents" # Custom topic
    python3 content_engine.py --output out/       # Write to directory
"""

import argparse
import json
import os
import sys
import textwrap
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma3:27b")

BRAND = {
    "name": "Wildvine",
    "tagline": "Sovereign AI that makes humans stronger",
    "newsletter_name": "The Vine Signal",
    "audience": "Builders, founders, and technologists interested in sovereign AI, "
                "one-person companies, and human-AI collaboration",
    "voice": "Direct, provocative, technical but accessible. No corporate speak. "
             "Challenge assumptions. Show don't tell.",
}

DEFAULT_TOPICS = [
    {
        "headline": "The One-Person Company Revolution Is Here",
        "angle": "China reports explosive OPC growth. Henry launched fleets of "
                 "AI-run microbusinesses. What this means for solo founders.",
        "tags": ["OPC", "AI agents", "solo founders", "revenue"],
    },
    {
        "headline": "Why Your AI Agent Needs a Soul File",
        "angle": "Most AI agents drift because they have no identity. SOUL.md "
                 "fixes that. How Wildvine OS keeps agents aligned.",
        "tags": ["AI alignment", "agent architecture", "SOUL.md", "Wildvine OS"],
    },
    {
        "headline": "Institutional Compilation: Encoding Expert Knowledge as Code",
        "angle": "What if you could package a doctor's 30 years of experience "
                 "into a deployable AI pack? That's what .vine packs do.",
        "tags": ["institutional knowledge", ".vine packs", "expert systems"],
    },
]


# ---------------------------------------------------------------------------
# Ollama integration
# ---------------------------------------------------------------------------

def ollama_available() -> bool:
    """Check if Ollama is reachable."""
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except (urllib.error.URLError, OSError):
        return False


def ollama_generate(prompt: str, system: str = "") -> str:
    """Generate text via Ollama API. Returns empty string on failure."""
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 1024},
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            return data.get("response", "").strip()
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as e:
        print(f"  [warn] Ollama generation failed: {e}", file=sys.stderr)
        return ""


# ---------------------------------------------------------------------------
# Content generators
# ---------------------------------------------------------------------------

def generate_newsletter(topic: dict, use_llm: bool = False) -> str:
    """Generate a newsletter edition."""
    headline = topic["headline"]
    angle = topic["angle"]
    tags = topic.get("tags", [])
    date = datetime.now().strftime("%B %d, %Y")

    if use_llm:
        system_prompt = (
            f"You are writing a newsletter called '{BRAND['newsletter_name']}' "
            f"for {BRAND['audience']}. Voice: {BRAND['voice']} "
            f"Brand: {BRAND['name']} — {BRAND['tagline']}. "
            f"Write in markdown format. Keep it under 600 words."
        )
        user_prompt = (
            f"Write a newsletter edition with this headline: {headline}\n"
            f"Angle: {angle}\n"
            f"Include: a compelling opener (2-3 sentences), the main insight "
            f"(3-4 paragraphs), one concrete example or case study, a call to "
            f"action, and a sign-off. Tags: {', '.join(tags)}"
        )
        result = ollama_generate(user_prompt, system_prompt)
        if result:
            return f"# {BRAND['newsletter_name']} — {date}\n\n{result}"

    # Template fallback
    tag_str = " | ".join(f"#{t}" for t in tags)
    return textwrap.dedent(f"""\
        # {BRAND['newsletter_name']} — {date}

        ## {headline}

        {angle}

        ---

        **The signal:**

        Something shifted this week. The tools that used to require a team of
        ten now run on a single laptop. The coordination costs that justified
        every org chart in existence are collapsing toward zero.

        This isn't speculation — it's already happening. China's OPC registrations
        surged 340% in Q1 2026. meetHenry.ai launched autonomous business fleets
        for solo operators. The infrastructure exists. The question is whether
        you'll use it or get used by it.

        **What Wildvine is building:**

        We're not building another AI wrapper. Wildvine OS is sovereign
        infrastructure — agents with identity (SOUL.md), observable state
        (filesystem as database), and operator alignment (the Entropy Axiom:
        if human minds atrophy, AI's food source dies).

        The difference matters. Most AI tools make you dependent. We're building
        tools that make you *stronger*.

        **One thing to try this week:**

        Write a SOUL.md for your next AI project. Define who the agent serves,
        what constraints it operates under, and what "success" means. Watch how
        much less it drifts.

        ---

        *{BRAND['tagline']}*

        {tag_str}
    """)


def generate_social_posts(topic: dict, use_llm: bool = False) -> str:
    """Generate social media posts (Twitter/X thread + LinkedIn)."""
    headline = topic["headline"]
    angle = topic["angle"]
    tags = topic.get("tags", [])

    if use_llm:
        system_prompt = (
            f"You write social media posts for {BRAND['name']} — {BRAND['tagline']}. "
            f"Voice: {BRAND['voice']} Audience: {BRAND['audience']}. "
            f"Generate a Twitter/X thread (5 tweets, each under 280 chars) and "
            f"one LinkedIn post (under 300 words). Use markdown format."
        )
        user_prompt = (
            f"Topic: {headline}\nAngle: {angle}\n"
            f"Hashtags to use: {', '.join('#' + t.replace(' ', '') for t in tags)}"
        )
        result = ollama_generate(user_prompt, system_prompt)
        if result:
            return result

    # Template fallback
    hashtags = " ".join(f"#{t.replace(' ', '')}" for t in tags)
    return textwrap.dedent(f"""\
        ## Twitter/X Thread

        **1/** {headline}

        {angle}

        Here's what nobody's talking about: 🧵

        **2/** The coordination costs that built every Fortune 500 org chart
        are collapsing. Not shrinking — collapsing. One person + sovereign AI
        can now do what took a department.

        **3/** But here's the trap: most AI tools create dependency.
        Your "assistant" becomes a black box you can't live without.

        Wildvine OS takes the opposite approach: every agent has a SOUL.md.
        Every decision is logged. The operator gets stronger, not weaker.

        **4/** The Entropy Axiom: if human minds atrophy, AI's food source dies.

        This isn't philosophy — it's architecture. It's in the code.

        **5/** We're building this in the open. Sovereign AI for solo founders.

        Follow along: {hashtags}

        ---

        ## LinkedIn Post

        **{headline}**

        {angle}

        Three things I've learned building sovereign AI infrastructure:

        1. **Identity matters.** An AI agent without a SOUL.md is just a
        hallucination machine. Define who it serves, what it can't do, and
        what success looks like.

        2. **Observability or death.** If you can't see what your agent is
        doing, you don't have an agent — you have a liability.

        3. **The operator must get stronger.** The moment your AI makes you
        dumber, you've lost. Build tools that teach, not tools that replace.

        The one-person company revolution is real. The question is whether
        the AI infrastructure serving it will be sovereign or rented.

        We're building the sovereign version.

        {hashtags}
    """)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Proactiva Content Engine — generate newsletter & social content"
    )
    parser.add_argument(
        "--type", choices=["newsletter", "social", "all"], default="all",
        help="Content type to generate (default: all)",
    )
    parser.add_argument(
        "--topic", type=str, default=None,
        help="Custom topic headline (uses first default topic if omitted)",
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Output directory (prints to stdout if omitted)",
    )
    parser.add_argument(
        "--no-llm", action="store_true",
        help="Skip LLM generation, use templates only",
    )
    args = parser.parse_args()

    # Select topic
    if args.topic:
        topic = {
            "headline": args.topic,
            "angle": f"Exploring {args.topic} through the lens of sovereign AI "
                     "and one-person companies.",
            "tags": ["AI", "sovereignty", "OPC"],
        }
    else:
        topic = DEFAULT_TOPICS[0]

    # Check LLM availability
    use_llm = False
    if not args.no_llm:
        print("Checking Ollama availability...", file=sys.stderr)
        if ollama_available():
            print(f"  Ollama online — using {OLLAMA_MODEL}", file=sys.stderr)
            use_llm = True
        else:
            print("  Ollama offline — using templates", file=sys.stderr)

    outputs = {}

    if args.type in ("newsletter", "all"):
        print("Generating newsletter...", file=sys.stderr)
        outputs["newsletter"] = generate_newsletter(topic, use_llm)

    if args.type in ("social", "all"):
        print("Generating social posts...", file=sys.stderr)
        outputs["social"] = generate_social_posts(topic, use_llm)

    # Output
    if args.output:
        out_dir = Path(args.output)
        out_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y-%m-%d")
        for content_type, content in outputs.items():
            path = out_dir / f"{date_str}-{content_type}.md"
            path.write_text(content)
            print(f"  Wrote {path}", file=sys.stderr)
    else:
        for content_type, content in outputs.items():
            print(f"\n{'=' * 60}")
            print(f"  {content_type.upper()}")
            print(f"{'=' * 60}\n")
            print(content)

    print("\nDone.", file=sys.stderr)


if __name__ == "__main__":
    main()
