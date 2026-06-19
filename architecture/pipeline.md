# Pipeline — Flujos de agentes

## 1. Spec-driven (flujo principal)

```text
┌─────────────┐
│ Ticket Jira │
└──────┬──────┘
       ▼
┌──────────────────────────────────────┐
│ @iatl: arranque                      │
│  - profile-stack                      │
│  - query.js --ticket                  │
│  - query.js --ticket-closure          │
│  - query.js --working-branches        │
│  - query.js --peer-discussions        │
│  - context/active-tickets.md          │
│  - ingest session                     │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ @iatl: elaborar Propuesta IATL       │
│  Propuesta / A favor / En contra /    │
│  Alternativas / Recomendación         │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ @pfi-tl-peer-daniel (OBLIGATORIO)    │
│  - query --knowledge-sources          │
│  - WebFetch fuentes por categoría     │
│  - anti-patterns-carlos               │
│  - emitir veredicto                   │
│  - ingest peer_discussion + learning  │
└──────┬───────────────────────────────┘
       │
       ├── RECHAZADO ──► @iatl rediseña ──► (volver arriba)
       │
       ├── APTO_CON_CAMBIOS ──► @iatl ajusta Propuesta
       │
       ├── Desacuerdo @iatl ↔ Daniel ──► síntesis C → una Propuesta HITL
       │   (ver docs/peer-gate-deadlock-protocol.md)
       │
       └── APTO_PROPUESTA ──► continuar
       ▼
┌──────────────────────────────────────┐
│ Usuario: Tu decisión (HITL)          │
└──────┬───────────────────────────────┘
       ▼ OK
┌──────────────────────────────────────┐
│ Implementación (estándar IATL)       │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ @pfi-review-orchestrator             │
│  → @pfi-cr-analyst + Bugbot           │
└──────┬───────────────────────────────┘
       ▼
┌──────────────────────────────────────┐
│ @iatl: síntesis + Mongo learnings   │
└──────┬───────────────────────────────┘
       ▼
   commit/push (solo si usuario pide)
       ▼
┌──────────────────────────────────────┐
│ Cierre HITL ticket (autónomo)        │
│  - config.json (project/sprint/14d) │
│  - close-ticket.js + learnings       │
│  - working_branches → merged         │
│  - query --ticket-closure            │
└──────┬───────────────────────────────┘
       ▼
   Ticket siguiente → ingest session + working_branch active
```

## 2. Foco patrones (opcional)

Si el usuario marca foco patrones en sesión:

```text
@iatl → @pfi-patterns-advisor (pattern-sources.json + web)
      → informe → debate con @pfi-tl-peer-daniel si hay Propuesta
```

## 3. Review PR (sin Propuesta nueva)

```text
@iatl → @pfi-review-orchestrator → CR + Bugbot → síntesis
```

No invoca par TL salvo que @iatl elabore **nueva** Propuesta de refactor.

## Veredictos par TL

| Veredicto | Acción @iatl |
|-----------|--------------|
| APTO_PROPUESTA | Presentar al usuario |
| APTO_CON_CAMBIOS | Ajustar y presentar con cambios marcados |
| RECHAZADO | No presentar; rediseñar internamente |
