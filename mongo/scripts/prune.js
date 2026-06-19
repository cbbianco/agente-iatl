#!/usr/bin/env node
/**
 * Poda del hub IATL — equivalente a review-learnings.md § Mantenimiento.
 *
 * Uso:
 *   node prune.js --max-active 30
 *   node prune.js --archive-days 7 --dry-run
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
  const maxActive = Number(args["max-active"] ?? 30);
  const archiveDays = Number(args["archive-days"] ?? 7);
  const dryRun = Boolean(args["dry-run"]);
  const cutoff = new Date(Date.now() - archiveDays * 24 * 60 * 60 * 1000);

  const db = await getDb();
  const learnings = db.collection("learnings");
  const archive = db.collection("learnings_archive");

  const active = await learnings
    .find({ status: "active" })
    .sort({ createdAt: -1 })
    .toArray();

  const toArchive = active.filter((l, i) => i >= maxActive || l.createdAt < cutoff);

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, wouldArchive: toArchive.length }, null, 2));
    await closeDb();
    return;
  }

  if (toArchive.length > 0) {
    await archive.insertMany(
      toArchive.map((l) => ({ ...l, archivedAt: new Date(), previousStatus: l.status })),
    );
    await learnings.updateMany(
      { _id: { $in: toArchive.map((l) => l._id) } },
      { $set: { status: "archived", updatedAt: new Date() } },
    );
  }

  const oldFindings = await db
    .collection("review_findings")
    .find({ status: "open", createdAt: { $lt: cutoff } })
    .toArray();

  if (oldFindings.length > 0) {
    await db.collection("review_findings").updateMany(
      { _id: { $in: oldFindings.map((f) => f._id) } },
      { $set: { status: "archived", updatedAt: new Date() } },
    );
  }

  const sprintExpired = await learnings
    .find({ expiresAt: { $lt: new Date() }, status: "active" })
    .toArray();

  if (!dryRun && sprintExpired.length > 0) {
    await archive.insertMany(
      sprintExpired.map((l) => ({ ...l, archivedAt: new Date(), previousStatus: l.status, reason: "sprint_expired" })),
    );
    await learnings.updateMany(
      { _id: { $in: sprintExpired.map((l) => l._id) } },
      { $set: { status: "archived", updatedAt: new Date() } },
    );
  }

  const expiredClosures = await db
    .collection("ticket_closures")
    .find({ expiresAt: { $lt: new Date() } })
    .toArray();

  if (!dryRun && expiredClosures.length > 0) {
    await db.collection("ticket_closures_archive").insertMany(
      expiredClosures.map((c) => ({ ...c, archivedAt: new Date() })),
    );
    await db.collection("ticket_closures").deleteMany({
      _id: { $in: expiredClosures.map((c) => c._id) },
    });
  }

  console.log(
    `✅ Poda: ${toArchive.length} learnings archivados, ${oldFindings.length} findings cerrados, ${dryRun ? 0 : sprintExpired.length} learnings sprint expirados, ${dryRun ? 0 : expiredClosures.length} cierres archivados`,
  );
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
