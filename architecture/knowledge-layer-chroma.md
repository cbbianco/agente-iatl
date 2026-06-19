# Capa de conocimiento — Mongo vs Chroma

**Fecha:** 2026-06-19 · **Estado:** análisis arquitectónico (sin implementar)

## Contexto actual (IATL)

```text
┌─────────────────────────────────────────────────────────┐
│  @iatl / agentes hijos                                   │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  Mongo iatl_knowledge   reference.md      Skills ~/.cursor/
  (consultas exactas)    (reglas estables)  (contratos)
        │
        ├── sessions, working_branches
        ├── ticket_closures, learnings
        ├── peer_discussions, review_findings
        └── knowledge_sources (URLs indexadas)
```

**Fortalezas Mongo hoy**

- Consultas por ticket, sprint, status — determinísticas
- Cierre HITL, retención `retentionDays`, poda
- Bajo volumen (~decenas de learnings activos) — suficiente

**Limitación**

- No hay búsqueda semántica: *"¿algún ticket resolvió pool Postgres intermitente?"*
- Spec-driven y CR `.md` viven en repo local/gitignored — no indexados para recall

## ¿Dónde encaja Chroma?

[Chroma](https://www.trychroma.com/) es una base **vectorial** para embeddings + similitud semántica.

**No reemplaza Mongo.** Son capas complementarias:

| Dimensión | Mongo (mantener) | Chroma (añadir opcional) |
|-----------|------------------|---------------------------|
| Ticket activo / ramas | ✅ Fuente de verdad | ❌ |
| Cierre sprint / expiresAt | ✅ | ❌ |
| Debates par TL estructurados | ✅ | ⚠️ Solo si queremos buscar por tema |
| Recall por similitud | ❌ | ✅ |
| Spec-driven / CR históricos | ❌ (solo path) | ✅ Indexar texto |
| Patrones antipatrones | Parcial (bullets) | ✅ Búsqueda fuzzy |

## Recomendación IATL

### Veredicto: **Sí, pero como capa 2 — no como hub principal**

```text
                    @iatl
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   Mongo (operacional)      Chroma (semántico)
   ticket, ramas, cierre    learnings archive
                            spec-driven .md
                            CODE-REVIEW .md
                            incidentes postmortem
```

### Fase 1 (bajo riesgo)

- Persistencia local: `~/.cursor/iatl-knowledge/chroma/` (mismo patrón que Mongo local)
- Indexar al **ingestar** o al **cerrar ticket**:
  - Texto de `ticket_closures.summary`
  - Learnings archivados (`learnings_archive`)
  - Copias opcionales de `docs/spec-driven/PFI-*.md` (fuera del repo git)
- Tool CLI: `query-chroma.js --semantic "pool postgres promise.all"`
- @iatl consulta Chroma **después** de `query.js --ticket` cuando el tema es exploratorio

### Fase 2 (opcional)

- Embeddings de código: `lambda-documento` draft, guards, patrones legacy
- Integración con `@pfi-patterns-advisor` para recall de evaluaciones GoF

### No hacer (ahora)

- Migrar `working_branches` o `sessions` a Chroma
- Reemplazar `close-ticket.js` / `ingest.js` por solo vectores
- Chroma en CI/CD del backend PFI — es herramienta **de agente**, no de runtime lambda

## Coste / complejidad

| Item | Impacto |
|------|---------|
| Dual write (Mongo + Chroma) | Medio — hook en `ingest.js` / `close-ticket.js` |
| Modelo embeddings | API OpenAI / local `nomic-embed` — decisión de privacidad Aduana |
| Drift índice vs Mongo | Poda Chroma alineada a `prune.js` |
| Valor con <50 learnings | Bajo hoy; crece con historial multi-sprint |

## Alternativas consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| Solo Mongo + más learnings | Simple | Sin similitud |
| Mongo Atlas Vector Search | Un solo DB | Requiere Atlas; hoy es Mongo local |
| Archivos + grep en spec-driven | Cero infra | No semántico |
| **Chroma local** | Ligero, Python/TS, filesystem | Otro componente que operar |

## Decisión propuesta (HITL)

1. **Mantener Mongo** como hub operativo (sin cambios).
2. **Pilotar Chroma** en `iatl-knowledge` para recall semántico de cierres y CR.
3. Criterio de éxito del piloto: @iatl resuelve en <2 consultas un incidente similar a PFI-1131 (pool PG) sin que el usuario recuerde el ticket.

## Siguiente paso si apruebas

- `chroma/` + `ingest-chroma.js` en `~/.cursor/iatl-knowledge/`
- Documentar en `mongo/README.md` § Capa semántica
- Skill `pfi-iatl-knowledge-hub` — consulta opcional `--semantic`
