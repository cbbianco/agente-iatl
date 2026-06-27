# Changelog — PFI Agent Architecture

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Versionado semántico aproximado según commits del repo.

---

## [0.11.0] — 2026-06-27

**Tema:** Guía de instalación publicada + instalador copia skills completos.

### Añadido

- **`docs/INSTALL.md`** — guía paso a paso: requisitos, CLI, manual, Docker, MCP Jira, actualización, troubleshooting

### Cambiado

- **`README.md`** — enlace a guía de instalación; agentes Daniel split; versión 0.11.0
- **`cli/lib/install-target.mjs`** — copia directorios skill completos (`pfi-iatl-developer-profile`, Daniel, etc.); `repoVersion` desde `package.json`

---

## [0.10.0] — 2026-06-27

**Tema:** Skills CR + overview Daniel split en diagrama.

### Añadido

- **`skills/pfi-pr-code-review.md`** — espejo skill review PR
- **`skills/pfi-spec-driven-code-review.md`** — espejo gate post spec-driven
- **`skills/pfi-git-branch-format.md`** — espejo convención ramas PFI

### Cambiado

- **`architecture/overview.md`** — tabla y diagrama mermaid: Daniel análisis/implementación + CR analyst + patterns advisor

---

## [0.9.0] — 2026-06-26

**Tema:** Learning trace en cierre HITL + sync operativa sprint S12.

### Añadido

- **`mongo/scripts/lib/learning-trace.js`** — normalización learnings + `resume_context` al retomar sesión
- **`architecture/learning-trace-resume.md`** — diseño traza analítica (último bullet con `howWeGotHere`, `operationalRule`)
- **`skills/pfi-tl-peer-daniel-analisis/`**, **`skills/pfi-tl-peer-daniel-implementacion/`**, **`skills/pfi-tl-peer-daniel/`** — espejo completo
- **`skills/pfi-iatl-developer-profile/`** — profile stack operativo

### Cambiado

- **`mongo/scripts/close-ticket.js`**, **`query.js`**, **`ingest.js`**, **`init-indexes.js`** — soporte `trace` + `isResumeTrace` + `session_context.resume_context`
- **`skills/pfi-iatl-knowledge-hub.md`** — § learnings con traza
- **`working-branches.md`**, **`context/active-tickets.md`** — PFI-1243 cerrado, PFI-1205 activo
- Agentes Daniel split + pipeline actualizado (desde 0.8.0 pendiente de commit)

---

## [0.8.0] — 2026-06-25

**Tema:** Split agente par TL Daniel — análisis vs implementación.

### Añadido

- **`agents/pfi-tl-peer-daniel-analisis.md`** — debate diseño/spec + post CR (modos A/B)
- **`agents/pfi-tl-peer-daniel-implementacion.md`** — check plan pre-código + check código (modos C/D)
- **`skills/pfi-tl-peer-daniel-analisis/`** — skill + reference + anti-patterns + seed
- **`skills/pfi-tl-peer-daniel-implementacion/`** — skill implementación

### Cambiado

- **`agents/pfi-tl-peer-daniel.md`** — alias de daniel-análisis
- **`agents/iatl.md`** — flujo spec-driven con gates C/D implementación
- **`skills/pfi-iatl-developer-profile/`** — catálogo y profile-stack actualizados
- **`mongo/scripts/lib/ticket-classifier.js`** — sugiere ambos agentes Daniel según perfil

---

## [0.7.0] — 2026-06-23

**Tema:** Perfil desarrollador IATL v1.6 — orquestación multi-ticket, triage review, rol corregido.

### Añadido

- **`skills/pfi-iatl-developer-profile/`** — espejo completo del profile stack operativo (`~/.cursor/skills/`)
  - Modos sesión: debate | implementación | operación
  - Triage review externo (falso positivo | aplicable | deuda preexistente | diferido)
  - Sesiones multi-ticket + hub Mongo
  - Clasificación ticket → Fast/Standard/Full
  - Visión IATL agnóstico IDE

### Cambiado

- `agents/iatl.md` — modos de sesión + triage review externo
- `skills/catalog.md` — referencia al profile en repo
- `LOCATIONS.md` — ruta profile stack en repo
- Rol desarrollador: **Full Stack Senior** (IC) — eliminada etiqueta incorrecta "tech lead"

---

## [0.6.0] — 2026-06-22

**Tema:** Instalador portable multi-runtime, clasificación de tickets, métricas, diagramas y resolución formal de conflictos.

### Añadido

- **CLI `iatl-install`** — `cli/iatl-install.mjs` + `npm run install:iatl`
  - Runtime: Cursor, VS Code, VS Code + Claude Code, Antigravity, Docker
  - Preguntas: proyecto, contexto, sprint, arquitectura, legacy, retención HITL
- **Docker stack** — `docker/Dockerfile`, `docker-compose.yml`, `.env.example`
- **`ticket-classifier.js`** — clasificación bug|refactor|feature|arquitectura|investigacion
- **`query.js --classify-ticket`** y **`--ticket-metrics`**
- **`ingest.js ticket_classification`** y **`ticket_metric`**
- Colecciones Mongo: `ticket_classifications`, `ticket_metrics`
- `architecture/diagrams.md` — componentes, secuencia, flujo decisiones
- `architecture/ticket-classification.md` — perfiles fast|standard|full|light
- `architecture/quality-metrics.md` — métricas de calidad + línea base evolutiva
- `docs/agent-conflict-resolution.md` — matriz autoridad y escalamiento HITL

