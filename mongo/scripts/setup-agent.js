#!/usr/bin/env node
/**
 * Wizard de instalación / reconfiguración del agente IATL.
 *
 * Flujo:
 *  1) Reconocimiento de IDE/runtime (Cursor | VS Code | Antigravity | Docker)
 *  2) Preguntas de configuración (proyecto, contexto, sprint, arquitectura, legacy)
 *  3) Persistencia config.json + init Mongo + seed + migración Chroma
 *
 * Uso:
 *   node setup-agent.js
 *   node setup-agent.js --non-interactive --project pfi-backend-core --sprint 2026-S12
 *   node setup-agent.js --runtime cursor --legacy-path /path/to/legacy
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { detectIde, ideLabel } from "./lib/ide-detect.js";
import { loadConfig, saveConfig } from "./lib/config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const out = { nonInteractive: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--non-interactive") out.nonInteractive = true;
    else if (a === "--project" && argv[i + 1]) out.project = argv[++i];
    else if (a === "--project-root" && argv[i + 1]) out.projectRoot = argv[++i];
    else if (a === "--context" && argv[i + 1]) out.projectContext = argv[++i];
    else if (a === "--sprint" && argv[i + 1]) out.sprintLabel = argv[++i];
    else if (a === "--architecture" && argv[i + 1]) out.architectureTarget = argv[++i];
    else if (a === "--retention" && argv[i + 1]) out.retentionDays = argv[++i];
    else if (a === "--ide" && argv[i + 1]) out.ide = argv[++i];
    else if (a === "--runtime" && argv[i + 1]) out.runtime = argv[++i];
    else if (a === "--legacy-path" && argv[i + 1]) out.legacyMonolithPath = argv[++i];
    else if (a === "--legacy-api" && argv[i + 1]) out.legacyApiBaseDev = argv[++i];
    else if (a === "--skip-migrate") out.skipMigrate = true;
  }
  return out;
}

async function ask(rl, question, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
}

function runNode(script, extraArgs = []) {
  const res = spawnSync(process.execPath, [join(ROOT, script), ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (res.status !== 0) {
    throw new Error(`Falló ${script} (exit ${res.status})`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const detectedIde = args.runtime ?? args.ide ?? detectIde();
  const current = loadConfig();

  console.log("\n=== IATL — Instalación / configuración ===\n");
  console.log(`Runtime detectado: ${ideLabel(detectedIde)} (${detectedIde})\n`);

  let config = { ...current };

  if (args.nonInteractive) {
    const projRoot = args.projectRoot ?? config.projectRoot;
    if (!projRoot) {
      throw new Error("❌ Error: El projectRoot es requerido para la instalación.");
    }
    config = {
      ...config,
      ide: detectedIde,
      runtimeTarget: detectedIde,
      project: args.project ?? config.project ?? "pfi-backend-core",
      projectRoot: projRoot,
      projectContext:
        args.projectContext ??
        config.projectContext ??
        "Backend NestJS lambdas hexagonales PFI (Aduana Chile)",
      sprintLabel: args.sprintLabel ?? config.sprintLabel ?? "",
      architectureTarget:
        args.architectureTarget ?? config.architectureTarget ?? "hexagonal-lambda-nestjs",
      retentionDays: Number(args.retentionDays ?? config.retentionDays ?? 14),
      legacyMonolithPath: args.legacyMonolithPath ?? config.legacyMonolithPath ?? "",
      legacyApiBaseDev: args.legacyApiBaseDev ?? config.legacyApiBaseDev ?? "",
    };
  } else {
    const rl = createInterface({ input, output });

    console.log("--- Configuración del proyecto ---\n");

    config.ide = detectedIde;
    config.runtimeTarget = detectedIde;
    
    let proj = args.project ?? current.project ?? "";
    while (!proj) {
      proj = await ask(rl, "Nombre del Proyecto (project)", "pfi-backend-core");
      if (!proj) {
        console.log("❌ El proyecto (slug) es obligatorio.");
      }
    }
    config.project = proj;

    let root = args.projectRoot ?? current.projectRoot ?? "";
    while (!root) {
      root = await ask(rl, "Ruta checkout del proyecto (projectRoot)", "");
      if (!root) {
        console.log("❌ El projectRoot es obligatorio.");
      } else if (!existsSync(root)) {
        console.log(`⚠️ La ruta '${root}' no existe. Por favor ingresa una ruta válida.`);
        root = "";
      }
    }
    config.projectRoot = root;

    config.projectContext = await ask(
      rl,
      "Contexto del proyecto (1 línea)",
      current.projectContext ??
        "Backend PFI: lambdas NestJS hexagonales, API Gateway, integración legacy Aduana",
    );
    config.sprintLabel = await ask(rl, "Sprint activo (ej. 2026-S12)", current.sprintLabel ?? "");
    config.architectureTarget = await ask(
      rl,
      "Arquitectura a utilizar",
      current.architectureTarget ?? "hexagonal-lambda-nestjs",
    );
    config.legacyMonolithPath = await ask(
      rl,
      "Ruta monolito legacy SAM (opcional)",
      current.legacyMonolithPath ?? "",
    );
    config.legacyApiBaseDev = await ask(
      rl,
      "API legacy DEV base URL (opcional)",
      current.legacyApiBaseDev ?? "",
    );
    const retention = await ask(rl, "Retención cierres HITL (días)", String(current.retentionDays ?? 14));
    config.retentionDays = Number(retention);

    await rl.close();
  }

  const saved = saveConfig(config);
  console.log("\n✅ config.json actualizado:");
  console.log(JSON.stringify(saved, null, 2));

  console.log("\n--- Inicializando hub ---\n");
  runNode("init-indexes.js");
  runNode("seed-knowledge-sources.js");

  if (!args.skipMigrate) {
    console.log("\n--- Migrando conocimiento semántico → ChromaDB ---\n");
    runNode("migrate-to-chroma.js");
  }

  console.log("\n--- Ejecutando revisión autónoma de arquitectura (COE Review) ---\n");
  try {
    runNode("coe-review.js");
  } catch (err) {
    console.warn("⚠️ Advertencia: No se pudo completar la revisión COE autónoma:", err.message);
  }

  console.log("\n✅ Agente IATL listo.");
  console.log("   Consulta: node query.js --project-config");
  console.log("   Clasificar: node query.js --classify-ticket --summary \"...\" --issue-type Story\n");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
