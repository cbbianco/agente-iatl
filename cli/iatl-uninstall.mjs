#!/usr/bin/env node
/**
 * CLI de desinstalación IATL.
 * Limpia agentes, bases de datos aisladas (Mongo y Chroma), procesos y archivos del runtime.
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, rmSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync, spawnSync } from "node:child_process";

const RUNTIMES = [
  { key: "cursor", label: "Cursor (~/.cursor)", path: join(homedir(), ".cursor") },
  { key: "vscode", label: "VS Code (~/.iatl)", path: join(homedir(), ".iatl") },
  { key: "vscode-claude", label: "VS Code + Claude Code (~/.claude/iatl)", path: join(homedir(), ".claude", "iatl") },
  { key: "antigravity", label: "Antigravity (~/.antigravity)", path: join(homedir(), ".antigravity") },
];

function parseArgs(argv) {
  const out = { nonInteractive: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--non-interactive") out.nonInteractive = true;
    else if (a === "--force" || a === "-f") out.force = true;
    else if (a === "--runtime" && argv[i + 1]) out.runtime = argv[++i];
  }
  return out;
}

async function askYesNo(rl, question, defaultValue = false) {
  const suffix = defaultValue ? " [Y/n]" : " [y/N]";
  const answer = (await rl.question(`${question}${suffix}: `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return answer === "y" || answer === "yes";
}

async function askChoice(rl, prompt, choices) {
  console.log(`\n${prompt}\n`);
  choices.forEach((c, i) => console.log(`  ${i + 1}) ${c.label}`));
  console.log(`  ${choices.length + 1}) Todos los runtimes`);
  console.log(`  ${choices.length + 2}) Cancelar`);

  const answer = (await rl.question(`\nElige una opción [1-${choices.length + 2}]: `)).trim();
  const idx = parseInt(answer, 10);
  if (isNaN(idx) || idx < 1 || idx > choices.length + 2) {
    return null;
  }
  if (idx === choices.length + 2) {
    return "cancel";
  }
  if (idx === choices.length + 1) {
    return "all";
  }
  return choices[idx - 1];
}

async function killChromaServers() {
  console.log("\n🛑 Deteniendo servidores de ChromaDB activos...");
  try {
    // Buscar y matar procesos de node/chroma que estén corriendo en puertos de 8010 a 8090
    if (process.platform === "win32") {
      execSync("taskkill /F /IM chroma.exe", { stdio: "ignore" });
    } else {
      execSync("pkill -9 -f 'chroma run'", { stdio: "ignore" });
      execSync("pkill -9 -f 'chromadb run'", { stdio: "ignore" });
    }
    console.log("✅ Procesos de ChromaDB detenidos.");
  } catch (e) {
    console.log("ℹ️ No se detectaron servidores ChromaDB activos.");
  }
}

async function cleanMongoDatabases(force) {
  console.log("\n🍃 Limpiando bases de datos MongoDB aisladas...");
  const mongoUri = process.env.IATL_MONGO_URI ?? "mongodb://127.0.0.1:27017";
  let client;
  let MongoClient;

  try {
    const mongoModule = await import("mongodb");
    MongoClient = mongoModule.MongoClient;
  } catch (err) {
    const paths = [
      join(homedir(), ".antigravity", "iatl-knowledge", "node_modules", "mongodb"),
      join(homedir(), ".cursor", "iatl-knowledge", "node_modules", "mongodb"),
      join(homedir(), ".iatl", "node_modules", "mongodb"),
      join(process.cwd(), "mongo", "node_modules", "mongodb")
    ];
    for (const p of paths) {
      try {
        const mongoModule = await import(p);
        MongoClient = mongoModule.MongoClient;
        break;
      } catch (e) {}
    }
  }

  if (!MongoClient) {
    console.log("   ℹ️ El paquete 'mongodb' no está instalado. Omitiendo limpieza de MongoDB.");
    return;
  }

  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    const adminDb = client.db("admin");
    const dbs = await adminDb.admin().listDatabases();
    
    // Filtrar bases de datos que empiecen con iatl_knowledge
    const iatlDbs = dbs.databases
      .map((d) => d.name)
      .filter((name) => name.startsWith("iatl_knowledge"));

    if (iatlDbs.length === 0) {
      console.log("   No se encontraron bases de datos 'iatl_knowledge_*' en MongoDB.");
      return;
    }

    console.log(`   Se encontraron las siguientes bases de datos de IATL:`);
    iatlDbs.forEach((db) => console.log(`     - ${db}`));

    let proceed = force;
    if (!proceed) {
      const rlTemp = createInterface({ input, output });
      proceed = await askYesNo(rlTemp, "¿Deseas eliminar permanentemente estas bases de datos de MongoDB?", false);
      await rlTemp.close();
    }

    if (proceed) {
      for (const dbName of iatlDbs) {
        const db = client.db(dbName);
        await db.dropDatabase();
        console.log(`   ✅ Base de datos drop: ${dbName}`);
      }
    } else {
      console.log("   Drop de base de datos MongoDB omitido.");
    }
  } catch (err) {
    console.warn("   ⚠️ No se pudo conectar a MongoDB o listar las bases de datos:", err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function removeDirectory(dirPath) {
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`   ✅ Eliminado: ${dirPath}`);
    } catch (e) {
      console.error(`   ❌ Error al eliminar ${dirPath}:`, e.message);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  IATL — Desinstalador de Agentes y Entorno       ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  let targetRuntimes = [];
  
  if (args.nonInteractive) {
    if (args.runtime === "all") {
      targetRuntimes = [...RUNTIMES];
    } else {
      const selected = RUNTIMES.find((r) => r.key === args.runtime);
      if (!selected) {
        throw new Error(`❌ Error: Runtime '${args.runtime}' no reconocido.`);
      }
      targetRuntimes = [selected];
    }
  } else {
    const rl = createInterface({ input, output });
    const choice = await askChoice(rl, "Selecciona el entorno/runtime a desinstalar:", RUNTIMES);
    await rl.close();

    if (!choice || choice === "cancel") {
      console.log("❌ Desinstalación cancelada por el usuario.");
      process.exit(0);
    }

    if (choice === "all") {
      targetRuntimes = [...RUNTIMES];
    } else {
      targetRuntimes = [choice];
    }
  }

  // 1. Detener ChromaDB
  await killChromaServers();

  // 2. Limpiar MongoDB
  await cleanMongoDatabases(args.force || args.nonInteractive);

  // 3. Eliminar archivos de runtime
  console.log("\n📁 Eliminando archivos del entorno...");
  for (const runtime of targetRuntimes) {
    console.log(`\nDesinstalando de ${runtime.label}...`);
    
    // Estructuras de directorios
    removeDirectory(join(runtime.path, "agents"));
    removeDirectory(join(runtime.path, "skills"));
    removeDirectory(join(runtime.path, "iatl-knowledge"));
  }

  console.log("\n🎉 Desinstalación de IATL completada exitosamente.");
}

main().catch((err) => {
  console.error("\n❌ Error en desinstalación:", err.message);
  process.exit(1);
});
