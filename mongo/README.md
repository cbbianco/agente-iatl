# IATL Knowledge Hub — Mongo + ChromaDB v2.0

Fuente de verdad centralizada para agentes IATL (`~/.cursor/iatl-knowledge/`).

## Requisitos

- MongoDB local en `127.0.0.1:27017` (o `IATL_MONGO_URI`)
- Node.js ≥ 18
- ChromaDB local en puerto **8010** (para búsqueda semántica)

## Instalación (una vez)

```bash
cd ~/.cursor/iatl-knowledge
npm install
node setup-agent.js          # detecta IDE, configura proyecto/sprint/arquitectura
npm run init
npm run seed-sources
npm run migrate-chroma       # migra docs existentes Mongo → Chroma
```

Arrancar Chroma:

```bash
npx chroma run --path ./chroma-data --port 8010
```

## Variables de entorno (opcional)

| Variable | Default |
|----------|---------|
| `IATL_MONGO_URI` | `mongodb://127.0.0.1:27017` |
| `IATL_MONGO_DB` | `iatl_knowledge` |
| `IATL_CHROMA_HOST` | `127.0.0.1` |
| `IATL_CHROMA_PORT` | `8010` |

## Scripts nuevos v2.0

| Script | Función |
|--------|---------|
| `setup-agent.js` | Detecta IDE (Cursor/Antigravity) + config interactiva |
| `migrate-to-chroma.js` | Migra learnings/findings/discussions → Chroma |
| `lib/chroma.js` | Cliente ChromaDB |
| `lib/ide-detect.js` | Detección IDE |

## Colecciones Mongo (operativo)

| Colección | Contenido |
|-----------|-----------|
| `sessions` | Contexto de sesión (ticket, rama, arquitectura target) |
| `review_findings` | Hallazgos CR (metadatos) |
| `pattern_evals` | Evaluaciones @pfi-patterns-advisor |
| `review_meta` | Paquetes del orquestador |
| `learnings` | Bullets activos (sync con review-learnings.md) |
| `learnings_archive` | Poda semanal |
| `sources_cache` | Cache fetch web (patrones) |
| `knowledge_sources` | Índice URLs contexto par TL |
| `peer_discussions` | Debates @iatl ↔ @pfi-tl-peer-daniel |
| `working_branches` | Ramas Git en trabajo |
| `ticket_closures` | Cierres HITL por sprint |

## Chroma (semántico)

Colección `iatl_semantic_knowledge` — texto enriquecido para búsqueda por similitud.

## Comandos

```bash
# Setup / health
node setup-agent.js
node query.js --ide-detect
node query.js --chroma-health
node query.js --project-config

# Consultar ticket
node query.js --ticket PFI-1019

# Búsqueda semántica
node query.js --semantic-search "pool postgres secuencial qa"

# Learnings activos
node query.js --active-learnings

# Ingesta Chroma (Daniel autónomo)
node ingest.js chroma_doc --ticket PFI-XXXX --doc-type knowledge_note \
  --agent pfi-tl-peer-daniel --text "Nota extendida..."

# Poda (dry-run)
node prune.js --dry-run
npm run migrate-chroma   # re-sync tras poda masiva
```

Ver espejo completo en `mongo/scripts/` y [hub-readme.md](hub-readme.md).
