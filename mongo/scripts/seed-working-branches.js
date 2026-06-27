#!/usr/bin/env node
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig } from "./lib/config.js";

const branches = [
  {
    ticket: "PFI-1039",
    branch: "pfi-1039/fix/traza-denuncia-decare-fecha-chile",
    base: "develop",
    role: "fix",
    status: "active",
    notes: "Fix fechaDenuncia Dynamo traza DECARE — fechaAuditoriaIsoChile (pendiente implementar)",
  },
  {
    ticket: "PFI-1039",
    branch: "pfi-1039/fix/fecha-ocurrencia-traza-denuncia",
    base: "legacy (~418 commits atrás develop)",
    role: "fix",
    status: "abandoned",
    notes: "Solo tests fecha ocurrencia; no fix productivo — no usar como base",
  },
  {
    ticket: "PFI-1039",
    branch: "pfi-1039/fix/fecha-auditoria-chile-dynamo",
    base: "develop",
    role: "fix",
    status: "merged",
    notes: "Eventos/SAS/EventBridge — mergeado PRs #219-#228",
  },
  {
    ticket: "PFI-1039",
    branch: "conflict_resolutions/develop/pfi-1039/fix/fecha-auditoria-chile-dynamo",
    base: "develop",
    role: "conflict_develop",
    status: "merged",
    notes: "Integración eventos 1039 → develop",
  },
  {
    ticket: "PFI-1039",
    branch: "conflict_resolutions/qa/pfi-1039/fix/fecha-auditoria-chile-dynamo",
    base: "origin/qa",
    role: "conflict_qa",
    status: "merged",
    notes: "Integración eventos 1039 → qa",
  },
  {
    ticket: "PFI-1228",
    branch: "pfi-1228/fix/post-persona-paridad-legacy",
    base: "2f949755 (tip PFI-1163)",
    role: "fix",
    status: "active",
    notes: "Paridad POST personas vs personSchema Joi — pendiente implementar",
  },
  {
    ticket: "PFI-1163",
    branch: "pfi-1163/feature/mgiracion-servicio-casos-personas",
    base: "develop",
    role: "feature",
    status: "merged",
    notes: "Migración personas — origen deuda PFI-1228 — PR #135",
  },
  {
    ticket: "PFI-1152",
    branch: "pfi-1152/fix/secuencial-pg-oficio-fiscalia",
    base: "develop",
    role: "fix",
    status: "merged",
    notes: "Promise.all pool PG oficio fiscalía — secuencializado",
  },
  {
    ticket: "PFI-1152",
    branch: "conflict_resolutions/develop/pfi-1152/fix/secuencial-pg-oficio-fiscalia",
    base: "develop",
    role: "conflict_develop",
    status: "merged",
    notes: "",
  },
  {
    ticket: "PFI-1152",
    branch: "conflict_resolutions/qa/pfi-1152/fix/secuencial-pg-oficio-fiscalia",
    base: "origin/qa",
    role: "conflict_qa",
    status: "merged",
    notes: "",
  },
  {
    ticket: "PFI-1238",
    branch: "pfi-1238/feature/crear-marcaje-manual",
    base: "main",
    role: "feature",
    status: "active",
    notes: "Marcaje manual — campos obligatorios — retomar trabajo",
  },
  {
    ticket: "PFI-1238",
    branch: "conflict_resolutions/develop/pfi-1238/feature/crear-marcaje-manual",
    base: "develop",
    role: "conflict_develop",
    status: "active",
    notes: "Pendiente cuando feature esté lista",
  },
  {
    ticket: "PFI-1238",
    branch: "conflict_resolutions/qa/pfi-1238/feature/crear-marcaje-manual",
    base: "origin/qa",
    role: "conflict_qa",
    status: "active",
    notes: "Pendiente cuando feature esté lista",
  },
];

const now = () => new Date();

async function main() {
  const db = await getDb();
  const config = loadConfig();
  const project = config.project ?? "pfi-backend-core";

  for (const row of branches) {
    await db.collection("working_branches").updateOne(
      { branch: row.branch, project },
      { $set: { ...row, project, updatedAt: now() }, $setOnInsert: { createdAt: now() } },
      { upsert: true },
    );
  }
  console.log(`✅ Seed working_branches: ${branches.length} ramas`);
  await closeDb();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
