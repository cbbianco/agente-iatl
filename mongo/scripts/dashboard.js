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
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn, exec } from "node:child_process";
import { platform } from "node:os";
import { getDb, closeDb } from "./lib/mongo.js";
import { loadConfig } from "./lib/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 8030;

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

      // 3. GET /api/config
      if (url.pathname === "/api/config" && method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(config));
        return;
      }

      // DB connection for other API routes
      let db;
      try {
        db = await getDb();
      } catch (err) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "DB_CONNECTION_ERROR", details: err.message }));
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

        const [findings, patterns, learnings, peerDiscussions, workingBranches, closure, session] = await Promise.all([
          db.collection("review_findings").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("pattern_evals").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("learnings").find({ ticket, project, status: "active" }).sort({ createdAt: -1 }).toArray(),
          db.collection("peer_discussions").find({ ticket, project }).sort({ createdAt: -1 }).toArray(),
          db.collection("working_branches").find({ ticket, project }).sort({ updatedAt: -1 }).toArray(),
          db.collection("ticket_closures").findOne({ ticket, project }),
          db.collection("sessions").findOne({ ticket, project }, { sort: { updatedAt: -1 } })
        ]);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          session,
          findings,
          patterns,
          learnings,
          peerDiscussions,
          workingBranches,
          closure
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

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "Fuente agregada exitosamente.", data: payload }));
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "JSON inválido en el cuerpo de la petición: " + err.message }));
          }
        });
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
    console.log(`\n======================================================`);
    console.log(`🚀 Dashboard IATL del Proyecto levantado con éxito.`);
    console.log(`👉 Accede a: ${url}`);
    console.log(`======================================================\n`);
    openBrowser(url);
  });
}

startServer();
