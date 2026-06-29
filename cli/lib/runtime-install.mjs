import { existsSync, statSync } from "node:fs";
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

/**
 * Runtime preferido: flag --runtime > env > variables IDE.
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
  if (process.env.ANTIGRAVITY === "1") return "antigravity";
  if (process.env.CURSOR_AGENT === "1") return "cursor";
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
