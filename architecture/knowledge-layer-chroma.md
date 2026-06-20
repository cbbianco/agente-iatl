# Capa de conocimiento — Mongo + Chroma (implementado v2.0)

## Estado

**Implementado** en `~/.cursor/iatl-knowledge/` (v2.0.0). Espejo de scripts en `mongo/scripts/` de este repo.

## División de responsabilidades

| Almacén | Contenido | Operaciones |
|---------|-----------|-------------|
| **MongoDB** (`iatl_knowledge`) | sessions, working_branches, ticket_closures, learnings (meta), review_findings (meta), peer_discussions (meta), knowledge_sources (índice), pattern_evals | CRUD operativo, filtros por sprint/ticket, retención |
| **ChromaDB** (`iatl_semantic_knowledge`) | Texto enriquecido de learnings, review_findings, peer_discussions rationale, knowledge_sources, `chroma_doc` autónomos de Daniel | Búsqueda semántica, recall por similitud |

## Flujo de ingest

```mermaid
flowchart LR
  subgraph Agentes
    IATL[@iatl]
    DAN[@pfi-tl-peer-daniel]
    CR[@pfi-cr-analyst]
  end

  subgraph Hub["~/.cursor/iatl-knowledge"]
    ING[ingest.js]
    QRY[query.js]
  end

  subgraph Stores
    M[(MongoDB)]
    C[(ChromaDB :8010)]
  end

  IATL --> ING
  DAN --> ING
  CR --> ING
  ING --> M
  ING --> C
  QRY --> M
  QRY --> C
```

## Setup inicial

```bash
cd ~/.cursor/iatl-knowledge
npm install
node setup-agent.js          # detecta IDE, pregunta proyecto/sprint/arquitectura
node migrate-to-chroma.js    # migra docs existentes de Mongo → Chroma
```

## Chroma local

```bash
cd ~/.cursor/iatl-knowledge
npx chroma run --path ./chroma-data --port 8010
```

Verificar:

```bash
curl -s http://127.0.0.1:8010/api/v2/heartbeat
node query.js --chroma-health
node query.js --semantic-search "pool postgres secuencial qa"
```

## Config (`config.json`)

Campos nuevos v2.0:

| Campo | Descripción |
|-------|-------------|
| `ide` | `cursor` \| `antigravity` — detectado por `setup-agent.js` |
| `projectContext` | Bounded context activo (ej. `lambda-documento`) |
| `architectureTarget` | Objetivo arquitectónico (ej. `hexagonal-nestjs`) |
| `chroma.host` | Default `127.0.0.1:8010` |
| `chroma.collection` | Default `iatl_semantic_knowledge` |

## Tipos de documento Chroma

| `docType` | Origen | Uso |
|-----------|--------|-----|
| `learning` | learnings Mongo | Recall sprint/ticket |
| `review_finding` | review_findings | Antipatrones similares |
| `peer_discussion` | peer_discussions | Rationale Daniel |
| `knowledge_source` | knowledge_sources | Fuentes enriquecidas |
| `chroma_doc` | Daniel autónomo | Persistencia semántica ad-hoc |

## Interfaz @iatl

Sin cambios para el desarrollador. El hub enruta automáticamente:
- Consultas operativas → Mongo (`query.js --sprint`, `--ticket`, etc.)
- Recall semántico → Chroma (`query.js --semantic-search "..."`)

## Migración ejecutada (2026-06-19)

- 54 documentos migrados a colección `iatl_semantic_knowledge`
- Puerto 8010, path `~/.cursor/iatl-knowledge/chroma-data`
