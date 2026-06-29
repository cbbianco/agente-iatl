import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Hubs operativos conocidos por runtime (sin exponer rutas en API pública). */
export const RUNTIME_HUB_DEFINITIONS = [
  { runtime: "antigravity", label: "Antigravity", hubDir: join(homedir(), ".antigravity", "iatl-knowledge") },
  { runtime: "cursor", label: "Cursor", hubDir: join(homedir(), ".cursor", "iatl-knowledge") },
  { runtime: "vscode-claude", label: "VS Code + Claude Code", hubDir: join(homedir(), ".claude", "iatl-knowledge") },
  { runtime: "vscode", label: "VS Code", hubDir: join(homedir(), ".iatl", "iatl-knowledge") },
  { runtime: "docker", label: "Docker", hubDir: "/opt/iatl/iatl-knowledge" },
];

function readJsonSafe(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function isHubOperational(hubDir) {
  return (
    existsSync(join(hubDir, "config.json")) &&
    existsSync(join(hubDir, "dashboard.js")) &&
    existsSync(join(hubDir, "query.js"))
  );
}

/**
 * Lee el perfil de un hub instalado (proyecto activo, runtime declarado, versión).
 * @param {string} hubDir
 * @param {{ runtime: string, label: string }} def
 */
export function readInstalledHubProfile(hubDir, def) {
  const config = readJsonSafe(join(hubDir, "config.json")) ?? {};
  const manifest = readJsonSafe(join(hubDir, "runtime.json")) ?? {};
  const runtimeTarget =
    manifest.runtimeTarget || config.runtimeTarget || config.ide || def.runtime;
  const configStat = existsSync(join(hubDir, "config.json"))
    ? statSync(join(hubDir, "config.json"))
    : null;

  return {
    runtime: def.runtime,
    label: manifest.paths?.label || def.label,
    installed: true,
    project: config.project ?? null,
    runtimeTarget,
    repoVersion: manifest.repoVersion ?? null,
    installedAt: manifest.installedAt ?? (configStat ? configStat.mtime.toISOString() : null),
    hasProjectRoot: Boolean(manifest.projectRoot || config.projectRoot),
  };
}

/**
 * Escanea todos los runtimes con hub IATL instalado en el equipo.
 * @param {string} [currentHubDir] — hub desde el que corre el dashboard
 */
export function scanInstalledRuntimes(currentHubDir = "") {
  const normalizedCurrent = currentHubDir.replace(/\/$/, "");
  const installations = [];

  for (const def of RUNTIME_HUB_DEFINITIONS) {
    if (!isHubOperational(def.hubDir)) continue;
    const profile = readInstalledHubProfile(def.hubDir, def);
    installations.push({
      ...profile,
      isDashboardHost: normalizedCurrent
        ? def.hubDir.replace(/\/$/, "") === normalizedCurrent
        : false,
    });
  }

  installations.sort((a, b) => {
    if (a.isDashboardHost !== b.isDashboardHost) return a.isDashboardHost ? -1 : 1;
    const ta = a.installedAt ? new Date(a.installedAt).getTime() : 0;
    const tb = b.installedAt ? new Date(b.installedAt).getTime() : 0;
    return tb - ta;
  });

  return installations;
}

/**
 * Mapa proyecto → IDEs donde está configurado como activo.
 * @param {ReturnType<typeof scanInstalledRuntimes>} installations
 */
export function groupProjectsByRuntime(installations) {
  /** @type {Record<string, Array<{ runtime: string, label: string, isDashboardHost: boolean }>>} */
  const byProject = {};
  for (const inst of installations) {
    if (!inst.project) continue;
    if (!byProject[inst.project]) byProject[inst.project] = [];
    byProject[inst.project].push({
      runtime: inst.runtime,
      label: inst.label,
      isDashboardHost: inst.isDashboardHost,
    });
  }
  return byProject;
}

/**
 * Resumen para API del dashboard (sin rutas de filesystem).
 * @param {string} currentHubDir
 * @param {string} currentRuntimeTarget
 * @param {string} currentRuntimeLabel
 */
export function buildInstallationSummary(currentHubDir, currentRuntimeTarget, currentRuntimeLabel) {
  const installations = scanInstalledRuntimes(currentHubDir);
  const projectsByRuntime = groupProjectsByRuntime(installations);
  const installedLabels = installations.map((i) => i.label);
  const host = installations.find((i) => i.isDashboardHost);

  return {
    currentRuntime: currentRuntimeTarget,
    currentRuntimeLabel: host?.label || currentRuntimeLabel,
    dashboardHostRuntime: host?.runtime ?? currentRuntimeTarget,
    installedRuntimes: installations.map(({ runtime, label, project, repoVersion, installedAt, isDashboardHost }) => ({
      runtime,
      label,
      project,
      repoVersion,
      installedAt,
      isDashboardHost,
    })),
    installedRuntimeLabels: installedLabels,
    projectsByRuntime,
  };
}
