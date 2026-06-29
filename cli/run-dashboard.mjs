#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RUNTIME_PATHS } from "./lib/paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");

function findActiveHub() {
  const hubsFound = [];
  for (const [key, info] of Object.entries(RUNTIME_PATHS)) {
    const configPath = join(info.hub, "config.json");
    const dashboardScript = join(info.hub, "dashboard.js");
    if (existsSync(configPath) && existsSync(dashboardScript)) {
      const stat = statSync(configPath);
      hubsFound.push({
        runtime: key,
        hubPath: info.hub,
        mtime: stat.mtimeMs,
      });
    }
  }
  
  if (hubsFound.length === 0) {
    return null;
  }
  
  // Sort by most recently modified config
  hubsFound.sort((a, b) => b.mtime - a.mtime);
  return hubsFound[0].hubPath;
}

function launch(hubPath) {
  console.log(`📡 Iniciando Dashboard de Control desde el Hub activo:`);
  console.log(`👉 Ruta: ${hubPath}\n`);

  const proc = spawn(process.execPath, ["dashboard.js"], {
    cwd: hubPath,
    stdio: "inherit",
  });

  proc.on("error", (err) => {
    console.error("❌ Error al iniciar el proceso del dashboard:", err.message);
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n💡 El proceso terminó con código ${code}.`);
    }
  });
}

function launchLocalFallback() {
  const localHub = join(REPO_ROOT, "mongo", "scripts");
  const localNodeModules = join(REPO_ROOT, "mongo", "node_modules");

  if (!existsSync(localNodeModules)) {
    console.error("❌ Error: No se detectó ninguna instalación activa del Hub, y el entorno local del repositorio no tiene dependencias instaladas.");
    console.log("\nPara solucionarlo, por favor:");
    console.log("  1) Instala el agente para tu IDE ejecutando: npm run install:iatl");
    console.log("  O bien:");
    console.log("  2) Instala las dependencias locales ejecutando: cd mongo && npm install");
    process.exit(1);
  }

  console.log("⚠️ Advertencia: Ejecutando dashboard local de desarrollo (fallback)...");
  launch(localHub);
}

const activeHub = findActiveHub();
if (activeHub) {
  launch(activeHub);
} else {
  launchLocalFallback();
}
