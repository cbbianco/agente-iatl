---
name: pfi-iatl-knowledge-hub
description: >-
  Hub IATL híbrido: Mongo (operativo) + ChromaDB (semántico). Sessions, findings,
  learnings, búsqueda embeddable. Setup-agent detecta IDE y configura proyecto/sprint/
  arquitectura. Usar al arrancar @iatl, @pfi-tl-peer-daniel-analisis, @pfi-tl-peer-daniel-implementacion, orquestador y tras review.
---

# IATL Knowledge Hub — Mongo + ChromaDB

## Cuándo usar

- **Instalación / nuevo IDE** — `setup-agent.js` (Cursor | Antigravity)
- **@iatl** — inicio sesión, review, poda, cierre HITL
- **@pfi-tl-peer-daniel-analisis** — fuentes, debates análisis, **ingesta autónoma Chroma + JSON**
- **@pfi-tl-peer-daniel-implementacion** — debates implementación, check plan/código
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

**R4 — Siempre antes de analizar un ticket:** ejecutar `query.js --ticket` y **usar `session_context` como fuente primaria**. Prohibido reconstruir progreso solo desde memoria del chat.

```bash
node ~/.cursor/iatl-knowledge/query.js --ide-detect
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX   # ← OBLIGATORIO: lee session_context.checkpoints
node ~/.cursor/iatl-knowledge/query.js --semantic-search "tema del ticket"
node ~/.cursor/iatl-knowledge/query.js --active-learnings
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

El bloque `session_context` incluye: sesión activa, `current_phase`, `checkpoints[]`, **`resume_context`** (traza del último learning con análisis), clasificación y ramas.

## Checkpoints de sesión (progreso HU)

Al cerrar cada fase, persistir checkpoint (no reconstruir en el siguiente turno):

| Fase | `--phase` | Cuándo |
|------|-----------|--------|
| Análisis / spec-driven | `analisis` | root cause confirmado, evidencia curl/SQL |
| Backlog | `backlog` | alcance acordado, pendientes listados |
| Implementación | `implementacion` | fix/código aplicado o en curso |

```bash
node ingest.js session_checkpoint --ticket PFI-XXXX --phase analisis \
  --summary "Root cause: idCantidadCajetilla=0 viola FK; fix: normalizar a NULL"

node ingest.js session --ticket PFI-XXXX --branch "..." --architectura_target lambda-casos \
  --status active_spec_driven
```

Cada sesión activa mantiene `checkpoints[]` con `{ phase, summary, at }` y `currentPhase`.

## Catálogos BD (R7)

Ids numéricos de catálogo: **`scripts/catalogo/*.sql`** o query SQL del usuario. **Nunca** inferir ids desde Swagger/ejemplos del controller. Ver `config.json` → `catalogSourceOfTruth`.

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
| `apiDevBase` | API Gateway PFI dev (curls) |
| `catalogSourceOfTruth` | R7: ruta relativa repo para ids catálogo (`scripts/catalogo`) |
| `requireMongoQueryOnTicketStart` | R4: obligar `query.js --ticket` al arrancar |
| `sessionCheckpointsEnabled` | Checkpoints analisis/backlog/implementacion en sesión |

Si falta config → ejecutar `setup-agent.js` o preguntar campos al usuario.

## Ingesta

| Evento | Mongo | Chroma |
|--------|-------|--------|
| Learning | `ingest.js learning` | auto vía migrate o `chroma_doc` |
| **Checkpoint sesión** | `ingest.js session_checkpoint` | — |
| **Sesión activa** | `ingest.js session` (upsert) | — |
| Hallazgo CR | `review_finding` | `chroma_doc --doc-type review_finding` |
| Fuente TL | `knowledge_source` | `chroma_doc --doc-type knowledge_source` |
| Nota Daniel (análisis / impl) | opcional índice | `chroma_doc --agent pfi-tl-peer-daniel-analisis` o `pfi-tl-peer-daniel-implementacion` |
| Rama | `working_branch` | — |
| Sesión | `session` | — |

```bash
node ingest.js chroma_doc --ticket PFI-XXXX --doc-type knowledge_note \
  --agent pfi-tl-peer-daniel --category aws --text "Nota extendida..."
```

## @pfi-tl-peer-daniel-analisis / @pfi-tl-peer-daniel-implementacion — autonomía conocimiento

Ambos agentes Daniel **deciden solos** cuándo persistir (sin pedir permiso):

1. `knowledge_sources` en Mongo (índice)
2. `pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json` si la fuente es estable
3. `chroma_doc` con texto enriquecido (colección semántica)

Consultar antes del veredicto:

```bash
node query.js --semantic-search "tema del debate"
node query.js --knowledge-sources --category design-patterns
```

## Cierre HITL (@iatl — autónomo)

Ver `close-ticket.js` + `retentionDays`.

### Learnings con traza (último bullet)

El **último** learning del cierre puede incluir análisis trazado — cómo llegamos, supuesto inicial vs hallazgo real, regla operativa. Se persiste en `ticket_closures.resumeContext` y en `learnings` con `isResumeTrace: true`.

```json
"learnings": [
  "bullet técnico corto",
  {
    "text": "resumen operativo",
    "trace": {
      "title": "...",
      "howWeGotHere": ["paso 1", "paso 2"],
      "initialAssumption": "...",
      "actualFinding": "...",
      "operationalRule": "...",
      "useWhenResuming": "...",
      "evidence": {}
    }
  }
]
```

### Correcciones de Razonamiento HITL

El payload JSON soporta una lista `reasoningCorrections` para guardar retroalimentación de lógica:

```json
{
  "verdict": "closed_implementation",
  "summary": "...",
  "reasoningCorrections": [
    {
      "error": "Error de supuesto inicial sobre el flujo de dependencias en módulo X",
      "correction": "El HITL aclaró que X debe depender de Y e inyectarse vía DIP",
      "rule": "Inyectar Y en X a nivel de constructor, nunca instanciar directamente"
    }
  ]
}
```

Al procesarse, `close-ticket.js` las inserta en MongoDB (colección `learnings`, categoría `reasoning-correction`) y las añade al final de `review-learnings.md` bajo el encabezado `## Correcciones de Razonamiento HITL`.

```bash
node close-ticket.js --ticket PFI-XXXX --payload-file /tmp/closure.json
node query.js --ticket PFI-XXXX          # session_context.resume_context
node query.js --ticket-closure --ticket PFI-XXXX
```

**Al retomar sesión:** `query.js --ticket` → leer `session_context.resume_context` y las active learnings de tipo `reasoning-correction` **antes** de reconstruir desde el chat. Usar `trace` y `reasoning-correction` como contexto prioritario para nuevos análisis/QA.

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
