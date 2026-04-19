---
id: proactiva-002
title: "Implement automated content engine prototype"
status: complete
assignee: claude-code
priority: 2
created: "2026-04-10T09:00:00Z"
updated: "2026-04-10T12:35:00Z"
depends_on: []
circuit_breaker_count: 0
crash_count: 0
correlation_id: "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u"
last_heartbeat: null
wake_on: null
wake_after: null
---

## What Done Looks Like
A working prototype of the automated content engine is built. The prototype successfully generates a sample newsletter or social post.

## Completion Notes

**Delivered:** `projects/proactiva/prototype/content_engine.py`

A Python script that generates newsletter editions ("The Vine Signal") and social posts (Twitter/X thread + LinkedIn) for the Wildvine content flywheel.

**Features:**
- Uses local Ollama (Gemma4/Qwen) when available — sovereign, free generation
- Falls back to high-quality templates when Ollama is offline
- CLI flags: `--type newsletter|social|all`, `--topic "..."`, `--output dir/`, `--no-llm`
- Brand voice, audience, and content angles configured in-script
- Three default topic angles aligned with OPC/sovereign AI narrative

**Sample output:** `projects/proactiva/prototype/sample-output/`
- `2026-04-10-newsletter.md` — full newsletter edition
- `2026-04-10-social.md` — Twitter thread + LinkedIn post

**Next steps (for future tasks):**
- Tune Ollama models with brand voice examples
- Add RSS/feed integration for topic sourcing
- Connect to publishing APIs (Substack, Buffer, LinkedIn)
- Add episode show notes generation for YouTube/podcast content

## Assigned Agent
claude-code

## Relevant Lessons
- [2026-04-09-operator-alignment](2026-04-09-operator-alignment.md) — Cross-reference proposals against OPERATOR.md; don't assume compliance