### Cambiado

- `setup-agent.js` — runtimeTarget, legacy paths, soporte multi-IDE
- `lib/ide-detect.js` — vscode, vscode-claude, docker
- `lib/config.js` — `runtimeTarget`, `claudeCode`, `legacyMonolithPath`
- `agents/iatl.md` — paso 0 clasificación + métricas al cierre
- `README.md`, `LOCATIONS.md`, `mongo/config.example.json`

---

## [0.5.0] — 2026-06-19

**Commit:** `b6c50ca` — *update: hub IATL v2.0 Mongo + ChromaDB en repo agente*  
**Base anterior:** `c0728dd` — *feature: se actualizo funciones del agente*  
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

### Ejemplos de uso (v2.0 — validados en operación)

#### 1. Arranque de sesión @iatl (Mongo operativo)

```bash
node ~/.cursor/iatl-knowledge/query.js --ide-detect
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-1120
```

Respuesta real `--ide-detect`:

```json
{ "ide": "cursor", "label": "Cursor" }
```

Respuesta real `--project-config` (fragmento):

```json
{
  "project_config": {
    "project": "pfi-backend-core",
    "projectContext": "Backend PFI: lambdas NestJS hexagonales...",
    "sprintLabel": "2026-S12",
    "architectureTarget": "hexagonal-lambda-nestjs",
    "ide": "cursor",
    "retentionDays": 14
  }
}
```

#### 2. Recall semántico (Chroma — sin saber el ticket exacto)

```bash
node ~/.cursor/iatl-knowledge/query.js --semantic-search "oficio fiscalia numero legacy"
```

Encuentra hallazgos CR de **PFI-1120** aunque la query no mencione el ticket:

```json
{
  "query": "oficio fiscalia numero legacy",
  "semantic_results": [
    {
      "text": "[medium] oficio-fiscalia-sustancias.mapper.ts:35 ... lookupTipoBulto() duplicada en 3 mappers",
      "metadata": { "ticket": "PFI-1120", "docType": "review_finding", "severity": "medium" },
      "distance": 0.28
    }
  ]
}
```

#### 3. Health check Chroma

```bash
node ~/.cursor/iatl-knowledge/query.js --chroma-health
```

```json
{
  "chroma": {
    "ok": true,
    "host": "127.0.0.1",
    "port": 8010,
    "collection": "iatl_semantic_knowledge",
    "count": 54
  }
}
```

#### 4. Daniel persiste conocimiento extendido (autónomo)

```bash
node ~/.cursor/iatl-knowledge/ingest.js chroma_doc \
  --ticket PFI-1120 \
  --doc-type knowledge_note \
  --agent pfi-tl-peer-daniel \
  --category draft-orchestration \
  --text "En QA el pool Postgres es singleton: orquestación secuencial obligatoria, no Promise.all"
```

Indexa en Chroma para futuras búsquedas semánticas; Mongo conserva el índice operativo.

#### 5. Setup inicial (nuevo IDE o máquina)

```bash
cd ~/.cursor/iatl-knowledge
npm install
node setup-agent.js          # detecta Cursor/Antigravity, pregunta proyecto/sprint
npm run migrate-chroma       # primera migración Mongo → Chroma
npx chroma run --path ./chroma-data --port 8010
```

### Operación validada (sesión 2026-06-19)

| Item | Resultado |
|------|-----------|
| Migración Chroma | 54 docs en `iatl_semantic_knowledge` |
| PFI-1120 | Ramas feature + update + conflicts develop/qa pusheadas; sesión pausada |
| Búsqueda semántica | Recall CR findings PFI-1120 con query en lenguaje natural |
| Ramas activas Mongo | 5 ramas PFI-1120 + PFI-1039/1228/1215 registradas |

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

## Comparativa rápida v0.4.0 → v0.5.0

| Área | v0.4.0 | v0.5.0 |
|------|--------|--------|
| Capa semántica | Análisis propuesto (`knowledge-layer-chroma.md`) | **ChromaDB implementado** — 54 docs, búsqueda embeddable |
| Setup agente | Manual (`config.json` a mano) | **`setup-agent.js`** — detecta IDE + preguntas interactivas |
| Consultas hub | Solo Mongo (`--ticket`, `--learnings`) | **+ `--semantic-search`**, `--chroma-health`, `--ide-detect` |
| Ingesta Daniel | Mongo + seed JSON | **+ `chroma_doc`** autónomo en Chroma |
| Config sprint | `project`, `sprintLabel`, `retentionDays` | **+ `ide`, `projectContext`, `architectureTarget`, `chroma.*`** |
| Scripts en repo | Mongo only | **+ chroma.js, ide-detect.js, setup-agent, migrate-to-chroma** |
| Ticket activo | PFI-1215 / cierre 1172 | **PFI-1120 pausada** (oficio fiscalía, 5 ramas) |

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
