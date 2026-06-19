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
 *   "learnings": ["bullet1", "bullet2"],
 *   "branches": [
 *     { "branch": "pfi-1238/feature/...", "role": "feature", "base": "develop", "lastCommit": "eaee6a8c" }
 *   ],
 *   "endpoints": ["POST /marcaje-manual"]
 * }
 */
import { readFileSync } from "node:fs";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig, retentionExpiresAt } from "./lib/config.js";

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

  const closureDoc = {
    ticket,
    project: config.project,
    sprintLabel: config.sprintLabel,
    retentionDays: config.retentionDays,
    verdict: payload.verdict ?? "closed_implementation",
    summary: payload.summary ?? "",
    endpoints: payload.endpoints ?? [],
    branches: payload.branches ?? [],
    learnings: payload.learnings ?? [],
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

  const learnings = (payload.learnings ?? []).slice(0, 5);
  for (const text of learnings) {
    await db.collection("learnings").insertOne({
      ticket,
      project: config.project,
      sprintLabel: config.sprintLabel,
      category: "ticket-closure",
      text,
      status: "active",
      source: "hitl-close",
      expiresAt,
      createdAt: closedAt,
      updatedAt: closedAt,
    });
  }

  for (const b of payload.branches ?? []) {
    if (!b.branch) continue;
    await db.collection("working_branches").updateOne(
      { branch: b.branch },
      {
        $set: {
          ticket,
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
