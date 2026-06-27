#!/usr/bin/env node
/**
 * CLI de instalación portable IATL.
 *
 * Pregunta configuración de proyecto + runtime (Cursor, VS Code, Antigravity, Docker)
 * e instala agentes, skills y hub en la ubicación correspondiente.
 *
 * Uso:
 *   node cli/iatl-install.mjs
 *   npm run install:iatl
 *   iatl-install --runtime cursor --project pfi-backend-core --non-interactive
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { RUNTIME_CHOICES } from "./lib/paths.mjs";
import { getRepoRoot, installArtifacts, runHubSetup } from "./lib/install-target.mjs";

function parseArgs(argv) {
  const out = { nonInteractive: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--non-interactive") out.nonInteractive = true;
    else if (a === "--runtime" && argv[i + 1]) out.runtime = argv[++i];
    else if (a === "--project" && argv[i + 1]) out.project = argv[++i];
    else if (a === "--context" && argv[i + 1]) out.projectContext = argv[++i];
    else if (a === "--sprint" && argv[i + 1]) out.sprintLabel = argv[++i];
    else if (a === "--sprint-active" && argv[i + 1]) out.sprintActive = argv[++i] === "true";
    else if (a === "--sprint-duration" && argv[i + 1]) out.sprintDuration = argv[++i];
    else if (a === "--architecture" && argv[i + 1]) out.architectureTarget = argv[++i];
    else if (a === "--architecture-current" && argv[i + 1]) out.architectureCurrent = argv[++i];
    else if (a === "--retention" && argv[i + 1]) out.retentionDays = argv[++i];
    else if (a === "--legacy-path" && argv[i + 1]) out.legacyMonolithPath = argv[++i];
    else if (a === "--legacy-api" && argv[i + 1]) out.legacyApiBaseDev = argv[++i];
    else if (a === "--project-root" && argv[i + 1]) out.projectRoot = argv[++i];
    else if (a === "--skip-hub-setup") out.skipHubSetup = true;
    else if (a === "--claude-code") out.claudeCode = true;
    else if (a === "--no-claude-code") out.claudeCode = false;
  }
  return out;
}

async function ask(rl, question, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
}

async function askChoice(rl, prompt, choices, defaultValue) {
  console.log(`\n${prompt}\n`);
  choices.forEach((c, i) => console.log(`  ${i + 1}) ${c.label}`));
  const raw = await ask(rl, `Elige (1-${choices.length})`, String(defaultValue));
  const idx = Number(raw) - 1;
  if (idx >= 0 && idx < choices.length) return choices[idx].value;
  return defaultValue;
}

async function askYesNo(rl, question, defaultYes = true) {
  const def = defaultYes ? "s" : "n";
  const answer = (await ask(rl, `${question} (s/n)`, def)).toLowerCase();
  if (["s", "si", "sí", "y", "yes"].includes(answer)) return true;
  if (["n", "no"].includes(answer)) return false;
  return defaultYes;
}

function defaultProjectRoot() {
  const guess = join(homedir(), "Documentos", "Proyectos", "Arkho", "PFI", "Node", "CLONE", "pfi-backend-core");
  return existsSync(guess) ? guess : process.cwd();
}

async function main() {
  const args = parseArgs(process.argv);
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  IATL — Instalador portable multi-runtime        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`Repo arquitectura: ${getRepoRoot()}\n`);

  let runtime = args.runtime;
  let claudeCode = args.claudeCode;
  let config = {
    project: args.project ?? "",
    projectContext:
      args.projectContext ??
      "Backend PFI: lambdas NestJS hexagonales, API Gateway, integración legacy Aduana",
    sprintActive: args.sprintActive ?? false,
    sprintLabel: args.sprintLabel ?? "",
    sprintDuration: args.sprintDuration ?? "",
    architectureTarget: args.architectureTarget ?? "hexagonal-lambda-nestjs",
    architectureCurrent: args.architectureCurrent ?? "layered",
    retentionDays: Number(args.retentionDays ?? 14),
    legacyMonolithPath: args.legacyMonolithPath ?? "",
    legacyApiBaseDev: args.legacyApiBaseDev ?? "",
  };
  let projectRoot = args.projectRoot ?? "";
  
  if (args.nonInteractive) {
    if (!projectRoot) {
      throw new Error("❌ Error: --project-root es requerido en modo no interactivo.");
    }
    if (!config.project) {
      throw new Error("❌ Error: --project es requerido en modo no interactivo.");
    }
    runtime = runtime ?? "cursor";
    if (runtime === "vscode" && claudeCode) runtime = "vscode-claude";
  } else {
    const rl = createInterface({ input, output });

    console.log("--- ¿Dónde vas a correr IATL? ---\n");
    runtime = await askChoice(rl, "Runtime objetivo", RUNTIME_CHOICES, runtime ?? "1");

    if (runtime === "vscode") {
      claudeCode = await askYesNo(rl, "¿Tienes Claude Code instalado en VS Code?", false);
      if (claudeCode) runtime = "vscode-claude";
    }

    if (runtime === "docker") {
      console.log("\n→ Se generará stack Docker (Mongo + Chroma + hub) en .iatl-docker/\n");
    }

    console.log("\n--- Configuración del proyecto ---\n");
    
    let proj = config.project ?? "";
    while (!proj) {
      proj = await ask(rl, "Nombre del Proyecto (project)", "pfi-backend-core");
      if (!proj) {
        console.log("❌ El proyecto (slug) es obligatorio.");
      }
    }
    config.project = proj;

    config.projectContext = await ask(rl, "Contexto del proyecto (1 línea)", config.projectContext);
    const hasSprint = await askYesNo(rl, "¿Tienes un Sprint activo?", true);
    if (hasSprint) {
      config.sprintActive = true;
      config.sprintLabel = await ask(rl, "En qué Sprint vas (sprintLabel - ej. 2026-S12)", config.sprintLabel || "Sprint 1");
      config.sprintDuration = await ask(rl, "Duración del Sprint (ej. 2 semanas)", config.sprintDuration || "2 semanas");
    } else {
      config.sprintActive = false;
      config.sprintLabel = "";
      config.sprintDuration = "";
    }
    const hasTargetArch = await askYesNo(rl, "¿Tienes una arquitectura deseada/objetivo?", true);
    if (hasTargetArch) {
      config.architectureTarget = await ask(
        rl,
        "Especifica la arquitectura objetivo (architectureTarget)",
        config.architectureTarget || "hexagonal-lambda-nestjs",
      );
    } else {
      config.architectureTarget = "";
    }
    config.architectureCurrent = await ask(
      rl,
      "Arquitectura actual del proyecto base (architectureCurrent)",
      config.architectureCurrent || "layered",
    );
    config.retentionDays = Number(
      await ask(rl, "Retención cierres HITL (días)", String(config.retentionDays)),
    );
    config.legacyMonolithPath = await ask(
      rl,
      "Ruta monolito legacy SAM (opcional)",
      config.legacyMonolithPath,
    );
    config.legacyApiBaseDev = await ask(
      rl,
      "API legacy DEV base URL (opcional)",
      config.legacyApiBaseDev,
    );

    let guessRoot = defaultProjectRoot();
    while (!projectRoot) {
      projectRoot = await ask(rl, "Ruta checkout de código (projectRoot)", guessRoot);
      if (!projectRoot) {
        console.log("❌ El projectRoot es obligatorio.");
      } else if (!existsSync(projectRoot)) {
        console.log(`⚠️ La ruta '${projectRoot}' no existe. Por favor ingresa una ruta válida.`);
        projectRoot = "";
      }
    }

    await rl.close();
  }

  console.log(`\n→ Instalando para runtime: ${runtime}\n`);

  const { paths, agentsCopied } = installArtifacts(runtime, projectRoot);
  console.log(`✅ Agentes copiados: ${agentsCopied} → ${paths.agents}`);
  console.log(`✅ Hub instalado en: ${paths.hub}`);
  console.log(`✅ Skills (stubs repo) en: ${paths.skills}`);

  if (!args.skipHubSetup && runtime !== "docker") {
    console.log("\n--- Configurando hub Mongo + Chroma ---\n");
    const setupFlags = [
      "--non-interactive",
      "--project",
      config.project,
      "--project-root",
      projectRoot,
      "--context",
      config.projectContext,
      "--sprint-active",
      String(config.sprintActive),
      "--sprint",
      config.sprintLabel,
      "--sprint-duration",
      config.sprintDuration,
      "--architecture",
      config.architectureTarget,
      "--retention",
      String(config.retentionDays),
      "--runtime",
      runtime,
    ];
    if (config.legacyMonolithPath) {
      setupFlags.push("--legacy-path", config.legacyMonolithPath);
    }
    if (config.legacyApiBaseDev) {
      setupFlags.push("--legacy-api", config.legacyApiBaseDev);
    }
    runHubSetup(paths.hub, setupFlags);
  }

  if (runtime === "docker") {
    const dockerOut = join(projectRoot, ".iatl-docker");
    console.log(`\n✅ Stack Docker generado en: ${dockerOut}`);
    console.log("   Siguiente paso:");
    console.log(`   cd ${dockerOut} && docker compose up -d\n`);
  }

  console.log("\n✅ Instalación IATL completada.");
  console.log("   Clasificar ticket: node query.js --classify-ticket --summary \"...\" --issue-type Bug");
  console.log("   Arranque sesión:   node query.js --project-config\n");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
