#!/usr/bin/env node
/**
 * Dashboard Servidor para Agente IATL.
 * 
 * Permite visualizar:
 *   1) Base de conocimiento (knowledge_sources)
 *   2) Sesiones de desarrollo y su estado/checkpoints/logs
 *   3) Estadísticas del proyecto
 * 
 * Permite agregar:
 *   - Nuevas fuentes a la base de conocimiento
 * 
 * Uso:
 *   node dashboard.js
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn, exec } from "node:child_process";
import { platform } from "node:os";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig, saveConfig } from "./lib/config.js";
import {
  resolveRuntimeContext,
  BENCHMARK_AGENT_METRICS,
  BENCHMARK_TICKET_METRICS,
} from "./lib/runtime-context.js";
import { buildTicketInsights, isSessionActive } from "./lib/ticket-insights.js";
import { buildInstallationSummary } from "./lib/installed-runtimes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HUB_ROOT = dirname(__filename);
const ARCHITECTURE_REPO = join(HUB_ROOT, "..", "..");

const DEFAULT_PORT = 8030;

function loadProjectRegistry() {
  const candidates = [
    join(HUB_ROOT, "projects.registry.json"),
    join(ARCHITECTURE_REPO, "mongo", "projects.registry.json"),
  ];
  for (const registryPath of candidates) {
    if (!existsSync(registryPath)) continue;
    try {
      return JSON.parse(readFileSync(registryPath, "utf8"));
    } catch {
      /* siguiente candidato */
    }
  }
  return { projects: [] };
}

function updateKnowledgeJsonFiles(newSource) {
  const pathsToUpdate = [
    join(ARCHITECTURE_REPO, "mongo", "knowledge-sources.seed.json"),
    join(ARCHITECTURE_REPO, "skills", "pfi-tl-peer-daniel-analisis", "knowledge-sources.seed.json"),
  ];

  pathsToUpdate.forEach(filePath => {
    try {
      if (existsSync(filePath)) {
        const seedData = JSON.parse(readFileSync(filePath, "utf8"));
        if (!seedData.sources) seedData.sources = [];
        
        const exists = seedData.sources.some(s => s.id === newSource.sourceId);
        if (!exists) {
          seedData.sources.push({
            id: newSource.sourceId,
            category: newSource.category,
            name: newSource.name,
            url: newSource.url,
            tags: newSource.tags,
            enabled: newSource.enabled,
            priority: newSource.priority
          });
          writeFileSync(filePath, JSON.stringify(seedData, null, 2) + "\n", "utf8");
          console.log(`[Dashboard] Actualizada base de conocimiento JSON: ${filePath}`);
        }
      }
    } catch (err) {
      console.error(`[Dashboard] Error actualizando base de conocimiento JSON en ${filePath}:`, err.message);
    }
  });
}

