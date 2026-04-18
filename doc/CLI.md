# CLI Reference

Proactiva CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm proactiva --help
```

First-time local bootstrap + run:

```sh
pnpm proactiva run
```

Choose local instance:

```sh
pnpm proactiva run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `proactiva onboard` and `proactiva configure --section server` set deployment mode in config
- server onboarding/configure ask for reachability intent and write `server.bind`
- `proactiva run --bind <loopback|lan|tailnet>` passes a quickstart bind preset into first-run onboarding when config is missing
- runtime can override mode with `PROACTIVA_DEPLOYMENT_MODE`
- `proactiva run` and `proactiva doctor` still do not expose a direct low-level `--mode` flag

Canonical behavior is documented in `doc/DEPLOYMENT-MODES.md`.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm proactiva allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.proactiva`:

```sh
pnpm proactiva run --data-dir ./tmp/proactiva-dev
pnpm proactiva issue list --data-dir ./tmp/proactiva-dev
```

## Context Profiles

Store local defaults in `~/.proactiva/context.json`:

```sh
pnpm proactiva context set --api-base http://localhost:3100 --company-id <company-id>
pnpm proactiva context show
pnpm proactiva context list
pnpm proactiva context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm proactiva context set --api-key-env-var-name PROACTIVA_API_KEY
export PROACTIVA_API_KEY=...
```

## Company Commands

```sh
pnpm proactiva company list
pnpm proactiva company get <company-id>
pnpm proactiva company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm proactiva company delete PAP --yes --confirm PAP
pnpm proactiva company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `PROACTIVA_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `PROACTIVA_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm proactiva issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm proactiva issue get <issue-id-or-identifier>
pnpm proactiva issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm proactiva issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm proactiva issue comment <issue-id> --body "..." [--reopen]
pnpm proactiva issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm proactiva issue release <issue-id>
```

## Agent Commands

```sh
pnpm proactiva agent list --company-id <company-id>
pnpm proactiva agent get <agent-id>
pnpm proactiva agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Proactiva agent:

- creates a new long-lived agent API key
- installs missing Proactiva skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `PROACTIVA_API_URL`, `PROACTIVA_COMPANY_ID`, `PROACTIVA_AGENT_ID`, and `PROACTIVA_API_KEY`

Example for shortname-based local setup:

```sh
pnpm proactiva agent local-cli codexcoder --company-id <company-id>
pnpm proactiva agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm proactiva approval list --company-id <company-id> [--status pending]
pnpm proactiva approval get <approval-id>
pnpm proactiva approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm proactiva approval approve <approval-id> [--decision-note "..."]
pnpm proactiva approval reject <approval-id> [--decision-note "..."]
pnpm proactiva approval request-revision <approval-id> [--decision-note "..."]
pnpm proactiva approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm proactiva approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm proactiva activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm proactiva dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm proactiva heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.proactiva/instances/default`:

- config: `~/.proactiva/instances/default/config.json`
- embedded db: `~/.proactiva/instances/default/db`
- logs: `~/.proactiva/instances/default/logs`
- storage: `~/.proactiva/instances/default/data/storage`
- secrets key: `~/.proactiva/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
PROACTIVA_HOME=/custom/home PROACTIVA_INSTANCE_ID=dev pnpm proactiva run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm proactiva configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
