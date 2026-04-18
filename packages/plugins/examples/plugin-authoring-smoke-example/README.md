# Plugin Authoring Smoke Example

A Proactiva plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Proactiva

```bash
pnpm proactiva plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@proactiva/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
