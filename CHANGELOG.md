# Changelog — PFI Agent Architecture

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Versionado semántico aproximado según commits del repo.

---

## [0.5.0] — 2026-06-19

**Tema:** Hub IATL v2.0 — Mongo operativo + ChromaDB semántico + PFI-1120 pausada

### Añadido

- **ChromaDB v2.0** — capa semántica implementada en `~/.cursor/iatl-knowledge/`
  - `lib/chroma.js`, `lib/ide-detect.js`
  - `setup-agent.js` — detecta IDE (Cursor/Antigravity) + config interactiva
  - `migrate-to-chroma.js` — migración Mongo → Chroma
  - `query.js --semantic-search`, `--chroma-health`, `--ide-detect`
  - `ingest.js chroma_doc` — ingesta autónoma Daniel
- `chroma/README.md` — guía operativa Chroma local
- `mongo/hub-readme.md` — espejo README del hub operativo
- `mongo/package.json` v2.0.0 — deps `chromadb`, `@chroma-core/default-embed`
- `.gitignore` — excluye `chroma_local/venv/`

### Cambiado

- `architecture/knowledge-layer-chroma.md` — de análisis propuesto → **implementado v2.0**
- `architecture/overview.md` — Chroma de piloto a implementado
- `mongo/config.example.json` — campos `ide`, `projectContext`, `architectureTarget`, `chroma`
- `mongo/README.md` — instalación setup-agent + Chroma
- `skills/pfi-iatl-knowledge-hub.md` — skill v2 Mongo + Chroma
- `LOCATIONS.md` — rutas Chroma y setup-agent
- `README.md` — instalación v2.0, índice Chroma
- `working-branches.md` — **PFI-1120** (oficio fiscalía, pausada lunes)

### Operación validada (sesión 2026-06-19)

| Item | Resultado |
|------|-----------|
| Migración Chroma | 54 docs en `iatl_semantic_knowledge` |
| PFI-1120 | Ramas feature + update + conflicts develop/qa pusheadas; sesión pausada |

---

## [0.4.0] — 2026-06-19

**Tema:** resolución MCP-first de tickets + análisis capa Chroma + cierre PFI-1172 / apertura PFI-1215

### Añadido

- **Skill `pfi-ticket-source-resolver`** (`~/.cursor/skills/`) — al pasar número de historia:
  - Pregunta plataforma (Jira, ClickUp, Confluence, otro)
  - Si hay MCP → fetch directo **sin esperar link**
  - URL/link sigue funcionando como fallback
- `skills/pfi-ticket-source-resolver.md` — copia doc en repo
- `architecture/knowledge-layer-chroma.md` — análisis Mongo vs Chroma (capa 2 semántica, piloto propuesto)

### Cambiado

- `agents/iatl.md` — arranque: paso ticket-source-resolver antes de Mongo
- `skills/catalog.md` — nuevo skill + referencia MCP `user-jira-pandora-pfi`
- `context/active-tickets.md` — PFI-1215 activo; PFI-1172 cerrado; PFI-1238 cerrado
- `working-branches.md` — PFI-1215/1172 ramas actualizadas
- `README.md` — índice Chroma + ticket resolver

### Operación validada (sesión 2026-06-19)

| Ticket | Resultado |
|--------|-----------|
| PFI-1172 | Cerrado HITL · 3 ramas pusheadas · `af72e845` cómo probar validar documento |
| PFI-1215 | Sesión abierta · ramas desde PFI-1149 + conflict develop/qa · análisis spec-driven HU2 Seguridad |

---

## [0.3.0] — 2026-06-19

**Commit:** `53569a1` — *mejoras de cierre y debate de sesiones*  
**Base anterior:** `1ace3d3` — *v0.2.0 agente arquitectura*

Release centrada en **cierre HITL autónomo por sprint**, copia versionada del hub Mongo operativo y ampliación del pipeline de review (par TL modo B + artefactos CR en repo).