function computeAgentPerformance(metrics, closures, patternEvals) {
  const totalTickets = metrics.length;
  const useBenchmark = totalTickets === 0;

  const totalClosures = closures.length;
  const approvedClosures = closures.filter((c) => {
    const v = c.verdict || "";
    return v === "closed_implementation" || v === "closed" || v === "APROBADO" || !v.startsWith("rejected");
  }).length;
  const iatlAvg = useBenchmark
    ? BENCHMARK_AGENT_METRICS.iatl
    : totalClosures > 0
      ? (approvedClosures / totalClosures) * 100
      : BENCHMARK_AGENT_METRICS.iatl;

  const firstTryAccepted = metrics.filter((m) => m.proposalAcceptedFirstTry).length;
  const peerAvg = useBenchmark
    ? BENCHMARK_AGENT_METRICS["tl-peer-daniel"]
    : totalTickets > 0
      ? (firstTryAccepted / totalTickets) * 100
      : BENCHMARK_AGENT_METRICS["tl-peer-daniel"];

  let patternMatches = 0;
  patternEvals.forEach((p) => {
    if (p.declared === p.real) patternMatches++;
  });
  const patternsAvg = useBenchmark
    ? BENCHMARK_AGENT_METRICS["patterns-advisor"]
    : patternEvals.length > 0
      ? (patternMatches / patternEvals.length) * 100
      : BENCHMARK_AGENT_METRICS["patterns-advisor"];

  const zeroFinalBugs = metrics.filter((m) => (m.finalReviewBugsFound ?? 0) === 0).length;
  const crAvg = useBenchmark
    ? BENCHMARK_AGENT_METRICS["cr-analyst"]
    : totalTickets > 0
      ? (zeroFinalBugs / totalTickets) * 100
      : BENCHMARK_AGENT_METRICS["cr-analyst"];

  return {
    metricsSource: useBenchmark ? "benchmark" : "project",
    totalTickets,
    agents: [
      {
        id: "iatl",
        name: "Developer Agent",
        handle: "@iatl",
        role: "Desarrollo e Implementación",
        description: "Resuelve tickets Jira, genera especificaciones de diseño, crea el backlog de tareas, e implementa el código final.",
        acceptanceMetric: "Tasa de Cierre Exitoso HITL",
        avgPerformance: `${iatlAvg.toFixed(1)}%`,
        status: "Activo",
        avatar: "💻",
        metricExplanation: useBenchmark
          ? {
              source: "benchmark",
              trustworthy: false,
              formula: "Promedio histórico IATL de referencia",
              detail: `No hay cierres HITL en ticket_closures para este proyecto. Se muestra ${BENCHMARK_AGENT_METRICS.iatl}% como benchmark, no un dato real del proyecto.`,
            }
          : {
              source: "project",
              trustworthy: totalClosures > 0,
              formula: "(cierres aprobados / total cierres) × 100",
              numerator: approvedClosures,
              denominator: totalClosures,
              detail: `${approvedClosures} de ${totalClosures} cierre(s) HITL con veredicto aprobado (closed_implementation, closed o APROBADO).`,
            },
      },
      {
        id: "tl-peer-daniel",
        name: "Technical Leader Peer",
        handle: "@pfi-tl-peer-daniel",
        role: "Revisión de Diseño y Aprobación Pre-HITL",
        description: "Revisa las especificaciones técnicas propuestas por @iatl antes de que pasen al HITL.",
        acceptanceMetric: "Aceptación de Propuesta al 1er Intento",
        avgPerformance: `${peerAvg.toFixed(1)}%`,
        status: "Activo",
        avatar: "🛡️",
        metricExplanation: useBenchmark
          ? {
              source: "benchmark",
              trustworthy: false,
              formula: "Promedio histórico IATL de referencia",
              detail: `Sin registros en ticket_metrics. Benchmark ${BENCHMARK_AGENT_METRICS["tl-peer-daniel"]}%.`,
            }
          : {
              source: "project",
              trustworthy: totalTickets > 0,
              formula: "(propuestas aceptadas al 1er intento / tickets medidos) × 100",
              numerator: firstTryAccepted,
              denominator: totalTickets,
              detail: `${firstTryAccepted} ticket(s) con proposalAcceptedFirstTry=true en ticket_metrics.`,
            },
      },
      {
        id: "patterns-advisor",
        name: "Design Patterns Advisor",
        handle: "@pfi-patterns-advisor",
        role: "Evaluación de Deuda Técnica",
        description: "Compara los patrones declarados con la implementación real en el código.",
        acceptanceMetric: "Tasa de Coincidencia de Patrones",
        avgPerformance: `${patternsAvg.toFixed(1)}%`,
        status: "Activo",
        avatar: "📐",
        metricExplanation: useBenchmark
          ? {
              source: "benchmark",
              trustworthy: false,
              formula: "Promedio histórico IATL de referencia",
              detail: `Sin evaluaciones en pattern_evals. Benchmark ${BENCHMARK_AGENT_METRICS["patterns-advisor"]}%.`,
            }
          : {
              source: "project",
              trustworthy: patternEvals.length > 0,
              formula: "(patrones declared === real / total evals) × 100",
              numerator: patternMatches,
              denominator: patternEvals.length,
              detail: `${patternMatches} de ${patternEvals.length} evaluación(es) en pattern_evals con coincidencia declarado/real.`,
            },
      },
      {
        id: "cr-analyst",
        name: "Code Review Analyst",
        handle: "@pfi-cr-analyst",
        role: "Análisis Estático y Calidad",
        description: "Ejecuta análisis de código profundo tras la implementación.",
        acceptanceMetric: "Tasa de Código Limpio de Errores Finales",
        avgPerformance: `${crAvg.toFixed(1)}%`,
        status: "Activo",
        avatar: "🔍",
        metricExplanation: useBenchmark
          ? {
              source: "benchmark",
              trustworthy: false,
              formula: "Promedio histórico IATL de referencia",
              detail: `Sin ticket_metrics con finalReviewBugsFound. Benchmark ${BENCHMARK_AGENT_METRICS["cr-analyst"]}%.`,
            }
          : {
              source: "project",
              trustworthy: totalTickets > 0,
              formula: "(tickets con 0 bugs finales / tickets medidos) × 100",
              numerator: zeroFinalBugs,
              denominator: totalTickets,
              detail: `${zeroFinalBugs} de ${totalTickets} ticket(s) con finalReviewBugsFound=0 en ticket_metrics.`,
            },
      },
    ],
  };
}

