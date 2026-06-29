import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { RUNTIME_PATHS } from "./paths.mjs";

/**
 * Comprueba si IATL está instalado para un runtime (hub operativo completo).
 * @param {string} runtimeTarget
 */
export function isRuntimeInstalled(runtimeTarget) {
  const info = RUNTIME_PATHS[runtimeTarget];
  if (!info) return false;
  const hub = info.hub;
  return (
    existsSync(join(hub, "config.json")) &&
    existsSync(join(hub, "dashboard.js")) &&
    existsSync(join(hub, "query.js"))
  );
}

/** @returns {Array<{ runtime: string, hubPath: string, label: string, mtime: number }>} */
export function findInstalledRuntimes() {
  const found = [];
  for (const [runtime, info] of Object.entries(RUNTIME_PATHS)) {
    const configPath = join(info.hub, "config.json");
    if (!isRuntimeInstalled(runtime)) continue;
    const stat = statSync(configPath);
    found.push({
      runtime,
      hubPath: info.hub,
      label: info.label,
      mtime: stat.mtimeMs,
    });
  }
  found.sort((a, b) => b.mtime - a.mtime);
  return found;
}

function getIdeFromProcessTree() {
  if (process.platform === 'win32') return null;
  try {
    let currentPid = process.pid;
    let iterations = 0;
    while (currentPid && currentPid !== "1" && currentPid !== "0" && iterations < 30) {
      iterations++;
      const output = execSync(`ps -o ppid= -o comm= -p ${currentPid}`).toString().trim();
      if (!output) break;
      
      const parts = output.trim().split(/\s+/);
      const ppid = parts.shift();
      const comm = parts.join(' ').toLowerCase();
      
      if (comm.includes('cursor')) return 'cursor';
      if (comm.includes('antigravity')) return 'antigravity';
      if (comm.includes('code')) return 'vscode';
      
      currentPid = ppid;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

/**
 * Runtime preferido: flag --runtime > env > variables IDE > dynamic process tree
 * @param {string[]} [argv]
 * @returns {string | null}
 */
export function detectPreferredRuntime(argv = process.argv) {
  const idx = argv.indexOf("--runtime");
  if (idx !== -1 && argv[idx + 1] && RUNTIME_PATHS[argv[idx + 1]]) {
    return argv[idx + 1];
  }
  if (process.env.IATL_ACTIVE_RUNTIME && RUNTIME_PATHS[process.env.IATL_ACTIVE_RUNTIME]) {
    return process.env.IATL_ACTIVE_RUNTIME;
  }
  
  // Dynamic process tree detection
  const treeIde = getIdeFromProcessTree();
  if (treeIde) return treeIde;
  
  // Fallback Antigravity detection
  if (
    process.env.ANTIGRAVITY === "1" ||
    process.env.ANTIGRAVITY_AGENT === "1" ||
    process.env.CHROME_DESKTOP === "antigravity.desktop" ||
    process.env.ANTIGRAVITY_EDITOR_APP_ROOT ||
    (process.env.VSCODE_NLS_CONFIG && process.env.VSCODE_NLS_CONFIG.includes("antigravity"))
  ) {
    return "antigravity";
  }

  // Fallback Cursor detection
  if (
    process.env.CURSOR_AGENT === "1" ||
    process.env.TERM_PROGRAM === "Cursor" ||
    (process.env.TERM_PROGRAM_VERSION && process.env.TERM_PROGRAM_VERSION.toLowerCase().includes("cursor")) ||
    (process.env.VSCODE_IPC_HOOK && process.env.VSCODE_IPC_HOOK.toLowerCase().includes("cursor"))
  ) {
    return "cursor";
  }

  // Fallback VS Code detection
  if (process.env.TERM_PROGRAM === "vscode") {
    // If it has claude code, maybe vscode-claude? We'll fallback to vscode for now.
    return "vscode";
  }

  if (process.env.IATL_IDE && RUNTIME_PATHS[process.env.IATL_IDE]) {
    return process.env.IATL_IDE;
  }
  
  return null;
}

/**
 * @param {string} runtimeTarget
 */
export function printNotInstalledMessage(runtimeTarget) {
  const info = RUNTIME_PATHS[runtimeTarget];
  const label = info?.label ?? runtimeTarget;
  const runtimeKey = info ? runtimeTarget : "antigravity";

  console.error(`\n╔══════════════════════════════════════════════════╗`);
  console.error(`║  IATL — Agente no instalado                      ║`);
  console.error(`╚══════════════════════════════════════════════════╝\n`);
  console.error(`❌ El dashboard requiere IATL instalado para ${label}.`);
  console.error(`   No se encontró el hub operativo de este runtime.\n`);
  console.error(`Instala el agente y vuelve a ejecutar el dashboard:\n`);
  console.error(`  npm run install:iatl -- --runtime ${runtimeKey}`);
  console.error(`\nO usa el asistente gráfico:\n`);
  console.error(`  npm run install:gui\n`);
}

export function printNoInstallationFoundMessage() {
  console.error(`\n╔══════════════════════════════════════════════════╗`);
  console.error(`║  IATL — Agente no instalado                      ║`);
  console.error(`╚══════════════════════════════════════════════════╝\n`);
  console.error(`❌ No hay ninguna instalación IATL activa en este equipo.\n`);
  console.error(`Instala primero para tu IDE (ej. Antigravity o Cursor):\n`);
  console.error(`  npm run install:iatl -- --runtime antigravity`);
  console.error(`  npm run install:iatl -- --runtime cursor`);
  console.error(`\nLuego inicia el dashboard:\n`);
  console.error(`  npm run dashboard\n`);
}
