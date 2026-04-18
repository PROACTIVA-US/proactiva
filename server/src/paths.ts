import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const PROACTIVA_CONFIG_BASENAME = "config.json";
const PROACTIVA_ENV_FILENAME = ".env";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, ".proactiva", PROACTIVA_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveProactivaConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.PROACTIVA_CONFIG) return path.resolve(process.env.PROACTIVA_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveProactivaEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveProactivaConfigPath(overrideConfigPath)), PROACTIVA_ENV_FILENAME);
}
