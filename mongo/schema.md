# Mongo — Esquema iatl_knowledge

Base de datos local: `iatl_knowledge` (default URI `mongodb://127.0.0.1:27017`).

Scripts operativos: `~/.cursor/iatl-knowledge/`  
Copia referencia: `pfi-agent-architecture/mongo/scripts/`

## Configuración proyecto / sprint

Archivo: `~/.cursor/iatl-knowledge/config.json` (ver `config.example.json`)

| Campo | Descripción |
|-------|-------------|
| `project` | Identificador del repo (ej. `pfi-backend-core`) |
| `sprintLabel` | Etiqueta sprint activo (ej. `2026-S12`) |
| `retentionDays` | Retención cierres HITL (default **14** = 2 semanas) |

Al instalar en proyecto nuevo, el agente **pregunta** proyecto / sprint / retención si falta config.

## Colecciones

| Colección | Propósito | Escritor principal |
|-----------|-----------|-------------------|
| `sessions` | Contexto sesión (ticket, rama, arquitectura) | @iatl |
| `learnings` | Bullets activos; sync review-learnings.md | @iatl, @pfi-tl-peer-daniel |
| `learnings_archive` | Poda semanal | prune.js |
| `review_findings` | Hallazgos CR | @pfi-cr-analyst |
| `pattern_evals` | Evaluaciones GoF | @pfi-patterns-advisor |
| `review_meta` | Paquetes orquestador review | @pfi-review-orchestrator |
| `sources_cache` | Cache fetch web patrones | @pfi-patterns-advisor |
| `knowledge_sources` | Índice URLs par TL | seed + ingest |
| `peer_discussions` | Debates pre-HITL | @pfi-tl-peer-daniel |
| `working_branches` | Ramas Git en trabajo | @iatl (`pfi-daily-branch-tracker`) |
| **`ticket_closures`** | **Cierre HITL por ticket/sprint** | `close-ticket.js` (@iatl autónomo) |

### ticket_closures

Documento por ticket cerrado HITL:

- `project`, `ticket`, `sprintLabel`, `verdict`, `summary`
- `learnings[]`, `branches[]`, `endpoints[]`
- `closedAt`, `expiresAt` (= `closedAt + retentionDays`)
- `hitlSource`: `user`

Learnings de categoría `ticket-closure` en colección `learnings` con mismo `expiresAt`.

## Índices (init-indexes.js)

- `knowledge_sources`: unique `sourceId`; `category + priority`; `enabled + category`; `tags`
- `peer_discussions`: `ticket + createdAt`; `verdict`; `source`
- `working_branches`: unique `branch`; `ticket + updatedAt`; `status + updatedAt`
- `ticket_closures`: unique `project + ticket`; `expiresAt`; `sprintLabel + closedAt`

## Instalación

```bash
cd ~/.cursor/iatl-knowledge
npm install
npm run init
npm run seed-sources
```

## Consultas

```bash
node query.js --project-config
node query.js --ticket PFI-XXXX
node query.js --ticket-closure --ticket PFI-XXXX
node query.js --active-learnings
node query.js --knowledge-sources [--category aws]
node query.js --peer-discussions [--ticket PFI-XXXX]
node query.js --working-branches [--ticket PFI-XXXX] [--status active]
```

## Cierre HITL (autónomo)

```bash
node close-ticket.js --ticket PFI-XXXX --payload-file /tmp/pfi-XXXX-closure.json
```

Disparador: usuario confirma cierre (*"cerremos la 1238"*). Ver skill `pfi-iatl-knowledge-hub.md`.

## Ingesta

```bash
node ingest.js learning --ticket PFI-XXXX --category tl-peer --text "..." --source pfi-tl-peer-daniel

node ingest.js knowledge_source --id "..." --category rest-api --name "..." --url "https://..."

node ingest.js peer_discussion --ticket PFI-XXXX --verdict APTO_PROPUESTA \
  --summary "..." --sources-used "aws-lambda-best-practices"

node ingest.js working_branch --ticket PFI-XXXX --branch "pfi-XXXX/fix/slug" \
  --base develop --role feature --status active --notes "contexto"
```

Ver también [knowledge-sources.md](knowledge-sources.md).
