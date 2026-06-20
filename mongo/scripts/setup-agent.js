#!/usr/bin/env node
/**
 * Wizard de instalación / reconfiguración del agente IATL.
 *
 * Flujo:
 *  1) Reconocimiento de IDE (Cursor | Antigravity)
 *  2) Preguntas de configuración (proyecto, contexto, sprint, arquitectura)
 *  3) Persistencia config.json + init Mongo + seed + migración Chroma
 *
 * Uso:
 *   node setup-agent.js
 *   node setup-agent.js --non-interactive --project pfi-backend-core --sprint 2026-S12
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { detectIde, ideLabel } from "./lib/ide-detect.js";
import { loadConfig, saveConfig } from "./lib/config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const out = { nonInteractive: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--non-interactive") out.nonInteractive = true;
    else if (a === "--project" && argv[i + 1]) out.project = argv[++i];
    else if (a === "--context" && argv[i + 1]) out.projectContext = argv[++i];
    else if (a === "--sprint" && argv[i + 1]) out.sprintLabel = argv[++i];
    else if (a === "--architecture" && argv[i + 1]) out.architectureTarget = argv[++i];
    else if (a === "--retention" && argv[i + 1]) out.retentionDays = argv[++i];
    else if (a === "--ide" && argv[i + 1]) out.ide = argv[++i];
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
  const detectedIde = args.ide ?? detectIde();
  const current = loadConfig();

  console.log("\n=== IATL — Instalación / configuración ===\n");
  console.log(`IDE detectado: ${ideLabel(detectedIde)} (${detectedIde})\n`);

  let config = { ...current };

  if (args.nonInteractive) {
    config = {
      ...config,
      ide: detectedIde,
      project: args.project ?? config.project ?? "pfi-backend-core",
      projectContext:
        args.projectContext ??
        config.projectContext ??
        "Backend NestJS lambdas hexagonales PFI (Aduana Chile)",
      sprintLabel: args.sprintLabel ?? config.sprintLabel ?? "",
      architectureTarget:
        args.architectureTarget ?? config.architectureTarget ?? "hexagonal-lambda-nestjs",
      retentionDays: Number(args.retentionDays ?? config.retentionDays ?? 14),
    };
  } else {
    const rl = createInterface({ input, output });

    console.log("--- Configuración del proyecto ---\n");

    config.ide = detectedIde;
    config.project = await ask(rl, "Proyecto (repo/slug)", current.project ?? "pfi-backend-core");
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

  console.log("\n✅ Agente IATL listo. Interfaz @iatl sin cambios.");
  console.log("   Consulta: node query.js --project-config");
  console.log("   Semántica: node query.js --semantic-search \"pool postgres qa\"\n");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