### Añadido

#### Hub Mongo — scripts operativos (copia referencia)

Nueva carpeta `mongo/scripts/` con espejo de `~/.cursor/iatl-knowledge/`:

| Script | Función |
|--------|---------|
| `close-ticket.js` | Cierre HITL: persiste `ticket_closures`, learnings `ticket-closure`, ramas `merged` |
| `query.js` | Consultas incl. `--ticket-closure`, `--project-config`, `--working-branches` |
| `ingest.js` | Ingesta sessions, learnings, working_branch, peer_discussion, etc. |
| `prune.js` | Poda learnings archivados y cierres expirados |
| `init-indexes.js` | Índices incl. `ticket_closures` |
| `seed-knowledge-sources.js` | Seed URLs par TL |
| `seed-working-branches.js` | Seed ramas iniciales |
| `lib/config.js` | Carga `config.json` + cálculo `expiresAt` por `retentionDays` |
| `lib/mongo.js` | Conexión Mongo local |

También:

- `mongo/config.example.json` — plantilla `project` / `sprintLabel` / `retentionDays` (default 14 días)
- `mongo/README.md` — instalación y comandos del hub
- `mongo/package.json` — dependencias Node del hub

#### Skills (copia doc)

- `skills/pfi-iatl-knowledge-hub.md` — skill completa del hub: consultas obligatorias, **§ Cierre HITL autónomo**, config sprint, poda
- `agents/pfi-code-reviewer.md` — alias documentado de `@pfi-review-orchestrator`

#### Arquitectura

- `architecture/overview.md` — diagramas Mermaid ampliados: capas HITL, hub Mongo (`ticket_closures`, `working_branches`), `config.json`, secuencia `close-ticket.js`
- `architecture/pipeline.md` — paso **Cierre HITL ticket (autónomo)** post-review; consulta `--ticket-closure` en arranque
- `architecture/feedback-loop.md` — fuente `ticket_closures` en ciclo de aprendizaje

#### Agente @iatl — flujo spec-driven 13 pasos

- Paso **11b:** cierre HITL autónomo (`close-ticket.js` + learnings sprint)
- Paso **7b:** `@pfi-tl-peer-daniel` **modo B** tras code review (revisa 2 `.md` CR)
- Paso **13:** transición ticket siguiente (`--ticket-closure` + `working_branch` active)
- Entregables CR formales: `CODE-REVIEW-PFI-XXXX.md` + `ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md`
- Commits: referencia a skill `pfi-commit-message-format` con `## Cómo probar`

#### Agente @pfi-tl-peer-daniel

- Rol ampliado: gate **pre-HITL** + **modo B post-CR** (extiende antipatrones, `knowledge_sources`)

#### Esquema Mongo

- Colección **`ticket_closures`**: cierre por ticket/proyecto/sprint con `expiresAt`
- Learnings categoría **`ticket-closure`** con retención parametrizable
- Índices `ticket_closures`: unique `project + ticket`; `expiresAt`; `sprintLabel + closedAt`
- Consultas: `--ticket-closure`, `--project-config`

#### Contexto operativo (snapshot 2026-06-19)

- `context/active-tickets.md` — **PFI-1238 cerrada HITL**; **PFI-1228 activa**; PFI-1039 pendiente
- `working-branches.md` — espejo ramas: 1228/1039 active; 1238 merged (cierre 2026-06-19)

### Cambiado

- `agents/iatl.md` — pipeline review: CR genera 2 `.md`; síntesis integra informe Daniel modo B; matriz de prioridad ampliada
- `agents/pfi-cr-analyst.md` — obligación de escribir los 2 artefactos `.md` en repo
- `agents/pfi-review-orchestrator.md` — payload y salida incluyen rutas de `.md` generados
- `agents/pfi-tl-peer-daniel.md` — modo B documentado; integración cierre sprint
- `skills/pfi-daily-branch-tracker.md` — delegación a `close-ticket.js` al cerrar ticket; formato listado ramas actualizado
- `skills/catalog.md` — referencia a `pfi-iatl-knowledge-hub.md`
- `LOCATIONS.md` — rutas `mongo/scripts/`, `config.example.json`, `close-ticket.js`
- `README.md` — pipeline con paso cierre HITL autónomo
- `mongo/schema.md` — documentación completa config + cierre + colección nueva

