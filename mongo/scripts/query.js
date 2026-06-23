#!/usr/bin/env node
/**
 * Consulta contexto activo del hub IATL.
 *
 * Uso:
 *   node query.js --ticket PFI-1019
 *   node query.js --tag patterns
 *   node query.js --active-learnings
 *   node query.js --session <sessionId>
 *   node query.js --knowledge-sources [--category design-patterns]
 *   node query.js --peer-discussions --ticket PFI-XXXX
 *   node query.js --working-branches [--ticket PFI-XXXX] [--status active]
 */
import { getDb, closeDb } from "./lib/mongo.js";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const db = await getDb();
  const limit = Number(args.limit ?? 20);

  if (args["semantic-search"]) {
    const { semanticSearch, chromaHealth } = await import("./lib/chroma.js");
    const health = await chromaHealth();
    if (!health.ok) {
      console.log(JSON.stringify({ error: health.error, semantic_results: [] }, null, 2));
      await closeDb();
      return;
    }
    const rows = await semanticSearch(args["semantic-search"], {
      limit: Number(args.limit ?? 8),
      where: args.category ? { category: args.category } : undefined,
    });
    console.log(JSON.stringify({ query: args["semantic-search"], semantic_results: rows }, null, 2));
    await closeDb();
    return;
  }

  if (args["chroma-health"]) {
    const { chromaHealth } = await import("./lib/chroma.js");
    console.log(JSON.stringify({ chroma: await chromaHealth() }, null, 2));
    await closeDb();
    return;
  }

  if (args["ide-detect"]) {
    const { detectIde, ideLabel } = await import("./lib/ide-detect.js");
    const ide = detectIde();
    console.log(JSON.stringify({ ide, label: ideLabel(ide) }, null, 2));
    await closeDb();
    return;
  }

  if (args["classify-ticket"]) {
    const { classifyWithProfile } = await import("./lib/ticket-classifier.js");
    const labels = (args.labels ?? "").split(",").filter(Boolean);
    const result = classifyWithProfile({
      summary: args.summary ?? "",
      description: args.description ?? "",
      issueType: args["issue-type"] ?? args.issueType ?? "",
      labels,
      priority: args.priority ?? "",
    });
    if (args.ticket) {
      const stored = await db.collection("ticket_classifications").findOne(
        { ticket: args.ticket },
        { sort: { createdAt: -1 } },
      );
      console.log(JSON.stringify({ ticket: args.ticket, stored, ...result }, null, 2));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    await closeDb();
    return;
  }

  if (args["ticket-metrics"]) {
    const filter = {};
    if (args.ticket) filter.ticket = args.ticket;
    if (args.project) filter.project = args.project;
    const rows = await db
      .collection("ticket_metrics")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(args.limit ?? 50))
      .toArray();
    const aggregate = rows.length
      ? {
          count: rows.length,
          avgDurationMinutes:
            rows.reduce((s, r) => s + (r.durationMinutes ?? 0), 0) / rows.length,
          avgPeerReviewBugs:
            rows.reduce((s, r) => s + (r.peerReviewBugsFound ?? 0), 0) / rows.length,
          avgFinalReviewBugs:
            rows.reduce((s, r) => s + (r.finalReviewBugsFound ?? 0), 0) / rows.length,
          proposalAcceptanceRate:
            rows.filter((r) => r.proposalAcceptedFirstTry).length / rows.length,
          reworkRate: rows.filter((r) => (r.reworkRounds ?? 0) > 0).length / rows.length,
        }
      : null;
    console.log(JSON.stringify({ ticket_metrics: rows, aggregate }, null, 2));
    await closeDb();
    return;
  }

  if (args["active-learnings"]) {
    const rows = await db
      .collection("learnings")
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    console.log(JSON.stringify({ learnings: rows }, null, 2));
    await closeDb();
    return;
  }

  if (args["project-config"]) {
    const { loadConfig } = await import("./lib/config.js");
    console.log(JSON.stringify({ project_config: loadConfig() }, null, 2));
    await closeDb();
    return;
  }

  if (args["ticket-closure"] && args.ticket) {
    const { loadConfig } = await import("./lib/config.js");
    const config = loadConfig();
    const closure = await db.collection("ticket_closures").findOne({
      ticket: args.ticket,
      project: config.project,
    });
    const learnings = await db
      .collection("learnings")
      .find({ ticket: args.ticket, category: "ticket-closure", status: "active" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    console.log(JSON.stringify({ ticket: args.ticket, closure, learnings }, null, 2));
    await closeDb();
    return;
  }

  if (args.ticket) {
    const [findings, patterns, learnings, meta] = await Promise.all([
      db
        .collection("review_findings")
        .find({ ticket: args.ticket, status: { $ne: "archived" } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("pattern_evals")
        .find({ ticket: args.ticket })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("learnings")
        .find({ ticket: args.ticket, status: "active" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("review_meta")
        .find({ ticket: args.ticket })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ]);
    console.log(
      JSON.stringify({ ticket: args.ticket, findings, patterns, learnings, meta }, null, 2),
    );
    await closeDb();
    return;
  }

  if (args.tag) {
    const patterns = await db
      .collection("pattern_evals")
      .find({ tags: args.tag })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    console.log(JSON.stringify({ tag: args.tag, patterns }, null, 2));
    await closeDb();
    return;
  }

  if (args.session) {
    const session = await db.collection("sessions").findOne({ sessionId: args.session });
    console.log(JSON.stringify({ session }, null, 2));
    await closeDb();
    return;
  }

  if (args["knowledge-sources"]) {
    const filter = { enabled: true };
    if (args.category) filter.category = args.category;
    const rows = await db
      .collection("knowledge_sources")
      .find(filter)
      .sort({ category: 1, priority: 1 })
      .limit(limit)
      .toArray();
    console.log(JSON.stringify({ knowledge_sources: rows }, null, 2));
    await closeDb();
    return;
  }

  if (args["peer-discussions"]) {
    const filter = {};
    if (args.ticket) filter.ticket = args.ticket;
    const rows = await db
      .collection("peer_discussions")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    console.log(JSON.stringify({ peer_discussions: rows }, null, 2));
    await closeDb();
    return;
  }

  if (args["working-branches"]) {
    const filter = {};
    if (args.ticket) filter.ticket = args.ticket;
    if (args.status) filter.status = args.status;
    const rows = await db
      .collection("working_branches")
      .find(filter)
      .sort({ status: 1, updatedAt: -1 })
      .limit(Number(args.limit ?? 50))
      .toArray();
    console.log(JSON.stringify({ working_branches: rows }, null, 2));
    await closeDb();
    return;
  }

  console.error(
    "Uso: query.js --ticket PFI-XXXX | --active-learnings | --tag patterns | --session <id> | --knowledge-sources [--category X] | --peer-discussions [--ticket PFI-XXXX] | --working-branches [--ticket PFI-XXXX] [--status active] | --ticket-closure --ticket PFI-XXXX | --project-config | --semantic-search \"texto\" [--category X] | --chroma-health | --ide-detect | --classify-ticket --summary \"...\" [--issue-type Bug] [--labels a,b] [--ticket PFI-XXXX] | --ticket-metrics [--ticket PFI-XXXX] [--project pfi-backend-core]",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
