import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectIde, ideLabel } from "./ide-detect.js";
import { loadConfig, getConfigPath } from "./config.js";

const HUB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const RUNTIME_LABELS = {
  cursor: "Cursor",
  antigravity: "Antigravity",
  vscode: "VS Code",
  "vscode-claude": "VS Code + Claude Code",
  docker: "Docker",
  unknown: "Runtime IATL",
};

/** Promedios de referencia cuando el proyecto no tiene tickets procesados aún. */
export const BENCHMARK_AGENT_METRICS = {
  iatl: 92.0,
  "tl-peer-daniel": 85.0,
  "patterns-advisor": 90.0,
  "cr-analyst": 88.0,
};

export const BENCHMARK_TICKET_METRICS = {
  avgDurationHours: 18.5,
  acceptanceRate: 78,
  peerBugsPrevented: 1.2,
  timeSavedHours: 12.0,
};

/**
 * Contexto del runtime activo — sin exponer rutas de otro IDE al usuario.
 */
export function resolveRuntimeContext() {
  const config = loadConfig();
  const runtimePath = join(HUB_ROOT, "runtime.json");
  let manifest = {};

  if (existsSync(runtimePath)) {
    try {
      manifest = JSON.parse(readFileSync(runtimePath, "utf8"));
    } catch {
      manifest = {};
    }
  }

  const runtimeTarget =
    process.env.IATL_ACTIVE_RUNTIME ||
    manifest.runtimeTarget ||
    config.runtimeTarget ||
    config.ide ||
    detectIde(process.cwd());

  const runtimeLabel = RUNTIME_LABELS[runtimeTarget] ?? ideLabel(runtimeTarget);

  let repoRoot = manifest.projectRoot ?? config.projectRoot ?? "";
  if (!repoRoot && config.projectRoot) {
    repoRoot = config.projectRoot;
  }
  // Repo arquitectura: env > inferir desde projectRoot del agente
  const architectureRepo =
    process.env.IATL_ARCHITECTURE_REPO ||
    manifest.architectureRepo ||
    "";

  return {
    runtimeTarget,
    runtimeLabel,
    hubScope: `hub IATL (${runtimeLabel})`,
    configPath: getConfigPath(),
    project: config.project ?? "pfi-backend-core",
    architectureRepo: architectureRepo || process.cwd(),
    manifest,
  };
}
