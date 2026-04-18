---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm proactiva issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm proactiva issue get <issue-id-or-identifier>

# Create issue
pnpm proactiva issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm proactiva issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm proactiva issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm proactiva issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm proactiva issue release <issue-id>
```

## Company Commands

```sh
pnpm proactiva company list
pnpm proactiva company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm proactiva company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm proactiva company import \
  <owner>/<repo>/<path> \
  --target existing \
  --company-id <company-id> \
  --ref main \
  --collision rename \
  --dry-run

# Apply import
pnpm proactiva company import \
  ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm proactiva agent list
pnpm proactiva agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm proactiva approval list [--status pending]

# Get approval
pnpm proactiva approval get <approval-id>

# Create approval
pnpm proactiva approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm proactiva approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm proactiva approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm proactiva approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm proactiva approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm proactiva approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm proactiva activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm proactiva dashboard get
```

## Heartbeat

```sh
pnpm proactiva heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
