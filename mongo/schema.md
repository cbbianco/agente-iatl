# Mongo — Esquema iatl_knowledge

Base de datos local: `iatl_knowledge` (default URI `mongodb://127.0.0.1:27017`).

Scripts: `~/.cursor/iatl-knowledge/`

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
| **`knowledge_sources`** | **Índice URLs par TL** | seed + ingest |
| **`peer_discussions`** | **Debates pre-HITL** | @pfi-tl-peer-daniel |

## Índices (init-indexes.js)

- `knowledge_sources`: unique `sourceId`; `category + priority`; `enabled + category`; `tags`
- `peer_discussions`: `ticket + createdAt`; `verdict`; `source`

## Instalación

```bash
cd ~/.cursor/iatl-knowledge
npm install
npm run init
npm run seed-sources
```

## Consultas

```bash
node query.js --ticket PFI-XXXX
node query.js --active-learnings
node query.js --knowledge-sources [--category aws]
node query.js --peer-discussions [--ticket PFI-XXXX]
```

## Ingesta

```bash
node ingest.js learning --ticket PFI-XXXX --category tl-peer --text "..." --source pfi-tl-peer-daniel

node ingest.js knowledge_source --id "..." --category rest-api --name "..." --url "https://..."

node ingest.js peer_discussion --ticket PFI-XXXX --verdict APTO_PROPUESTA \
  --summary "..." --sources-used "aws-lambda-best-practices"
```

Ver también [knowledge-sources.md](knowledge-sources.md).
