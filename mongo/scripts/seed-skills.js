#!/usr/bin/env node
/**
 * Siembra los skills del repositorio en la colección centralizada 'skills' de MongoDB.
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig } from "./lib/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const db = await getDb();
  const config = loadConfig();
  const project = config.project ?? "pfi-backend-core";
  const now = new Date();

  const runtime = config.runtimeTarget ?? config.ide ?? "cursor";
  const SKILLS_SRC_DIR = runtime === "vscode-claude"
    ? join(__dirname, "..", "..", "iatl", "skills")
    : join(__dirname, "..", "skills");

  if (!existsSync(SKILLS_SRC_DIR)) {
    console.log(`⚠️ No se encontró la carpeta de skills local en: ${SKILLS_SRC_DIR}`);
    await closeDb();
    return;
  }


  const skillsList = readdirSync(SKILLS_SRC_DIR);
  let seededCount = 0;

  for (const entry of skillsList) {
    const srcPath = join(SKILLS_SRC_DIR, entry);
    const isDir = statSync(srcPath).isDirectory();

    let skillId = "";
    let files = [];

    if (isDir) {
      skillId = entry;
      const subFiles = readdirSync(srcPath);
      for (const f of subFiles) {
        const fPath = join(srcPath, f);
        if (statSync(fPath).isFile()) {
          const content = readFileSync(fPath, "utf8");
          files.push({ filename: f, content });
        }
      }
    } else {
      if (!entry.endsWith(".md") || entry === "catalog.md") continue;
      skillId = entry.replace(/\.md$/, "");
      const content = readFileSync(srcPath, "utf8");
      files.push({ filename: "SKILL.md", content });
    }

    if (!skillId) continue;

    // Guardar o actualizar en la colección centralizada 'skills' de MongoDB
    await db.collection("skills").updateOne(
      { skillId, project },
      {
        $set: {
          skillId,
          project,
          name: skillId.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: `Skill centralizado para el rol/utilidad ${skillId}`,
          files,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    seededCount++;
  }

  console.log(`✅ Colección centralizada 'skills' sembrada/actualizada con ${seededCount} skills.`);
  await closeDb();
}

main().catch((err) => {
  console.error("❌ Error en seed-skills:", err.message);
  process.exit(1);
});