### Validado en operación (PFI-1238)

Primera ejecución real del cierre autónomo:

| Campo | Valor |
|-------|-------|
| Ticket | PFI-1238 |
| Sprint | `2026-S12` |
| Retención | 14 días → expira **2026-07-03** |
| Learnings | 3 bullets (contrato POST, orden guards, commits Markdown) |
| Ramas | feature + conflict develop + conflict qa → `merged` |

---

## [0.2.0] — 2026-06-17

**Commit:** `1ace3d3` — *v0.2.0 agente arquitectura*  
**Base anterior:** `b469329` — *arquitectura iatl*

Release de **registro diario de ramas**, snapshot tickets activos y protocolo deadlock par TL.

### Añadido

- `context/active-tickets.md` — snapshot PFI-1238, 1228, 1039
- `working-branches.md` — espejo numerado de ramas Git
- `skills/pfi-daily-branch-tracker.md` — skill registro `working_branches` en Mongo
- `docs/daily-branch-tracker.md` — protocolo humano
- `docs/peer-gate-deadlock-protocol.md` — desacuerdo @iatl ↔ Daniel → síntesis C
- Colección Mongo **`working_branches`** documentada en `mongo/schema.md`

### Cambiado

- `agents/iatl.md` — referencia deadlock protocol + daily branch tracker
- `architecture/pipeline.md` — consulta `working_branches` en arranque
- `spec-driven/workflow.md` — integración tracker ramas
- `LOCATIONS.md`, `README.md`, `skills/catalog.md` — mapa ampliado

---

## [0.1.0] — 2026-06-17

**Commit:** `b469329` — *arquitectura iatl*

Release inicial del repo de documentación de agentes.

### Añadido

- Estructura base: `agents/`, `architecture/`, `mongo/`, `skills/`, `spec-driven/`
- Agentes: `@iatl`, `@pfi-tl-peer-daniel`, `@pfi-review-orchestrator`, `@pfi-cr-analyst`, `@pfi-patterns-advisor`
- `architecture/overview.md`, `pipeline.md`, `feedback-loop.md`
- `mongo/schema.md`, `knowledge-sources.md`, `knowledge-sources.seed.json`
- `README.md`, `LOCATIONS.md`

---

## Comparativa rápida v0.2.0 → v0.3.0

| Área | v0.2.0 | v0.3.0 |
|------|--------|--------|
| Cierre ticket HITL | Manual / solo learnings sueltos | **`close-ticket.js` autónomo** + `ticket_closures` |
| Retención sprint | No parametrizada | **`config.json`** — `retentionDays` (default 14) |
| Scripts hub en repo | Solo docs (`schema.md`) | **Copia completa** en `mongo/scripts/` |
| Par TL post-CR | No | **Modo B** — revisa 2 `.md` CR |
| Artefactos review | Informe verbal | **2 `.md` obligatorios** en repo |
| Pipeline @iatl | 11 pasos | **13 pasos** (+ cierre + ticket siguiente) |
| PFI-1238 | Pendiente implementar | **Cerrada HITL** (hub + learnings) |
| PFI-1228 | Análisis | **Activa** — commit `81733dd4` en rama |

---

## Cómo leer versiones futuras

```bash
# Diff entre releases
git diff 1ace3d3..53569a1 --stat

# Ver commit de una versión
git show 53569a1 --oneline
```

Al publicar una nueva versión: añadir sección `[X.Y.Z]` arriba con commit hash, fecha y diff vs tag/commit anterior.
