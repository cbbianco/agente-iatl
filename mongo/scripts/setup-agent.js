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
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";
import { detectIde, ideLabel } from "./lib/ide-detect.js";
import { loadConfig, saveConfig } from "./lib/config.js";

function isDockerInstalled() {
  try {
    execSync("docker --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function isMongoAlive() {
  const uri = process.env.IATL_MONGO_URI ?? "mongodb://127.0.0.1:27017";
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 1500 });
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

async function resolveMongoStorage(nonInteractive, rl) {
  console.log("\n📡 Verificando estado de MongoDB (127.0.0.1:27017)...");
  if (await isMongoAlive()) {
    console.log("✅ MongoDB activo en 127.0.0.1:27017.");
    return false;
  }

  console.log("⚠️ MongoDB no detectado en el puerto 27017.");
  const hasDocker = isDockerInstalled();

  if (nonInteractive) {
    if (hasDocker) {
      console.log("🐳 Docker detectado. Iniciando contenedor MongoDB automáticamente...");
      try {
        execSync("docker run -d -p 27017:27017 --name iatl-mongo-db -v iatl_mongo_data:/data/db mongo:latest", { stdio: "ignore" });
        console.log("⌛ Esperando 5 segundos a que MongoDB inicie...");
        await new Promise(r => setTimeout(r, 5000));
        if (await isMongoAlive()) {
          console.log("✅ Conexión a MongoDB exitosa.");
          return false;
        }
      } catch (e) {
        console.log("⚠️ Falló el inicio de MongoDB en Docker:", e.message);
      }
    }
    console.log("📄 Usando fallback automático de base de datos local JSON (local-db.json).");
    return true;
  }

  console.log("\nAlternativas:");
  if (hasDocker) {
    console.log("  1) Iniciar automáticamente MongoDB usando Docker");
  } else {
    console.log("  1) [No disponible - Instala Docker] Iniciar MongoDB usando Docker");
  }
  console.log("  2) Utilizar persistencia local liviana basada en archivos JSON (local-db.json)");
  console.log("  3) Cancelar instalación");

  const option = (await ask(rl, "\nElige una opción [1-3]", "2")).trim();

  if (option === "1") {
    if (!hasDocker) {
      console.log("❌ Docker no está instalado en este sistema. Usando base de datos local JSON.");
      return true;
    }
    console.log("🐳 Iniciando MongoDB en Docker...");
    try {
      execSync("docker run -d -p 27017:27017 --name iatl-mongo-db -v iatl_mongo_data:/data/db mongo:latest", { stdio: "ignore" });
      console.log("⌛ Esperando 5 segundos a que inicie el contenedor...");
      await new Promise(r => setTimeout(r, 5000));
      if (await isMongoAlive()) {
        console.log("✅ MongoDB activo en Docker.");
        return false;
      } else {
        console.log("❌ MongoDB no levantó a tiempo. Usando base de datos local JSON.");
        return true;
      }
    } catch (e) {
      console.log("❌ Falló inicio de Docker:", e.message, "\nUsando base de datos local JSON.");
      return true;
    }
  } else if (option === "3") {
    console.log("❌ Instalación cancelada.");
    process.exit(1);
  } else {
    console.log("📄 Configurando base de datos local JSON (local-db.json).");
    return true;
  }
}

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
    else if (a === "--sprint-active" && argv[i + 1]) out.sprintActive = argv[++i] === "true";
    else if (a === "--sprint-duration" && argv[i + 1]) out.sprintDuration = argv[++i];
    else if (a === "--architecture" && argv[i + 1]) out.architectureTarget = argv[++i];
    else if (a === "--architecture-current" && argv[i + 1]) out.architectureCurrent = argv[++i];
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

async function askYesNo(rl, question, defaultYes = true) {
  const def = defaultYes ? "s" : "n";
  const answer = (await ask(rl, `${question} (s/n)`, def)).toLowerCase();
  if (["s", "si", "sí", "y", "yes"].includes(answer)) return true;
  if (["n", "no"].includes(answer)) return false;
  return defaultYes;
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
      sprintActive: args.sprintActive ?? config.sprintActive ?? false,
      sprintLabel: args.sprintLabel ?? config.sprintLabel ?? "",
      sprintDuration: args.sprintDuration ?? config.sprintDuration ?? "",
      architectureTarget:
        args.architectureTarget ?? config.architectureTarget ?? "hexagonal-lambda-nestjs",
      architectureCurrent:
        args.architectureCurrent ?? config.architectureCurrent ?? "layered",
      retentionDays: Number(args.retentionDays ?? config.retentionDays ?? 14),
      legacyMonolithPath: args.legacyMonolithPath ?? config.legacyMonolithPath ?? "",
      legacyApiBaseDev: args.legacyApiBaseDev ?? config.legacyApiBaseDev ?? "",
    };
    config.useLocalJsonDb = await resolveMongoStorage(true, null);
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
    const hasSprint = await askYesNo(rl, "¿Tienes un Sprint activo?", true);
    if (hasSprint) {
      config.sprintActive = true;
      config.sprintLabel = await ask(rl, "En qué Sprint vas (sprintLabel - ej. 2026-S12)", current.sprintLabel || "Sprint 1");
      config.sprintDuration = await ask(rl, "Duración del Sprint (ej. 2 semanas)", current.sprintDuration || "2 semanas");
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
        current.architectureTarget || "hexagonal-lambda-nestjs",
      );
    } else {
      config.architectureTarget = "";
    }
    const hasCurrentArch = await askYesNo(rl, "¿Tienes una arquitectura actual del proyecto base?", true);
    if (hasCurrentArch) {
      config.architectureCurrent = await ask(
        rl,
        "Especifica la arquitectura actual (architectureCurrent)",
        current.architectureCurrent || "layered",
      );
    } else {
      config.architectureCurrent = "";
    }
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
    config.useLocalJsonDb = await resolveMongoStorage(false, rl);
    await rl.close();
  }

  // Generar configuraciones dinámicas y aisladas por proyecto para ChromaDB
  const projectSlug = config.project.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "default_project";
  let hash = 0;
  for (let i = 0; i < config.project.length; i++) {
    hash = config.project.charCodeAt(i) + ((hash << 5) - hash);
  }
  const port = 8010 + (Math.abs(hash) % 80);

  config.chroma = {
    host: "127.0.0.1",
    port,
    collection: `iatl_semantic_${projectSlug}`
  };

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
