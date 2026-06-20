# IATL Knowledge Hub — Mongo + ChromaDB

Hub híbrido para agentes IATL (`~/.cursor/iatl-knowledge/`).

| Capa | Motor | Rol |
|------|-------|-----|
| **Operativo** | MongoDB | Sesiones, ramas, findings, metadatos, índice de fuentes |
| **Semántico** | ChromaDB | Texto embeddable, búsqueda por significado, notas Daniel |

## Requisitos

- MongoDB local `127.0.0.1:27017` (o `IATL_MONGO_URI`)
- ChromaDB (npm `chromadb` + persistencia local o servidor)
- Node.js ≥ 18

## Instalación (primera vez o nuevo IDE)

```bash
cd ~/.cursor/iatl-knowledge
npm install
node setup-agent.js
```

### Flujo `setup-agent.js`

1. **Reconocimiento IDE** — Cursor vs Antigravity (`.cursor` / `.antigravity`, env)
2. **Configuración** — proyecto, contexto, sprint, arquitectura target
3. **Init** — índices Mongo + seed fuentes + migración Chroma

Modo no interactivo:

```bash
node setup-agent.js --non-interactive \
  --project pfi-backend-core \
  --context "Backend PFI lambdas NestJS hexagonales" \
  --sprint 2026-S12 \
  --architecture hexagonal-lambda-nestjs
```

## Variables de entorno

| Variable | Default |
|----------|---------|
| `IATL_MONGO_URI` | `mongodb://127.0.0.1:27017` |
| `IATL_MONGO_DB` | `iatl_knowledge` |
| `IATL_CHROMA_PATH` | `~/.cursor/iatl-knowledge/chroma-data` |
| `IATL_CHROMA_HOST` | (vacío = persistencia local) |
| `IATL_CHROMA_PORT` | `8000` |
| `IATL_CHROMA_COLLECTION` | `iatl_semantic_knowledge` |
| `IATL_IDE` | auto (`cursor` / `antigravity`) |

## MongoDB — qué permanece

| Colección | Contenido |
|-----------|-----------|
| `sessions` | Ticket, rama, arquitectura target |
| `working_branches` | Ramas activas del desarrollador |
| `review_findings` | Hallazgos CR (metadatos + summary corto) |
| `pattern_evals` | Evaluaciones GoF |
| `review_meta` | Paquetes orquestador |
| `learnings` | Bullets activos (estado, categoría) |
| `learnings_archive` | Poda |
| `knowledge_sources` | **Índice** URL/categoría/enabled (catálogo) |
| `peer_discussions` | Veredictos Daniel (estructurado) |
| `ticket_closures` | Cierres HITL |

## ChromaDB — qué migra

| docType | Origen |
|---------|--------|
| `knowledge_source` | Seed JSON + Mongo (texto enriquecido) |
| `learning` | Mongo learnings |
| `peer_discussion` | Debates Daniel |
| `review_finding` | Hallazgos extendidos |
| `pattern_eval` | Narrativa patrones |
| `knowledge_note` | Aportes autónomos @pfi-tl-peer-daniel |

## Comandos

```bash
# Setup completo
npm run setup

# Consultas
node query.js --project-config
node query.js --ticket PFI-1120
node query.js --semantic-search "pool postgres secuencial qa"
node query.js --chroma-health
node query.js --ide-detect

# Ingesta
node ingest.js learning --ticket PFI-1120 --category Runtime --text "..."
node ingest.js chroma_doc --ticket PFI-1120 --doc-type knowledge_note \
  --agent pfi-tl-peer-daniel --text "Nota semántica extendida"

# Migración / poda
npm run migrate-chroma
node prune.js --dry-run
```

## Jerarquía de verdad

```text
ChromaDB (recuperación semántica, RAG)
MongoDB (estado operativo, índice, consultas estructuradas)
  ↓ promoción poda
reference.md (reglas estables)
  ↓ sync
review-learnings.md (vista humana)
```

## Interfaz @iatl

**Sin cambios** para el usuario: sigue siendo `@iatl` quien debate, sintetiza y pide HITL. El hub enriquece decisiones por detrás.

## Quién escribe

| Agente | Mongo | Chroma |
|--------|-------|--------|
| @iatl | sessions, learnings | chroma_doc (opcional) |
| @pfi-tl-peer-daniel | peer_discussions, knowledge_sources | **chroma_doc autónomo** |
| @pfi-cr-analyst | review_findings | vía migrate / ingest |
| @pfi-patterns-advisor | pattern_evals | vía migrate |
