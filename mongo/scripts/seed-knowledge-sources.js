#!/usr/bin/env node
/**
 * Siembra knowledge_sources desde JSON seed.
 * Uso: node seed-knowledge-sources.js [--file path/to/seed.json]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb, closeDb } from "./lib/mongo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SEED = join(
  __dirname,
  "../skills/pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json",
);

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && argv[i + 1]) {
      out.file = argv[++i];
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const seedPath = args.file ?? DEFAULT_SEED;
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const db = await getDb();
  const now = new Date();
  let upserted = 0;

  for (const src of seed.sources ?? []) {
    await db.collection("knowledge_sources").updateOne(
      { sourceId: src.id },
      {
        $set: {
          sourceId: src.id,
          category: src.category,
          name: src.name,
          url: src.url,
          tags: src.tags ?? [],
          enabled: src.enabled !== false,
          priority: src.priority ?? 1,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    upserted++;
  }

  console.log(`✅ Seed knowledge_sources: ${upserted} fuentes desde ${seedPath}`);
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
