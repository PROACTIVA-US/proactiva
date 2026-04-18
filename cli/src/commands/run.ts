import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { bootstrapCeoInvite } from "./auth-bootstrap-ceo.js";
import { onboard } from "./onboard.js";
import { doctor } from "./doctor.js";
import { loadProactivaEnvFile } from "../config/env.js";
import { configExists, resolveConfigPath } from "../config/store.js";
import type { ProactivaConfig } from "../config/schema.js";
import { readConfig } from "../config/store.js";
import {
  describeLocalInstancePaths,
  resolveProactivaHomeDir,
  resolveProactivaInstanceId,
} from "../config/home.js";

interface RunOptions {
  config?: string;
  instance?: string;
  repair?: boolean;
  yes?: boolean;
  bind?: "loopback" | "lan" | "tailnet";
}

interface StartedServer {
  apiUrl: string;
  databaseUrl: string;
  host: string;
  listenPort: number;
}

export async function runCommand(opts: RunOptions): Promise<void> {
  const instanceId = resolveProactivaInstanceId(opts.instance);
  process.env.PROACTIVA_INSTANCE_ID = instanceId;

  const homeDir = resolveProactivaHomeDir();
  fs.mkdirSync(homeDir, { recursive: true });

  const paths = describeLocalInstancePaths(instanceId);
  fs.mkdirSync(paths.instanceRoot, { recursive: true });

  const configPath = resolveConfigPath(opts.config);
  process.env.PROACTIVA_CONFIG = configPath;
  loadProactivaEnvFile(configPath);

  p.intro(pc.bgCyan(pc.black(" proactiva run ")));
  p.log.message(pc.dim(`Home: ${paths.homeDir}`));
  p.log.message(pc.dim(`Instance: ${paths.instanceId}`));
  p.log.message(pc.dim(`Config: ${configPath}`));

  if (!configExists(configPath)) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      p.log.error("No config found and terminal is non-interactive.");
      p.log.message(`Run ${pc.cyan("proactiva onboard")} once, then retry ${pc.cyan("proactiva run")}.`);
      process.exit(1);
    }

    p.log.step("No config found. Starting onboarding...");
    await onboard({ config: configPath, invokedByRun: true, bind: opts.bind });
  }

  p.log.step("Running doctor checks...");
  const summary = await doctor({
    config: configPath,
    repair: opts.repair ?? true,
    yes: opts.yes ?? true,
  });

  if (summary.failed > 0) {
    p.log.error("Doctor found blocking issues. Not starting server.");
    process.exit(1);
  }

  const config = readConfig(configPath);
  if (!config) {
    p.log.error(`No config found at ${configPath}.`);
    process.exit(1);
  }

  p.log.step("Starting Proactiva server...");
  const startedServer = await importServerEntry();

  if (shouldGenerateBootstrapInviteAfterStart(config)) {
    p.log.step("Generating bootstrap CEO invite");
    await bootstrapCeoInvite({
      config: configPath,
      dbUrl: startedServer.databaseUrl,
      baseUrl: resolveBootstrapInviteBaseUrl(config, startedServer),
    });
  }
}

function resolveBootstrapInviteBaseUrl(
  config: ProactivaConfig,
  startedServer: StartedServer,
): string {
  const explicitBaseUrl =
    process.env.PROACTIVA_PUBLIC_URL ??
    process.env.PROACTIVA_AUTH_PUBLIC_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.BETTER_AUTH_BASE_URL ??
    (config.auth.baseUrlMode === "explicit" ? config.auth.publicBaseUrl : undefined);

  if (typeof explicitBaseUrl === "string" && explicitBaseUrl.trim().length > 0) {
    return explicitBaseUrl.trim().replace(/\/+$/, "");
  }

  return startedServer.apiUrl.replace(/\/api$/, "");
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message && err.message.trim().length > 0) return err.message;
    return err.name;
  }
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isModuleNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: unknown }).code;
  if (code === "ERR_MODULE_NOT_FOUND") return true;
  return err.message.includes("Cannot find module");
}

function getMissingModuleSpecifier(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const packageMatch = err.message.match(/Cannot find package '([^']+)' imported from/);
  if (packageMatch?.[1]) return packageMatch[1];
  const moduleMatch = err.message.match(/Cannot find module '([^']+)'/);
  if (moduleMatch?.[1]) return moduleMatch[1];
  return null;
}

function maybeEnableUiDevMiddleware(entrypoint: string): void {
  if (process.env.PROACTIVA_UI_DEV_MIDDLEWARE !== undefined) return;
  const normalized = entrypoint.replaceAll("\\", "/");
  if (normalized.endsWith("/server/src/index.ts") || normalized.endsWith("@proactiva/server/src/index.ts")) {
    process.env.PROACTIVA_UI_DEV_MIDDLEWARE = "true";
  }
}

function ensureDevWorkspaceBuildDeps(projectRoot: string): void {
  const buildScript = path.resolve(projectRoot, "scripts/ensure-plugin-build-deps.mjs");
  if (!fs.existsSync(buildScript)) return;

  const result = spawnSync(process.execPath, [buildScript], {
    cwd: projectRoot,
    stdio: "inherit",
    timeout: 120_000,
  });

  if (result.error) {
    throw new Error(
      `Failed to prepare workspace build artifacts before starting the Proactiva dev server.\n${formatError(result.error)}`,
    );
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(
      "Failed to prepare workspace build artifacts before starting the Proactiva dev server.",
    );
  }
}

async function importServerEntry(): Promise<StartedServer> {
  // Dev mode: try local workspace path (monorepo with tsx)
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const devEntry = path.resolve(projectRoot, "server/src/index.ts");
  if (fs.existsSync(devEntry)) {
    ensureDevWorkspaceBuildDeps(projectRoot);
    maybeEnableUiDevMiddleware(devEntry);
    const mod = await import(pathToFileURL(devEntry).href);
    return await startServerFromModule(mod, devEntry);
  }

  // Production mode: import the published @proactiva/server package
  try {
    const mod = await import("@proactiva/server");
    return await startServerFromModule(mod, "@proactiva/server");
  } catch (err) {
    const missingSpecifier = getMissingModuleSpecifier(err);
    const missingServerEntrypoint = !missingSpecifier || missingSpecifier === "@proactiva/server";
    if (isModuleNotFoundError(err) && missingServerEntrypoint) {
      throw new Error(
        `Could not locate a Proactiva server entrypoint.\n` +
          `Tried: ${devEntry}, @proactiva/server\n` +
          `${formatError(err)}`,
      );
    }
    throw new Error(
      `Proactiva server failed to start.\n` +
        `${formatError(err)}`,
    );
  }
}

function shouldGenerateBootstrapInviteAfterStart(config: ProactivaConfig): boolean {
  return config.server.deploymentMode === "authenticated" && config.database.mode === "embedded-postgres";
}

async function startServerFromModule(mod: unknown, label: string): Promise<StartedServer> {
  const startServer = (mod as { startServer?: () => Promise<StartedServer> }).startServer;
  if (typeof startServer !== "function") {
    throw new Error(`Proactiva server entrypoint did not export startServer(): ${label}`);
  }
  return await startServer();
}
