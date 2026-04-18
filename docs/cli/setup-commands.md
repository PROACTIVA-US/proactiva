---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `proactiva run`

One-command bootstrap and start:

```sh
pnpm proactiva run
```

Does:

1. Auto-onboards if config is missing
2. Runs `proactiva doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm proactiva run --instance dev
```

## `proactiva onboard`

Interactive first-time setup:

```sh
pnpm proactiva onboard
```

If Proactiva is already configured, rerunning `onboard` keeps the existing config in place. Use `proactiva configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm proactiva onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm proactiva onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Proactiva with that setup.

## `proactiva doctor`

Health checks with optional auto-repair:

```sh
pnpm proactiva doctor
pnpm proactiva doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `proactiva configure`

Update configuration sections:

```sh
pnpm proactiva configure --section server
pnpm proactiva configure --section secrets
pnpm proactiva configure --section storage
```

## `proactiva env`

Show resolved environment configuration:

```sh
pnpm proactiva env
```

This now includes bind-oriented deployment settings such as `PROACTIVA_BIND` and `PROACTIVA_BIND_HOST` when configured.

## `proactiva allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm proactiva allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.proactiva/instances/default/config.json` |
| Database | `~/.proactiva/instances/default/db` |
| Logs | `~/.proactiva/instances/default/logs` |
| Storage | `~/.proactiva/instances/default/data/storage` |
| Secrets key | `~/.proactiva/instances/default/secrets/master.key` |

Override with:

```sh
PROACTIVA_HOME=/custom/home PROACTIVA_INSTANCE_ID=dev pnpm proactiva run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm proactiva run --data-dir ./tmp/proactiva-dev
pnpm proactiva doctor --data-dir ./tmp/proactiva-dev
```
