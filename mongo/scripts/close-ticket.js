#!/usr/bin/env node
/**
 * Cierre HITL de ticket — persiste resumen, learnings y ramas merged.
 *
 * Uso:
 *   node close-ticket.js --ticket PFI-1238 --payload-file /tmp/closure.json
 *
 * payload JSON:
 * {
 *   "verdict": "closed_implementation",
 *   "summary": "...",
 *   "learnings": [
 *     "bullet1",
 *     { "text": "bullet2", "trace": { "howWeGotHere": ["..."], "actualFinding": "...", "operationalRule": "..." } }
 *   ],
 *   "branches": [
 *     { "branch": "pfi-1238/feature/...", "role": "feature", "base": "develop", "lastCommit": "eaee6a8c" }
 *   ],
 *   "endpoints": ["POST /marcaje-manual"]
 * }
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig, retentionExpiresAt } from "./lib/config.js";
import {
  normalizeLearningsList,
  pickResumeTrace,
  buildResumeContext,
} from "./lib/learning-trace.js";

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

const now = () => new Date();

async function main() {
  const args = parseArgs(process.argv);
  const ticket = args.ticket;
  if (!ticket) {
    console.error("--ticket requerido");
    process.exit(1);
  }
  if (!args["payload-file"]) {
    console.error("--payload-file requerido");
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(args["payload-file"], "utf8"));
  const config = loadConfig();
  const expiresAt = retentionExpiresAt(config);
  const closedAt = now();

  const db = await getDb();

  const normalizedLearnings = normalizeLearningsList(payload.learnings ?? []);
  const resumeTrace = pickResumeTrace(normalizedLearnings);
  const resumeContext = buildResumeContext(resumeTrace, ticket);

  const closureDoc = {
    ticket,
    project: config.project,
    sprintLabel: config.sprintLabel,
    retentionDays: config.retentionDays,
    verdict: payload.verdict ?? "closed_implementation",
    summary: payload.summary ?? "",
    endpoints: payload.endpoints ?? [],
    branches: payload.branches ?? [],
    learnings: normalizedLearnings.map((l) =>
      l.trace ? { text: l.text, trace: l.trace } : l.text,
    ),
    reasoningCorrections: payload.reasoningCorrections ?? [],
    resumeContext,
    closedAt,
    expiresAt,
    hitlSource: "user",
    createdAt: closedAt,
    updatedAt: closedAt,
  };

  await db.collection("ticket_closures").updateOne(
    { ticket, project: config.project },
    { $set: closureDoc },
    { upsert: true },
  );

  await db.collection("learnings").updateMany(
    { ticket, project: config.project, source: "hitl-close", category: "ticket-closure" },
    { $set: { status: "archived", updatedAt: closedAt } },
  );

  const learnings = normalizedLearnings.slice(0, 5);
  for (let i = 0; i < learnings.length; i++) {
    const { text, trace } = learnings[i];
    const isResumeTrace = Boolean(resumeTrace && i === resumeTrace.index);
    await db.collection("learnings").insertOne({
      ticket,
      project: config.project,
      sprintLabel: config.sprintLabel,
      category: "ticket-closure",
      text,
      trace: trace ?? null,
      hasTrace: Boolean(trace),
      isResumeTrace,
      status: "active",
      source: "hitl-close",
      expiresAt,
      createdAt: closedAt,
      updatedAt: closedAt,
    });
  }

  const reasoningCorrections = payload.reasoningCorrections ?? [];
  if (reasoningCorrections.length > 0) {
    for (const rc of reasoningCorrections) {
      const rcText = `[Razonamiento] Error inicial: "${rc.error}" | Corrección HITL: "${rc.correction}" | Regla operativa: "${rc.rule}"`;
      await db.collection("learnings").insertOne({
        ticket,
        project: config.project,
        sprintLabel: config.sprintLabel,
        category: "reasoning-correction",
        text: rcText,
        trace: null,
        hasTrace: false,
        isResumeTrace: false,
        status: "active",
        source: "hitl-close",
        expiresAt,
        createdAt: closedAt,
        updatedAt: closedAt,
      });
    }

    if (config.projectRoot) {
      const learningsFilePath = join(config.projectRoot, "skills/pfi-iatl-developer-profile/review-learnings.md");
      if (existsSync(learningsFilePath)) {
        let content = readFileSync(learningsFilePath, "utf8");
        const dateStr = closedAt.toISOString().slice(0, 10);
        let appendText = `\n## Correcciones de Razonamiento HITL (${ticket} - ${dateStr})\n\n`;
        for (const rc of reasoningCorrections) {
          appendText += `- **Error de razonamiento:** ${rc.error}\n`;
          appendText += `  **Corrección del HITL:** ${rc.correction}\n`;
          appendText += `  **Nueva regla operativa:** ${rc.rule}\n`;
        }
        
        const commentIndicator = "<!-- Nuevas entradas:";
        if (content.includes(commentIndicator)) {
          const parts = content.split(commentIndicator);
          content = parts[0] + appendText + "\n" + commentIndicator + parts[1];
          writeFileSync(learningsFilePath, content, "utf8");
        } else {
          appendFileSync(learningsFilePath, "\n" + appendText, "utf8");
        }
        console.warn(`📝 review-learnings.md actualizado con ${reasoningCorrections.length} corrección(es) de razonamiento.`);
      }
    }
  }

  for (const b of payload.branches ?? []) {
    if (!b.branch) continue;
    await db.collection("working_branches").updateOne(
      { branch: b.branch, project: config.project },
      {
        $set: {
          ticket,
          project: config.project,
          branch: b.branch,
          base: b.base ?? "",
          role: b.role ?? "feature",
          status: b.status ?? "merged",
          notes: b.notes ?? payload.summary?.slice(0, 280) ?? "",
          lastCommit: b.lastCommit ?? "",
          closedAt,
          updatedAt: closedAt,
        },
        $setOnInsert: { createdAt: closedAt },
      },
      { upsert: true },
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        ticket,
        project: config.project,
        sprintLabel: config.sprintLabel,
        expiresAt: expiresAt.toISOString(),
        learningsStored: learnings.length,
        reasoningCorrectionsStored: reasoningCorrections.length,
        resumeTraceStored: Boolean(resumeContext),
        branchesUpdated: (payload.branches ?? []).length,
      },
      null,
      2,
    ),
  );
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
