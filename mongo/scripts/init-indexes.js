#!/usr/bin/env node
/**
 * Crea índices en iatl_knowledge (Mongo local).
 * Uso: node init-indexes.js
 */
import { getDb, closeDb } from "./lib/mongo.js";

async function main() {
  const db = await getDb();

  await db.collection("sessions").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true });

  await db.collection("review_findings").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("review_findings").createIndex({ severity: 1 });
  await db.collection("review_findings").createIndex({ status: 1 });

  await db.collection("pattern_evals").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("pattern_evals").createIndex({ component: 1 });
  await db.collection("pattern_evals").createIndex({ tags: 1 });

  await db.collection("learnings").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("learnings").createIndex({ status: 1, createdAt: -1 });
  await db.collection("learnings").createIndex({ category: 1 });

  await db.collection("review_meta").createIndex({ ticket: 1, createdAt: -1 });

  await db.collection("sources_cache").createIndex({ sourceId: 1 }, { unique: true });
  await db.collection("sources_cache").createIndex({ fetchedAt: 1 });

  await db.collection("knowledge_sources").createIndex({ sourceId: 1 }, { unique: true });
  await db.collection("knowledge_sources").createIndex({ category: 1, priority: 1 });
  await db.collection("knowledge_sources").createIndex({ enabled: 1, category: 1 });
  await db.collection("knowledge_sources").createIndex({ tags: 1 });

  await db.collection("peer_discussions").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("peer_discussions").createIndex({ verdict: 1 });
  await db.collection("peer_discussions").createIndex({ source: 1 });

  await db.collection("working_branches").createIndex({ branch: 1 }, { unique: true });
  await db.collection("working_branches").createIndex({ ticket: 1, updatedAt: -1 });
  await db.collection("working_branches").createIndex({ status: 1, updatedAt: -1 });

  await db.collection("ticket_closures").createIndex({ ticket: 1, project: 1 }, { unique: true });
  await db.collection("ticket_closures").createIndex({ project: 1, closedAt: -1 });
  await db.collection("ticket_closures").createIndex({ expiresAt: 1 });

  await db.collection("learnings").createIndex({ expiresAt: 1 });

  await db.collection("project_config").createIndex({ project: 1 }, { unique: true });

  await db.collection("ticket_classifications").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("ticket_classifications").createIndex({ classification: 1 });

  await db.collection("ticket_metrics").createIndex({ ticket: 1, createdAt: -1 });
  await db.collection("ticket_metrics").createIndex({ project: 1, closedAt: -1 });
  await db.collection("ticket_metrics").createIndex({ classification: 1, analysisPath: 1 });

  console.log("✅ Índices creados en iatl_knowledge");
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
