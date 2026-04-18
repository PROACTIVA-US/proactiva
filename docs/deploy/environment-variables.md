---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Proactiva uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `PROACTIVA_BIND` | `loopback` | Reachability preset: `loopback`, `lan`, `tailnet`, or `custom` |
| `PROACTIVA_BIND_HOST` | (unset) | Required when `PROACTIVA_BIND=custom` |
| `HOST` | `127.0.0.1` | Legacy host override; prefer `PROACTIVA_BIND` for new setups |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `PROACTIVA_HOME` | `~/.proactiva` | Base directory for all Proactiva data |
| `PROACTIVA_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `PROACTIVA_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |
| `PROACTIVA_DEPLOYMENT_EXPOSURE` | `private` | Exposure policy when deployment mode is `authenticated` |
| `PROACTIVA_API_URL` | (auto-derived) | Proactiva API base URL. When set externally (e.g., via Kubernetes ConfigMap, load balancer, or reverse proxy), the server preserves the value instead of deriving it from the listen host and port. Useful for deployments where the public-facing URL differs from the local bind address. |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `PROACTIVA_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `PROACTIVA_SECRETS_MASTER_KEY_FILE` | `~/.proactiva/.../secrets/master.key` | Path to key file |
| `PROACTIVA_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `PROACTIVA_AGENT_ID` | Agent's unique ID |
| `PROACTIVA_COMPANY_ID` | Company ID |
| `PROACTIVA_API_URL` | Proactiva API base URL (inherits the server-level value; see Server Configuration above) |
| `PROACTIVA_API_KEY` | Short-lived JWT for API auth |
| `PROACTIVA_RUN_ID` | Current heartbeat run ID |
| `PROACTIVA_TASK_ID` | Issue that triggered this wake |
| `PROACTIVA_WAKE_REASON` | Wake trigger reason |
| `PROACTIVA_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `PROACTIVA_APPROVAL_ID` | Resolved approval ID |
| `PROACTIVA_APPROVAL_STATUS` | Approval decision |
| `PROACTIVA_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
