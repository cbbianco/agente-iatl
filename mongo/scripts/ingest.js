#!/usr/bin/env node
/**
 * Ingesta documentos al hub IATL.
 *
 * Uso:
 *   node ingest.js learning --ticket PFI-1019 --category Spec-driven --text "..."
 *   node ingest.js review_finding --ticket PFI-1019 --severity high --location "a.ts:10" --summary "..." --source pfi-cr-analyst
 *   node ingest.js pattern_eval --ticket PFI-1019 --component ClaseX --declared strategy --real pipeline --sources "refactoring-guru-strategy"
 *   node ingest.js review_meta --ticket PFI-1019 --payload-file /tmp/paquete.json
 *   node ingest.js session --ticket PFI-1019 --branch "pfi-1019/feature/..." --architectura_target lambda-casos
 *   node ingest.js knowledge_source --id "..." --category design-patterns --name "..." --url "https://..." --tags "gof,strategy"
 *   node ingest.js peer_discussion --ticket PFI-1019 --verdict APTO_PROPUESTA --summary "..." --sources-used "refactoring-guru-catalog"
 *   node ingest.js peer_discussion --ticket-json /tmp/peer.json
 *   node ingest.js working_branch --ticket PFI-1228 --branch "pfi-1228/fix/..." --base develop --role feature --status active --notes "..."
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getDb, closeDb } from "./lib/mongo.js";

function parseArgs(argv) {
  const out = { _: [] };
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
    } else {
      out._.push(a);
    }
  }
  return out;
}

const now = () => new Date();

async function main() {
  const args = parseArgs(process.argv);
  const type = args._[0];
  if (!type) {
    console.error(
      "Tipo requerido: learning | review_finding | pattern_eval | review_meta | session | knowledge_source | peer_discussion | working_branch | chroma_doc",
    );
    process.exit(1);
  }

  const db = await getDb();
  const ticket = args.ticket ?? "GENERAL";
  const doc = { ticket, createdAt: now(), updatedAt: now() };

  switch (type) {
    case "learning":
      await db.collection("learnings").insertOne({
        ...doc,
        category: args.category ?? "General",
        text: args.text ?? "",
        status: "active",
        source: args.source ?? "iatl",
      });
      break;

    case "review_finding":
      await db.collection("review_findings").insertOne({
        ...doc,
        severity: args.severity ?? "medium",
        location: args.location ?? "",
        summary: args.summary ?? "",
        source: args.source ?? "pfi-cr-analyst",
        status: "open",
      });
      break;

    case "pattern_eval":
      await db.collection("pattern_evals").insertOne({
        ...doc,
        component: args.component ?? "",
        declared: args.declared ?? "",
        real: args.real ?? "",
        sources: (args.sources ?? "").split(",").filter(Boolean),
        tags: ["patterns"],
      });
      break;

    case "review_meta": {
      let payload = {};
      if (args["payload-file"]) {
        payload = JSON.parse(readFileSync(args["payload-file"], "utf8"));
      }
      await db.collection("review_meta").insertOne({
        ...doc,
        payload,
        source: args.source ?? "pfi-review-orchestrator",
      });
      break;
    }

    case "session":
      await db.collection("sessions").insertOne({
        ...doc,
        sessionId: args.sessionId ?? randomUUID(),
        branch: args.branch ?? "",
        architectura_target: args.architectura_target ?? "",
        foco_patrones: args.foco_patrones === "true",
      });
      break;

    case "knowledge_source": {
      const sourceId = args.id;
      if (!sourceId) {
        console.error("--id requerido para knowledge_source");
        process.exit(1);
      }
      const payload = {
        sourceId,
        category: args.category ?? "general",
        name: args.name ?? sourceId,
        url: args.url ?? "",
        tags: (args.tags ?? "").split(",").filter(Boolean),
        enabled: args.enabled !== "false",
        priority: Number(args.priority ?? 1),
        updatedAt: now(),
      };
      await db.collection("knowledge_sources").updateOne(
        { sourceId },
        { $set: payload, $setOnInsert: { createdAt: now() } },
        { upsert: true },
      );
      break;
    }

    case "peer_discussion": {
      let payload = {};
      if (args["ticket-json"]) {
        payload = JSON.parse(readFileSync(args["ticket-json"], "utf8"));
      }
      await db.collection("peer_discussions").insertOne({
        ...doc,
        ticket: payload.ticket ?? ticket,
        propuestaSummary: payload.propuestaSummary ?? args.summary ?? "",
        verdict: payload.verdict ?? args.verdict ?? "APTO_CON_CAMBIOS",
        findings: payload.findings ?? [],
        sourcesUsed:
          payload.sourcesUsed ??
          (args["sources-used"] ?? "").split(",").filter(Boolean),
        requiredChanges: payload.requiredChanges ?? [],
        feedbackBullets: payload.feedbackBullets ?? [],
        source: "pfi-tl-peer-daniel",
      });
      break;
    }

    case "working_branch": {
      const branch = args.branch;
      if (!branch) {
        console.error("--branch requerido para working_branch");
        process.exit(1);
      }
      await db.collection("working_branches").updateOne(
        { branch },
        {
          $set: {
            ticket,
            branch,
            base: args.base ?? "",
            role: args.role ?? "feature",
            status: args.status ?? "active",
            notes: args.notes ?? "",
            updatedAt: now(),
          },
          $setOnInsert: { createdAt: now() },
        },
        { upsert: true },
      );
      break;
    }

    case "chroma_doc": {
      const text = args.text ?? "";
      if (!text) {
        console.error("--text requerido para chroma_doc");
        process.exit(1);
      }
      const { upsertDocument } = await import("./lib/chroma.js");
      const chromaId =
        args.id ??
        `${args["doc-type"] ?? "note"}:${ticket}:${randomUUID().slice(0, 8)}`;
      await upsertDocument({
        id: chromaId,
        text,
        metadata: {
          docType: args["doc-type"] ?? "note",
          ticket,
          category: args.category ?? "general",
          sourceId: args["source-id"] ?? "",
          agent: args.agent ?? "iatl",
          source: args.source ?? args.agent ?? "iatl",
        },
      });
      break;
    }

    default:
      console.error(`Tipo desconocido: ${type}`);
      process.exit(1);
  }

  console.log(`✅ Ingestado: ${type} (${ticket})`);
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
