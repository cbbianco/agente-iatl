import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = join(ROOT, "config.json");

const DEFAULTS = {
  project: "pfi-backend-core",
  projectContext: "",
  sprintLabel: "",
  architectureTarget: "hexagonal-lambda-nestjs",
  ide: "unknown",
  runtimeTarget: "cursor",
  claudeCode: false,
  retentionDays: 14,
  legacyMonolithPath: "",
  legacyApiBaseDev: "",
};

export function getConfigPath() {
  return CONFIG_PATH;
}

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULTS, _missing: true };
  }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return {
      ...DEFAULTS,
      ...raw,
      retentionDays: Number(raw.retentionDays ?? DEFAULTS.retentionDays),
      claudeCode: Boolean(raw.claudeCode),
    };
  } catch {
    return { ...DEFAULTS, _parseError: true };
  }
}

export function saveConfig(partial) {
  const current = existsSync(CONFIG_PATH)
    ? { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")) }
    : { ...DEFAULTS };
  const next = {
    ...current,
    ...partial,
    retentionDays: Number(partial.retentionDays ?? current.retentionDays ?? DEFAULTS.retentionDays),
    claudeCode: partial.claudeCode ?? current.claudeCode ?? false,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function retentionExpiresAt(config = loadConfig()) {
  const days = Number(config.retentionDays ?? DEFAULTS.retentionDays);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
