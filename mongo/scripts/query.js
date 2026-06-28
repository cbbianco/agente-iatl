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
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig } from "./lib/config.js";
import { pickResumeTrace, buildResumeContext, normalizeLearningEntry } from "./lib/learning-trace.js";

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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const where = { project };
    if (args.category) {
      where.category = args.category;
    }
    const rows = await semanticSearch(args["semantic-search"], {
      limit: Number(args.limit ?? 8),
      where,
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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const rows = await db
      .collection("learnings")
      .find({ status: "active", project })
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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const closure = await db.collection("ticket_closures").findOne({
      ticket: args.ticket,
      project,
    });
    const learnings = await db
      .collection("learnings")
      .find({ ticket: args.ticket, project, category: "ticket-closure", status: "active" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    const resumeLearning = await db.collection("learnings").findOne({
      ticket: args.ticket,
      project,
      isResumeTrace: true,
      status: "active",
    });
    const resumeFromLearnings = resumeLearning
      ? normalizeLearningEntry({ text: resumeLearning.text, trace: resumeLearning.trace })
      : pickResumeTrace(
          learnings.map((l) => normalizeLearningEntry({ text: l.text, trace: l.trace })),
        );
    const resume_context =
      closure?.resumeContext ??
      buildResumeContext(resumeFromLearnings, args.ticket);
    console.log(
      JSON.stringify({ ticket: args.ticket, closure, learnings, resume_context }, null, 2),
    );
    await closeDb();
    return;
  }

  if (args.ticket) {
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const [findings, patterns, learnings, meta, activeSession, classification, workingBranches, closure] =
      await Promise.all([
      db
        .collection("review_findings")
        .find({ ticket: args.ticket, project, status: { $ne: "archived" } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("pattern_evals")
        .find({ ticket: args.ticket, project })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("learnings")
        .find({ ticket: args.ticket, project, status: "active" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection("review_meta")
        .find({ ticket: args.ticket, project })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      db.collection("sessions").findOne(
        { ticket: args.ticket, project, status: { $in: ["active", "active_spec_driven", "open"] } },
        { sort: { updatedAt: -1 } },
      ),
      db.collection("ticket_classifications").findOne(
        { ticket: args.ticket, project },
        { sort: { createdAt: -1 } },
      ),
      db
        .collection("working_branches")
        .find({ ticket: args.ticket, project, status: "active" })
        .sort({ updatedAt: -1 })
        .toArray(),
      db.collection("ticket_closures").findOne({
        ticket: args.ticket,
        project,
      }),
    ]);
    const resumeLearning = await db.collection("learnings").findOne({
      ticket: args.ticket,
      project,
      isResumeTrace: true,
      status: "active",
    });
    const resumeFromLearnings = resumeLearning
      ? normalizeLearningEntry({ text: resumeLearning.text, trace: resumeLearning.trace })
      : pickResumeTrace(
          learnings.map((l) => normalizeLearningEntry({ text: l.text, trace: l.trace })),
        );
    const resume_context =
      closure?.resumeContext ??
      buildResumeContext(resumeFromLearnings, args.ticket);
    const sessionContext = {
      mandate: "OBLIGATORIO: usar este bloque antes de reconstruir contexto desde el chat",
      active_session: activeSession,
      current_phase: activeSession?.currentPhase ?? null,
      checkpoints: activeSession?.checkpoints ?? [],
      classification,
      working_branches: workingBranches,
      resume_context,
    };
    console.log(
      JSON.stringify(
        {
          ticket: args.ticket,
          session_context: sessionContext,
          closure_summary: closure?.summary ?? null,
          findings,
          patterns,
          learnings,
          meta,
        },
        null,
        2,
      ),
    );
    await closeDb();
    return;
  }

  if (args.tag) {
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const patterns = await db
      .collection("pattern_evals")
      .find({ tags: args.tag, project })
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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const filter = { enabled: true, project };
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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const filter = { project };
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
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const filter = { project };
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

  if (args.skills) {
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const rows = await db
      .collection("skills")
      .find({ project })
      .project({ skillId: 1, name: 1, description: 1, "files.filename": 1, updatedAt: 1 })
      .sort({ skillId: 1 })
      .toArray();
    console.log(JSON.stringify({ skills: rows }, null, 2));
    await closeDb();
    return;
  }

  if (args["sync-skills"]) {
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const rows = await db
      .collection("skills")
      .find({ project })
      .toArray();

    if (!rows.length) {
      console.log(JSON.stringify({ message: "No se encontraron skills centralizados en MongoDB para este proyecto.", synced: 0 }));
      await closeDb();
      return;
    }

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const hubPath = __dirname;
    const runtime = config.runtimeTarget ?? config.ide ?? "cursor";
    const skillsPath = runtime === "vscode-claude" 
      ? join(hubPath, "..", "iatl", "skills") 
      : join(hubPath, "..", "skills");

    let syncedCount = 0;
    for (const skill of rows) {
      const skillDir = join(skillsPath, skill.skillId);
      mkdirSync(skillDir, { recursive: true });
      for (const file of skill.files ?? []) {
        writeFileSync(join(skillDir, file.filename), file.content, "utf8");
      }
      syncedCount++;
    }

    console.log(JSON.stringify({
      message: `Sincronización exitosa. Habilidades actualizadas en el entorno local del IDE.`,
      runtime,
      local_skills_path: skillsPath,
      synced_skills: rows.map(r => r.skillId),
      count: syncedCount
    }, null, 2));
    await closeDb();
    return;
  }

  if (args["active-sessions"]) {
    const config = loadConfig();
    const project = args.project ?? config.project ?? "pfi-backend-core";
    const filter = { 
      project, 
      status: { $in: ["active", "active_analysis", "active_spec_driven"] } 
    };
    const rows = await db
      .collection("sessions")
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();
    console.log(JSON.stringify({ active_sessions: rows }, null, 2));
    await closeDb();
    return;
  }

  console.error(
    "Uso: query.js --ticket PFI-XXXX | --active-learnings | --tag patterns | --session <id> | --active-sessions | --knowledge-sources [--category X] | --peer-discussions [--ticket PFI-XXXX] | --working-branches [--ticket PFI-XXXX] [--status active] | --ticket-closure --ticket PFI-XXXX | --project-config | --semantic-search \"texto\" [--category X] | --chroma-health | --ide-detect | --classify-ticket --summary \"...\" [--issue-type Bug] [--labels a,b] [--ticket PFI-XXXX] | --ticket-metrics [--ticket PFI-XXXX] [--project pfi-backend-core] | --skills | --sync-skills",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