function openBrowser(url) {
  const start =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
      ? "start"
      : "xdg-open";
  exec(`${start} ${url}`).unref();
}

async function startServer(port = DEFAULT_PORT) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;

    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // 1. Serve HTML
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const htmlPath = join(__dirname, "dashboard.html");
        if (existsSync(htmlPath)) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(readFileSync(htmlPath, "utf8"));
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("dashboard.html no encontrado.");
        }
        return;
      }

      // 2. Serve CSS
      if (url.pathname === "/dashboard.css") {
        const cssPath = join(__dirname, "dashboard.css");
        if (existsSync(cssPath)) {
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(readFileSync(cssPath, "utf8"));
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("dashboard.css no encontrado.");
        }
        return;
      }

      // API Routes
      const config = loadConfig();
      const project = config.project ?? "pfi-backend-core";
      const runtimeCtx = resolveRuntimeContext();
      const installationSummary = buildInstallationSummary(
        HUB_ROOT,
        runtimeCtx.runtimeTarget,
        runtimeCtx.runtimeLabel,
      );

      // 3. GET /api/config
      if (url.pathname === "/api/config" && method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ...config,
          runtimeTarget: runtimeCtx.runtimeTarget,
          runtimeLabel: runtimeCtx.runtimeLabel,
          hubScope: runtimeCtx.hubScope,
          ide: runtimeCtx.runtimeTarget,
          ...installationSummary,
        }));
        return;
      }

      // 3b. GET /api/runtime-info (sin rutas de filesystem)
      if (url.pathname === "/api/runtime-info" && method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          runtimeTarget: runtimeCtx.runtimeTarget,
          runtimeLabel: runtimeCtx.runtimeLabel,
          hubScope: runtimeCtx.hubScope,
          project: runtimeCtx.project,
          ...installationSummary,
        }));
        return;
      }

      // 3c. GET /api/assigned-projects — requiere DB (ver bloque tras getDb)

      // DB connection for other API routes
      let db;
      try {
        db = await getDb();
      } catch (err) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "DB_CONNECTION_ERROR", details: err.message }));
        return;
      }

      if (url.pathname === "/api/assigned-projects" && method === "GET") {
        const registry = loadProjectRegistry();
        let dbProjects = [];
        try {
          dbProjects = await db.collection("sessions").distinct("project");
        } catch {
          dbProjects = [];
        }
        const slugs = new Set([
          ...registry.projects.map((p) => p.slug),
          ...dbProjects.filter(Boolean),
          config.project,
        ]);
        const projectsByRuntime = installationSummary.projectsByRuntime ?? {};
        const items = [...slugs].filter(Boolean).map((slug) => {
          const preset = registry.projects.find((p) => p.slug === slug);
          const installedOn = projectsByRuntime[slug] ?? [];
          return {
            slug,
            label: preset?.label ?? slug,
            isActive: slug === config.project,
            hasPreset: Boolean(preset),
            installedOn,
            installedRuntimeLabels: installedOn.map((r) => r.label),
          };
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          activeProject: config.project,
          projects: items,
          ...installationSummary,
        }));
        return;
      }

      // 3d. GET /api/project-presets
      if (url.pathname === "/api/project-presets" && method === "GET") {
        const slug = url.searchParams.get("slug");
        const registry = loadProjectRegistry();
        const preset = registry.projects.find((p) => p.slug === slug);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ preset: preset ?? null }));
        return;
      }

      // 3e. GET /api/landing-page-types
      if (url.pathname === "/api/landing-page-types" && method === "GET") {
        const typesPath = join(runtimeCtx.architectureRepo || ARCHITECTURE_REPO, "cli", "landing-page-types.json");
        let types = [{ id: "curriculum", label: "Currículum vitae", description: "Landing personal tipo CV", defaultTitle: "Mi Currículum", defaultContext: "Página profesional tipo curriculum vitae" }];
        if (existsSync(typesPath)) {
          try {
            const registry = JSON.parse(readFileSync(typesPath, "utf8"));
            types = registry.landingPageTypes ?? types;
          } catch {
            /* fallback */
          }
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ types }));
        return;
      }

      // 4. GET /api/dashboard-summary
      if (url.pathname === "/api/dashboard-summary" && method === "GET") {
        const [sessions, sources, learnings, findings, closures] = await Promise.all([
          db.collection("sessions").find({ project }).toArray(),
          db.collection("knowledge_sources").find({ project }).toArray(),
          db.collection("learnings").find({ project, status: "active" }).toArray(),
          db.collection("review_findings").find({ project, status: "open" }).toArray(),
          db.collection("ticket_closures").find({ project }).toArray()
        ]);

        const activeSessions = sessions.filter(s => ["active", "active_analysis", "active_spec_driven", "open"].includes(s.status));
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          totalSessions: sessions.length,
          activeSessionsCount: activeSessions.length,
          totalKnowledgeSources: sources.length,
          activeLearningsCount: learnings.length,
          openFindingsCount: findings.length,
          closuresCount: closures.length
        }));
        return;
      }

      // 5. GET /api/sessions
      if (url.pathname === "/api/sessions" && method === "GET") {
        const sessions = await db.collection("sessions").find({ project }).sort({ updatedAt: -1 }).toArray();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(sessions));
        return;
      }

      // 6. GET /api/session-details
      if (url.pathname === "/api/session-details" && method === "GET") {
        const ticket = url.searchParams.get("ticket");
        if (!ticket) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Parámetro 'ticket' es requerido." }));
          return;
        }

        const [findings, patterns, learnings, peerDiscussions, workingBranches, closure, sessions, ticketMetric, classification] = await Promise.all([
          db.collection("review_findings").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("pattern_evals").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("learnings").find({ ticket, project, status: "active" }).sort({ createdAt: -1 }).toArray(),
          db.collection("peer_discussions").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("working_branches").find({ ticket, project }).sort({ updatedAt: -1 }).toArray(),
          db.collection("ticket_closures").findOne({ ticket, project }),
          db.collection("sessions").find({ ticket, project }).sort({ updatedAt: -1 }).toArray(),
          db.collection("ticket_metrics").findOne({ ticket, project }),
          db.collection("ticket_classifications").findOne({ ticket, project }),
        ]);

        const insights = buildTicketInsights({
          sessions,
          closure,
          ticketMetric,
          classification,
          learnings,
          findings,
          peerDiscussions,
          workingBranches,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          session: sessions[0] || null,
          sessions,
          findings,
          patterns,
          learnings,
          peerDiscussions,
          workingBranches,
          closure,
          ticketMetric,
          classification,
          insights,
        }));
        return;
      }

      // 7. GET /api/knowledge-sources
      if (url.pathname === "/api/knowledge-sources" && method === "GET") {
        const sources = await db.collection("knowledge_sources").find({ project }).sort({ category: 1, priority: 1 }).toArray();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(sources));
        return;
      }

      // 8. POST /api/knowledge-sources
      if (url.pathname === "/api/knowledge-sources" && method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            
            // Validations
            if (!data.sourceId || typeof data.sourceId !== "string" || !data.sourceId.trim()) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "El campo 'sourceId' (ID único) es requerido y debe ser texto." }));
              return;
            }
            if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "El campo 'name' (Nombre) es requerido y debe ser texto." }));
              return;
            }
            if (!data.category || typeof data.category !== "string" || !data.category.trim()) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "El campo 'category' (Categoría) es requerido." }));
              return;
            }
            if (!data.url || typeof data.url !== "string" || !data.url.trim()) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "El campo 'url' es requerido y debe ser una URL válida." }));
              return;
            }

            const sourceId = data.sourceId.trim();

            // Check if already exists for this project
            const existing = await db.collection("knowledge_sources").findOne({ sourceId, project });
            if (existing) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: `La fuente con ID '${sourceId}' ya existe para este proyecto.` }));
              return;
            }

            const payload = {
              sourceId,
              project,
              category: data.category.trim(),
              name: data.name.trim(),
              url: data.url.trim(),
              tags: Array.isArray(data.tags) ? data.tags : (data.tags || "").split(",").map(t => t.trim()).filter(Boolean),
              enabled: data.enabled !== false,
              priority: Number(data.priority ?? 1),
              createdAt: new Date(),
              updatedAt: new Date()
            };

            await db.collection("knowledge_sources").insertOne(payload);

            // Sync new knowledge source to the JSON seed files
            updateKnowledgeJsonFiles(payload);

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "Fuente agregada exitosamente.", data: payload }));
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "JSON inválido en el cuerpo de la petición: " + err.message }));
          }
        });
        return;
      }

      // 9. GET /api/ticket-metrics
      if (url.pathname === "/api/ticket-metrics" && method === "GET") {
        const [metrics, sessions] = await Promise.all([
          db.collection("ticket_metrics").find({ project }).sort({ createdAt: -1 }).toArray(),
          db.collection("sessions").find({ project }).sort({ updatedAt: -1 }).toArray(),
        ]);

        const byTicket = new Map(metrics.map((m) => [m.ticket, { ...m, inProgress: false }]));
        const sessionGroups = {};
        for (const s of sessions) {
          const t = s.ticket;
          if (!t) continue;
          if (!sessionGroups[t]) sessionGroups[t] = [];
          sessionGroups[t].push(s);
        }
        for (const [ticket, runs] of Object.entries(sessionGroups)) {
          if (byTicket.has(ticket)) continue;
          runs.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          const latest = runs[0];
          const active = runs.some((r) => isSessionActive(r.status));
          byTicket.set(ticket, {
            ticket,
            inProgress: active,
            durationMinutes: 0,
            proposalAcceptedFirstTry: false,
            peerReviewBugsFound: 0,
            reworkRounds: 0,
            classification: latest.classification || "en curso",
            statusLabel: active ? "Sesión activa" : "Sin métrica de cierre",
          });
        }

        const merged = [...byTicket.values()].sort(
          (a, b) => (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0),
        );
        const hasProjectMetrics = metrics.length > 0;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          project,
          metricsSource: hasProjectMetrics ? "project" : "benchmark",
          metrics: merged,
          benchmark: hasProjectMetrics ? null : BENCHMARK_TICKET_METRICS,
        }));
        return;
      }

      // 10. GET /api/agent-performance
      if (url.pathname === "/api/agent-performance" && method === "GET") {
        const [metrics, closures, patternEvals] = await Promise.all([
          db.collection("ticket_metrics").find({ project }).toArray(),
          db.collection("ticket_closures").find({ project }).toArray(),
          db.collection("pattern_evals").find({ project }).toArray(),
        ]);

        const payload = computeAgentPerformance(metrics, closures, patternEvals);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ project, ...payload }));
        return;
      }

      // 11. POST /api/project-config
      if (url.pathname === "/api/project-config" && method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!data.project) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "El campo 'project' es requerido." }));
              return;
            }

            const updated = saveConfig({
              project: data.project,
              projectRoot: data.projectRoot || "",
              projectContext: data.projectContext || "",
              architectureTarget: data.architectureTarget || "",
              architectureCurrent: data.architectureCurrent || "",
              retentionDays: Number(data.retentionDays || 14),
              legacyMonolithPath: data.legacyMonolithPath || "",
              runtimeTarget: runtimeCtx.runtimeTarget,
              ide: runtimeCtx.runtimeTarget,
              updatedAt: new Date().toISOString(),
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, config: updated }));
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error procesando petición", details: err.message }));
          }
        });
        return;
      }

      // 12. GET /api/run-build
      if (url.pathname === "/api/run-build" && method === "GET") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });

        const sendEvent = (type, dataObj) => {
          res.write(`data: ${JSON.stringify({ type, ...dataObj })}\n\n`);
        };

        const type = url.searchParams.get("type") || "landing-page";
        const args = ["cli/iatl-install.mjs", "--non-interactive", "--build", type];

        const landingPageType = url.searchParams.get("landingPageType");
        const pageContext = url.searchParams.get("pageContext");
        const pageTitle = url.searchParams.get("pageTitle");
        const assetOption = url.searchParams.get("assetOption");
        const customAssetPath = url.searchParams.get("customAssetPath");
        const publishOption = url.searchParams.get("publishOption");
        const publishRepo = url.searchParams.get("publishRepo");
        const publishBranch = url.searchParams.get("publishBranch");
        const publishToken = url.searchParams.get("publishToken");

        if (landingPageType) args.push("--landing-page-type", landingPageType);
        if (pageContext) args.push("--page-context", pageContext);
        if (pageTitle) args.push("--page-title", pageTitle);
        if (assetOption) args.push("--asset-option", assetOption);
        if (customAssetPath) args.push("--custom-asset-path", customAssetPath);
        if (publishOption) args.push("--publish-option", publishOption);
        if (publishRepo) args.push("--publish-repo", publishRepo);
        if (publishBranch) args.push("--publish-branch", publishBranch);
        if (publishToken) args.push("--publish-token", publishToken);

        const child = spawn(process.execPath, args, {
          cwd: runtimeCtx.architectureRepo || ARCHITECTURE_REPO,
        });

        child.stdout.on("data", (data) => {
          const text = data.toString().trim();
          if (text) {
            const lines = text.split("\n");
            lines.forEach(l => sendEvent("stdout", { text: l }));
          }
        });

        child.stderr.on("data", (data) => {
          const text = data.toString().trim();
          if (text) {
            const lines = text.split("\n");
            lines.forEach(l => sendEvent("stderr", { text: l }));
          }
        });

        child.on("close", (code) => {
          sendEvent("done", { code });
          res.end();
        });

        child.on("error", (err) => {
          sendEvent("error", { message: err.message });
          res.end();
        });

        req.on("close", () => {
          child.kill();
        });
        return;
      }

      // 13. GET/POST /api/standards
      if (url.pathname === "/api/standards") {
        const stdPath = join(HUB_ROOT, "standards.json");
        if (method === "GET") {
          let data = { commits: "", branches: "", cr: "" };
          if (existsSync(stdPath)) {
            try { data = JSON.parse(readFileSync(stdPath, "utf8")); } catch (e) {}
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
          return;
        } else if (method === "POST") {
          let body = "";
          req.on("data", chunk => body += chunk);
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              writeFileSync(stdPath, JSON.stringify(data, null, 2));
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
      }

      // 14. POST /api/agent-loop/cv
      if (url.pathname === "/api/agent-loop/cv" && method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            let pdfBuffer;
            if (data.cvBase64) {
              pdfBuffer = Buffer.from(data.cvBase64, "base64");
            } else if (data.cvUrl) {
              const reqRes = await fetch(data.cvUrl);
              const ab = await reqRes.arrayBuffer();
              pdfBuffer = Buffer.from(ab);
            } else {
              throw new Error("No se proporcionó CV local ni URL");
            }

            let pdfParse;
            try {
              const mod = await import("pdf-parse");
              pdfParse = mod.default || mod;
            } catch (e) {
              throw new Error("El módulo pdf-parse no está instalado. Ejecuta npm i pdf-parse");
            }
            const pdfData = await pdfParse(pdfBuffer);
            const textContent = pdfData.text.replace(/\n/g, "<br/>");

            // Generación de preview (Mock Agente Daniel y Developer)
            const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV Landing Page - Autónoma</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 800px; margin: 40px auto; background: #1e293b; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); border: 1px solid #334155; }
    h1 { color: #38bdf8; font-size: 2.5rem; text-align: center; margin-bottom: 10px; }
    .badge { display: inline-block; background: #047857; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .content { line-height: 1.8; font-size: 1.05rem; background: rgba(0,0,0,0.2); padding: 25px; border-radius: 8px; border-left: 4px solid #38bdf8; }
    .agent-footer { margin-top: 40px; text-align: center; font-size: 0.85rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center;">
      <span class="badge">IATL CV Generado</span>
    </div>
    <h1>${data.type === 'curriculum' ? 'Mi Portafolio Profesional' : 'Landing Page'}</h1>
    <div style="text-align:center; color:#94a3b8; margin-bottom: 30px;">
      <i>Contexto dado al agente: ${data.context || 'Ninguno'}</i>
    </div>
    <div class="content">
      <h3 style="color:#fff; margin-top:0;">Extracto analizado del PDF:</h3>
      ${textContent}
    </div>
    <div class="agent-footer">
      Generado autónomamente por Agentes IATL. Salud del código validada por Agente CR.
    </div>
  </div>
</body>
</html>`;
            
            writeFileSync(join(HUB_ROOT, "preview-cv.html"), html);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "CV procesado y generado." }));
          } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // 15. GET /preview/cv
      if (url.pathname === "/preview/cv" && method === "GET") {
        const previewPath = join(HUB_ROOT, "preview-cv.html");
        if (existsSync(previewPath)) {
          const html = readFileSync(previewPath, "utf8");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        } else {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end("<h1>404 - Preview no generado aún.</h1>");
        }
        return;
      }

      // Route not found
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Recurso No Encontrado");

    } catch (error) {
      console.error("Error en el servidor:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error interno del servidor", details: error.message }));
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Puerto ${port} en uso, probando puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("❌ Error del servidor:", err.message);
    }
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}`;
    const ctx = resolveRuntimeContext();
    console.log(`\n======================================================`);
    console.log(`🚀 Dashboard IATL levantado (${ctx.runtimeLabel}).`);
    console.log(`👉 Accede a: ${url}`);
    console.log(`📦 Proyecto activo: ${ctx.project}`);
    console.log(`======================================================\n`);
    openBrowser(url);
  });
}

startServer();
