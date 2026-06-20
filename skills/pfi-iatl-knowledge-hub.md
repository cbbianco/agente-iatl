---
name: pfi-iatl-knowledge-hub
description: >-
  Hub IATL híbrido: Mongo (operativo) + ChromaDB (semántico). Sessions, findings,
  learnings, búsqueda embeddable. Setup-agent detecta IDE y configura proyecto/sprint/
  arquitectura. Usar al arrancar @iatl, @pfi-tl-peer-daniel, orquestador y tras review.
---

# IATL Knowledge Hub — Mongo + ChromaDB

## Cuándo usar

- **Instalación / nuevo IDE** — `setup-agent.js` (Cursor | Antigravity)
- **@iatl** — inicio sesión, review, poda, cierre HITL
- **@pfi-tl-peer-daniel** — fuentes, debates, **ingesta autónoma Chroma + JSON**
- **@pfi-review-orchestrator** — pipeline review
- **@pfi-cr-analyst** — contexto histórico ticket
- **@pfi-patterns-advisor** — `--tag patterns` + `--semantic-search`

## Ubicación

`~/.cursor/iatl-knowledge/` — ver `README.md`.

## Instalación (primera vez o cambio de IDE)

```bash
cd ~/.cursor/iatl-knowledge && npm install && node setup-agent.js
```

### Flujo setup (obligatorio si `config.json` falta o `_missing`)

1. **Reconocimiento IDE** — `query.js --ide-detect` o automático en setup
   - `cursor` — carpeta `.cursor` o `CURSOR_AGENT=1`
   - `antigravity` — carpeta `.antigravity` o `ANTIGRAVITY=1`
2. **Preguntas configuración** (interactivo o flags):
   - Proyecto (`project`)
   - Contexto del proyecto (`projectContext`)
   - Sprint (`sprintLabel`)
   - Arquitectura a utilizar (`architectureTarget`, ej. `hexagonal-lambda-nestjs`)
   - Retención HITL (`retentionDays`, default 14)
3. Init Mongo + seed + `migrate-to-chroma.js`

**Interfaz @iatl al usuario: sin cambios** — el setup es infraestructura del hub.

## División Mongo vs Chroma

| MongoDB (operativo) | ChromaDB (semántico) |
|---------------------|----------------------|
| sessions, working_branches | Texto embeddable / RAG |
| review_findings (metadatos) | Resúmenes extendidos findings |
| pattern_evals, review_meta | Narrativa patrones |
| learnings (bullets activos) | Learnings + notas largas |
| knowledge_sources (índice URL) | Contenido enriquecido fuentes |
| peer_discussions (veredicto) | Rationale debate Daniel |
| ticket_closures | knowledge_note autónomos Daniel |

## Consulta obligatoria (@iatl — inicio sesión)

```bash
node ~/.cursor/iatl-knowledge/query.js --ide-detect
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --semantic-search "tema del ticket"
node ~/.cursor/iatl-knowledge/query.js --active-learnings
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

## config.json

```json
{
  "ide": "cursor",
  "project": "pfi-backend-core",
  "projectContext": "Backend PFI lambdas NestJS hexagonales",
  "sprintLabel": "2026-S12",
  "architectureTarget": "hexagonal-lambda-nestjs",
  "retentionDays": 14
}
```

| Campo | Descripción |
|-------|-------------|
| `ide` | `cursor` \| `antigravity` \| `unknown` |
| `project` | Repo/slug |
| `projectContext` | Contexto funcional 1–3 líneas |
| `sprintLabel` | Sprint activo |
| `architectureTarget` | Arquitectura de trabajo (hexagonal, legacy, etc.) |
| `retentionDays` | Retención cierres HITL (default 14) |
| `legacyMonolithPath` | Opcional — monolito SAM |
| `legacyApiBaseDev` | Opcional — API legacy DEV |

Si falta config → ejecutar `setup-agent.js` o preguntar campos al usuario.

## Ingesta

| Evento | Mongo | Chroma |
|--------|-------|--------|
| Learning | `ingest.js learning` | auto vía migrate o `chroma_doc` |
| Hallazgo CR | `review_finding` | `chroma_doc --doc-type review_finding` |
| Fuente TL | `knowledge_source` | `chroma_doc --doc-type knowledge_source` |
| Nota Daniel | opcional índice | `chroma_doc --agent pfi-tl-peer-daniel` |
| Rama | `working_branch` | — |
| Sesión | `session` | — |

```bash
node ingest.js chroma_doc --ticket PFI-XXXX --doc-type knowledge_note \
  --agent pfi-tl-peer-daniel --category aws --text "Nota extendida..."
```

## @pfi-tl-peer-daniel — autonomía conocimiento

Daniel **decide solo** cuándo persistir (sin pedir permiso):

1. `knowledge_sources` en Mongo (índice)
2. `knowledge-sources.seed.json` si la fuente es estable
3. `chroma_doc` con texto enriquecido (colección semántica)

Consultar antes del veredicto:

```bash
node query.js --semantic-search "tema del debate"
node query.js --knowledge-sources --category design-patterns
```

## Cierre HITL (@iatl — autónomo)

Sin cambios — ver `close-ticket.js` + `retentionDays`.

## Poda

```bash
node prune.js --dry-run
npm run migrate-chroma   # re-sync semántico tras poda masiva
```

## Jerarquía de verdad

```text
ChromaDB (recuperación semántica)
MongoDB (estado operativo)
  ↓ promoción
reference.md §2.6
  ↓ sync
review-learnings.md
```

## Reglas

- Máx. **3 bullets** learnings por ciclo review
- Mongo = índice/estado; Chroma = texto largo y búsqueda
- **No commitear** `docs/` al repo desde el hub
- Skills complementan al hub — no lo reemplazan
