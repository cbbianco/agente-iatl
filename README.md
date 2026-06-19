# PFI Agent Architecture

Documentación de la arquitectura de agentes IATL para **pfi-backend-core**.

> **Importante:** Esta carpeta es una **copia de referencia** en el repo. Los artefactos operativos viven en `~/.cursor/` del desarrollador. No mover ni duplicar la fuente de verdad desde aquí salvo para documentar o versionar decisiones de diseño.

## Qué estamos construyendo

Un sistema de agentes cooperativos para desarrollo spec-driven en PFI:

1. **@iatl** — orquestador principal; única interfaz con el desarrollador (César).
2. **@pfi-tl-peer-daniel** — par revisor con perfil TL Daniel; debate toda Propuesta **antes** del gate HITL.
3. **@pfi-review-orchestrator** — pipeline post-código (CR analyst + Bugbot).
4. **Hub Mongo local** — contexto, learnings, fuentes de conocimiento, debates par TL, **ramas en trabajo**.

Objetivo: que @iatl **aprenda y mejore** con cada ciclo (Mongo + skills), con barra TL pragmática y estándar IATL hexagonal.

## Mapa de ubicaciones

| Artefacto | Ubicación operativa | Copia doc en este repo |
|-----------|---------------------|-------------------------|
| Agentes | `~/.cursor/agents/` | [agents/](agents/) |
| Skills | `~/.cursor/skills/` | [skills/](skills/) |
| Hub Mongo | `~/.cursor/iatl-knowledge/` | [mongo/](mongo/) |
| Spec-driven docs | `docs/spec-driven/` (repo) | [spec-driven/](spec-driven/) |

## Pipeline resumido

```text
Ticket → @iatl arranque (Mongo ticket + working_branches + active-tickets)
      → @iatl elabora Propuesta
      → @pfi-tl-peer-daniel (debate + knowledge_sources + web)
      → [deadlock?] síntesis C → una recomendación HITL
      → @iatl ajusta → usuario aprueba (HITL)
      → implementación
      → @pfi-review-orchestrator → CR + Bugbot
      → @iatl síntesis → Mongo learnings
      → cierre HITL autónomo (close-ticket.js + retentionDays)
      → commit (solo si usuario pide)
```

Ver [architecture/pipeline.md](architecture/pipeline.md).

## Instalación hub Mongo (una vez)

```bash
cd ~/.cursor/iatl-knowledge
npm install
npm run init
npm run seed-sources
```

Requisito: MongoDB local `127.0.0.1:27017`.

## Agentes

| Agente | Rol |
|--------|-----|
| [@iatl](agents/iatl.md) | Orquestador, debate HITL, síntesis |
| [@pfi-tl-peer-daniel](agents/pfi-tl-peer-daniel.md) | Par TL pre-HITL |
| [@pfi-review-orchestrator](agents/pfi-review-orchestrator.md) | Review post-código |
| [@pfi-cr-analyst](agents/pfi-cr-analyst.md) | Code review Claude |
| [@pfi-patterns-advisor](agents/pfi-patterns-advisor.md) | Patrones (foco explícito) |

## Fuentes de conocimiento (par TL)

Cuatro categorías canónicas en Mongo `knowledge_sources`:

| Categoría | Fuente seed |
|-----------|-------------|
| design-patterns | [Refactoring.Guru](https://refactoring.guru/design-patterns) |
| nodejs | [Node.js Guides](https://nodejs.org/en/docs/guides/) |
| rest-api | [Microsoft REST API Design](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) |
| aws | [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) |

Ver [mongo/knowledge-sources.md](mongo/knowledge-sources.md).

## Retroalimentación @iatl

| Colección Mongo | Qué aporta |
|-----------------|------------|
| `peer_discussions` | Historial debates par TL |
| `learnings` (`source: pfi-tl-peer-daniel`) | Bullets tl-peer |
| `review_findings` | Hallazgos CR |
| `pattern_evals` | Evaluaciones GoF |

@iatl consulta al arrancar: `query.js --ticket`, `--peer-discussions`, `--active-learnings`.

## Mantenimiento

- **Poda semanal:** `prune.js` + sync `review-learnings.md`
- **Promoción reglas estables:** `reference.md` §2.6
- **Añadir fuente URL:** `ingest.js knowledge_source` o editar seed + `npm run seed-sources`

## Índice

- [architecture/](architecture/) — visión, pipeline, feedback loop
- [agents/](agents/) — definiciones agente (copia)
- [skills/](skills/) — catálogo skills
- [mongo/](mongo/) — esquema, colecciones, comandos
- [spec-driven/](spec-driven/) — flujo spec-driven
- [working-branches.md](working-branches.md) — espejo ramas Git activas
- [context/active-tickets.md](context/active-tickets.md) — snapshot tickets en curso (PFI-1238, 1228, 1039)
- [docs/daily-branch-tracker.md](docs/daily-branch-tracker.md) — protocolo registro ramas
- [docs/peer-gate-deadlock-protocol.md](docs/peer-gate-deadlock-protocol.md) — desacuerdo @iatl ↔ Daniel
