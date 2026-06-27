#!/usr/bin/env node
/**
 * Crea índices en iatl_knowledge (Mongo local).
 * Uso: node init-indexes.js
 */
import { getDb, closeDb } from "./lib/mongo.js";

async function safeDropIndex(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
  } catch (err) {
    // Ignorar si no existe
  }
}

async function main() {
  const db = await getDb();

  const sessions = db.collection("sessions");
  const reviewFindings = db.collection("review_findings");
  const patternEvals = db.collection("pattern_evals");
  const learnings = db.collection("learnings");
  const reviewMeta = db.collection("review_meta");
  const sourcesCache = db.collection("sources_cache");
  const knowledgeSources = db.collection("knowledge_sources");
  const peerDiscussions = db.collection("peer_discussions");
  const workingBranches = db.collection("working_branches");
  const ticketClosures = db.collection("ticket_closures");
  const projectConfig = db.collection("project_config");
  const ticketClassifications = db.collection("ticket_classifications");
  const ticketMetrics = db.collection("ticket_metrics");

  // Eliminar índices antiguos únicos de campo simple que ahora son compuestos por proyecto
  await safeDropIndex(sourcesCache, "sourceId_1");
  await safeDropIndex(knowledgeSources, "sourceId_1");
  await safeDropIndex(workingBranches, "branch_1");

  // Crear índices compuestos y específicos
  await sessions.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await sessions.createIndex({ ticket: 1, project: 1, status: 1, updatedAt: -1 });
  await sessions.createIndex({ sessionId: 1 }, { unique: true });

  await reviewFindings.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await reviewFindings.createIndex({ severity: 1 });
  await reviewFindings.createIndex({ status: 1 });

  await patternEvals.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await patternEvals.createIndex({ component: 1 });
  await patternEvals.createIndex({ tags: 1 });

  await learnings.createIndex({ ticket: 1, project: 1, isResumeTrace: 1, status: 1 });
  await learnings.createIndex({ status: 1, createdAt: -1 });
  await learnings.createIndex({ category: 1 });
  await learnings.createIndex({ expiresAt: 1 });

  await reviewMeta.createIndex({ ticket: 1, project: 1, createdAt: -1 });

  await sourcesCache.createIndex({ sourceId: 1, project: 1 }, { unique: true });
  await sourcesCache.createIndex({ fetchedAt: 1 });

  await knowledgeSources.createIndex({ sourceId: 1, project: 1 }, { unique: true });
  await knowledgeSources.createIndex({ category: 1, priority: 1 });
  await knowledgeSources.createIndex({ enabled: 1, category: 1 });
  await knowledgeSources.createIndex({ tags: 1 });

  await peerDiscussions.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await peerDiscussions.createIndex({ verdict: 1 });
  await peerDiscussions.createIndex({ source: 1 });

  await workingBranches.createIndex({ branch: 1, project: 1 }, { unique: true });
  await workingBranches.createIndex({ ticket: 1, project: 1, updatedAt: -1 });
  await workingBranches.createIndex({ status: 1, updatedAt: -1 });

  await ticketClosures.createIndex({ ticket: 1, project: 1 }, { unique: true });
  await ticketClosures.createIndex({ project: 1, closedAt: -1 });
  await ticketClosures.createIndex({ expiresAt: 1 });

  await projectConfig.createIndex({ project: 1 }, { unique: true });

  await ticketClassifications.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await ticketClassifications.createIndex({ classification: 1 });

  await ticketMetrics.createIndex({ ticket: 1, project: 1, createdAt: -1 });
  await ticketMetrics.createIndex({ project: 1, closedAt: -1 });
  await ticketMetrics.createIndex({ classification: 1, analysisPath: 1 });

  console.log("✅ Índices creados en iatl_knowledge");
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
