---
id: proactiva-003
title: "Implement a continuation mechanism for tool-calling limits"
status: pending
assignee: claude-code
priority: 2
created: "2026-04-10T13:31:00Z"
updated: "2026-04-10T13:31:00Z"
depends_on: []
circuit_breaker_count: 0
crash_count: 0
correlation_id: "b2c3d4e5-f6g7-48e7-9a1f-3c5b7e8d2a11"
last_heartbeat: null
wake_on: null
wake_after: null
---

## What Done Looks Like
A continuation mechanism is implemented in the heartbeat loop to handle tool-calling limits. When an agent hits a limit, its current state is saved and automatically resumed in the next cycle.

## Assigned Agent
claude-code

## Relevant Lessons
- `rust-tool-limits`: When exposing shell execution tools to agents, strictly limit allowed commands to prevent catastrophic system modification (e.g., block `rm`, `cargo init` in root).
