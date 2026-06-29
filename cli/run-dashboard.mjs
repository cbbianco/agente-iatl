#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn, exec } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { RUNTIME_PATHS } from "./lib/paths.mjs";
import {
  isRuntimeInstalled,
  findInstalledRuntimes,
  detectPreferredRuntime,
  printNotInstalledMessage,
  printNoInstallationFoundMessage,
} from "./lib/runtime-install.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");
const DEFAULT_PORT = 8030;

function openBrowser(url) {
  const start =
    platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  exec(`${start} "${url}"`, () => {});
}

function serveInstallRequiredPage(runtimeTarget) {
  const info = RUNTIME_PATHS[runtimeTarget] ?? RUNTIME_PATHS.antigravity;
  const label = info.label;
  const runtimeKey = RUNTIME_PATHS[runtimeTarget] ? runtimeTarget : "antigravity";

  const templatePath = join(REPO_ROOT, "mongo", "scripts", "install-required.html");
  let html = existsSync(templatePath)
    ? readFileSync(templatePath, "utf8")
    : "<h1>Instala IATL primero</h1>";

  html = html
    .replaceAll("{{RUNTIME_LABEL}}", label)
    .replaceAll("{{INSTALL_CMD}}", `npm run install:iatl -- --runtime ${runtimeKey}`);

  function listen(port) {
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && port < DEFAULT_PORT + 5) {
        listen(port + 1);
        return;
      }
      console.error("❌ No se pudo abrir la página informativa:", err.message);
      process.exit(1);
    });

    server.listen(port, "127.0.0.1", () => {
      const url = `http://127.0.0.1:${port}`;
      console.error(`\n📄 Página informativa: ${url}`);
      console.error(`   (El dashboard completo no está disponible sin instalación.)\n`);
      openBrowser(url);
    });
  }

  listen(DEFAULT_PORT);
}

function launch(hubInfo) {
  const { hubPath, runtime, label } = hubInfo;
  console.log(`📡 Iniciando Dashboard IATL (${label})`);
  console.log(`📦 Hub operativo del runtime seleccionado\n`);

  const env = {
    ...process.env,
    IATL_ACTIVE_RUNTIME: runtime,
  };

  const proc = spawn(process.execPath, ["dashboard.js"], {
    cwd: hubPath,
    stdio: "inherit",
    env,
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

function launchLocalDevFallback() {
  const localHub = join(REPO_ROOT, "mongo", "scripts");
  const localNodeModules = join(REPO_ROOT, "mongo", "node_modules");

  if (!existsSync(localNodeModules)) {
    printNoInstallationFoundMessage();
    process.exit(1);
  }

  console.log("⚠️ Modo desarrollo (--dev): dashboard local del repositorio...");
  launch({ hubPath: localHub, runtime: "vscode", label: "Desarrollo local" });
}

function resolveHub() {
  const isDev = process.argv.includes("--dev");
  const preferred = detectPreferredRuntime();

  if (preferred) {
    if (!isRuntimeInstalled(preferred)) {
      printNotInstalledMessage(preferred);
      serveInstallRequiredPage(preferred);
      return null;
    }
    const info = RUNTIME_PATHS[preferred];
    return { hubPath: info.hub, runtime: preferred, label: info.label };
  }

  const installed = findInstalledRuntimes();
  if (installed.length === 0) {
    if (isDev) {
      launchLocalDevFallback();
      return null;
    }
    printNoInstallationFoundMessage();
    serveInstallRequiredPage("antigravity");
    return null;
  }

  const best = installed[0];
  return { hubPath: best.hubPath, runtime: best.runtime, label: best.label };
}

const hub = resolveHub();
if (hub) {
  launch(hub);
}
