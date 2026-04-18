import fs from "node:fs";
import { proactivaConfigSchema, type ProactivaConfig } from "@proactiva/shared";
import { resolveProactivaConfigPath } from "./paths.js";

export function readConfigFile(): ProactivaConfig | null {
  const configPath = resolveProactivaConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return proactivaConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
