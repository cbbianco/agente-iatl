# IATL Knowledge Hub — Mongo local

Fuente de verdad centralizada para agentes IATL (`~/.cursor/iatl-knowledge/`).

## Requisitos

- MongoDB local en `127.0.0.1:27017` (o `IATL_MONGO_URI`)
- Node.js ≥ 18

## Instalación (una vez)

```bash
cd ~/.cursor/iatl-knowledge
npm install
npm run init
npm run seed-sources
```

## Variables de entorno (opcional)

| Variable | Default |
|----------|---------|
| `IATL_MONGO_URI` | `mongodb://127.0.0.1:27017` |
| `IATL_MONGO_DB` | `iatl_knowledge` |

## Colecciones

| Colección | Contenido |
|-----------|-----------|
| `sessions` | Contexto de sesión (ticket, rama, arquitectura target) |
| `review_findings` | Hallazgos CR (severidad, ubicación, fuente) |
| `pattern_evals` | Evaluaciones @pfi-patterns-advisor |
| `review_meta` | Paquetes del orquestador |
| `learnings` | Bullets activos (sync con review-learnings.md) |
| `learnings_archive` | Poda semanal |
| `sources_cache` | Cache fetch web (patrones) |
| `knowledge_sources` | Índice URLs contexto par TL (patrones, Node, REST, AWS) |
| `peer_discussions` | Debates @iatl ↔ @pfi-tl-peer-daniel pre-HITL |

## Comandos

```bash
# Consultar ticket
node query.js --ticket PFI-1019

# Learnings activos
node query.js --active-learnings

# Fuentes conocimiento par TL
node query.js --knowledge-sources
node query.js --knowledge-sources --category aws

# Debates par TL por ticket
node query.js --peer-discussions --ticket PFI-1019

# Ingestar learning
node ingest.js learning --ticket PFI-1019 --category Runtime --text "authorizer path param"

# Poda (dry-run)
node prune.js --dry-run
node prune.js --max-active 30
```

## Sincronización con archivos

| Archivo | Rol |
|---------|-----|
| `review-learnings.md` | Vista humana / export; @iatl sincroniza bullets activos |
| `reference.md` §2.6 | Reglas estables promovidas desde poda |
| `pattern-sources.json` | Índice fuentes web extensible (patrones) |
| `pfi-tl-peer-daniel/knowledge-sources.seed.json` | Seed fuentes TL → Mongo |

**Jerarquía:** Mongo (índice consultable) → reference.md (estable) → review-learnings.md (viva).

## Quién escribe

| Agente | Colección |
|--------|-----------|
| @iatl | sessions, learnings (promoción) |
| @pfi-review-orchestrator | review_meta |
| @pfi-cr-analyst | review_findings |
| @pfi-patterns-advisor | pattern_evals |
| @pfi-tl-peer-daniel | peer_discussions, learnings (tl-peer), knowledge_sources |

## Quién lee (arranque)

@iatl, @pfi-tl-peer-daniel, @pfi-review-orchestrator, @pfi-cr-analyst — `query.js --ticket`, `--knowledge-sources`, `--peer-discussions` o `--active-learnings`.
