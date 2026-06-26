#!/usr/bin/env node
/**
 * Migra contenido semántico de Mongo + seed JSON → ChromaDB.
 * Mongo conserva índice operativo; Chroma almacena texto embeddable.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb, closeDb } from "./lib/mongo.js";
import { upsertDocument, chromaHealth } from "./lib/chroma.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SEED = join(__dirname, "../skills/pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json");

function docFromKnowledgeSource(src) {
  const lines = [
    `Fuente: ${src.name ?? src.sourceId ?? src.id}`,
    `Categoría: ${src.category ?? "general"}`,
    `URL: ${src.url ?? ""}`,
    `Tags: ${(src.tags ?? []).join(", ")}`,
  ];
  if (src.summary) lines.push(`Resumen: ${src.summary}`);
  if (src.notes) lines.push(`Notas: ${src.notes}`);
  return lines.join("\n");
}

async function migrateCollection(db, collectionName, mapFn, label) {
  const rows = await db.collection(collectionName).find({}).limit(5000).toArray();
  let count = 0;
  for (const row of rows) {
    const mapped = mapFn(row);
    if (!mapped) continue;
    await upsertDocument(mapped);
    count++;
  }
  console.log(`  · ${label}: ${count}/${rows.length}`);
  return count;
}

async function migrateSeedJson() {
  let count = 0;
  try {
    const seed = JSON.parse(readFileSync(DEFAULT_SEED, "utf8"));
    for (const src of seed.sources ?? []) {
      await upsertDocument({
        id: `knowledge_source:${src.id}`,
        text: docFromKnowledgeSource({ ...src, sourceId: src.id }),
        metadata: {
          docType: "knowledge_source",
          sourceId: src.id,
          category: src.category ?? "general",
          agent: "seed",
          ticket: "GENERAL",
        },
      });
      count++;
    }
  } catch (err) {
    console.warn(`  ⚠ seed JSON omitido: ${err.message}`);
  }
  console.log(`  · seed JSON: ${count}`);
  return count;
}

async function main() {
  const health = await chromaHealth();
  if (!health.ok) {
    console.error("❌ ChromaDB no disponible:", health.error);
    console.error("   Verifica instalación o define IATL_CHROMA_HOST / IATL_CHROMA_PATH");
    process.exit(1);
  }

  console.log(`Chroma OK — colección ${health.collection} (${health.count} docs previos)\n`);

  const db = await getDb();
  let total = 0;

  total += await migrateSeedJson();

  total += await migrateCollection(
    db,
    "knowledge_sources",
    (row) => ({
      id: `knowledge_source:${row.sourceId}`,
      text: docFromKnowledgeSource(row),
      metadata: {
        docType: "knowledge_source",
        sourceId: row.sourceId,
        category: row.category ?? "general",
        agent: "mongo-migrate",
        ticket: "GENERAL",
      },
    }),
    "knowledge_sources (Mongo)",
  );

  total += await migrateCollection(
    db,
    "learnings",
    (row) => {
      if (!row.text) return null;
      return {
        id: `learning:${row._id}`,
        text: `[${row.category ?? "General"}] ${row.text}`,
        metadata: {
          docType: "learning",
          ticket: row.ticket ?? "GENERAL",
          category: row.category ?? "General",
          source: row.source ?? "iatl",
          status: row.status ?? "active",
          agent: row.source ?? "iatl",
        },
      };
    },
    "learnings",
  );

  total += await migrateCollection(
    db,
    "peer_discussions",
    (row) => {
      const parts = [
        row.propuestaSummary,
        ...(row.findings ?? []).map((f) => (typeof f === "string" ? f : f.summary ?? JSON.stringify(f))),
        ...(row.feedbackBullets ?? []),
        ...(row.requiredChanges ?? []),
      ].filter(Boolean);
      if (!parts.length) return null;
      return {
        id: `peer_discussion:${row._id}`,
        text: parts.join("\n"),
        metadata: {
          docType: "peer_discussion",
          ticket: row.ticket ?? "GENERAL",
          verdict: row.verdict ?? "",
          agent: "pfi-tl-peer-daniel",
        },
      };
    },
    "peer_discussions",
  );

  total += await migrateCollection(
    db,
    "review_findings",
    (row) => {
      if (!row.summary) return null;
      return {
        id: `review_finding:${row._id}`,
        text: `[${row.severity ?? "medium"}] ${row.location ?? ""}: ${row.summary}`,
        metadata: {
          docType: "review_finding",
          ticket: row.ticket ?? "GENERAL",
          severity: row.severity ?? "medium",
          source: row.source ?? "pfi-cr-analyst",
          agent: row.source ?? "pfi-cr-analyst",
        },
      };
    },
    "review_findings",
  );

  total += await migrateCollection(
    db,
    "pattern_evals",
    (row) => {
      const text = `Componente ${row.component}: declarado ${row.declared}, real ${row.real}. Fuentes: ${(row.sources ?? []).join(", ")}`;
      return {
        id: `pattern_eval:${row._id}`,
        text,
        metadata: {
          docType: "pattern_eval",
          ticket: row.ticket ?? "GENERAL",
          component: row.component ?? "",
          agent: "pfi-patterns-advisor",
        },
      };
    },
    "pattern_evals",
  );

  await closeDb();

  const after = await chromaHealth();
  console.log(`\n✅ Migración Chroma completada. Docs procesados: ${total}. Total colección: ${after.count}`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
