# PFI Agent Architecture

Documentación de la arquitectura de agentes IATL para **pfi-backend-core**.

> **Importante:** Esta carpeta es una **copia de referencia** en el repo. Los artefactos operativos viven en `~/.cursor/` del desarrollador. No mover ni duplicar la fuente de verdad desde aquí salvo para documentar o versionar decisiones de diseño.

## Qué estamos construyendo

Un sistema de agentes cooperativos y construcción autónoma para desarrollo spec-driven en PFI:

1. **@iatl** — orquestador principal; única interfaz con el desarrollador (César).
2. **@pfi-tl-peer-daniel-analisis** / **@pfi-tl-peer-daniel-implementacion** — par TL Daniel (análisis + implementación); debate Propuesta **antes** del gate HITL.
3. **@pfi-review-orchestrator** — pipeline post-código (CR analyst + Bugbot).
4. **Hub Mongo + Chroma local** — contexto operativo (Mongo) + recall semántico (Chroma v2.0).
5. **Construcción Autónoma de Habilidades (MCP):** Generador autónomo de servidores MCP (Model Context Protocol) estándar e independientes (ej. `mcp-landing-page/`) para desacoplar el entorno y potenciar el runtime del agente.
6. **Portal Gráfico de Instalación y Control:** Una SPA nativa basada en Node.js, SSE y estética *glassmorphic* para configurar el entorno y lanzar las compilaciones de forma visual.

Objetivo: que @iatl **aprenda y mejore** con cada ciclo (Mongo + skills + correcciones HITL), con barra TL pragmática y estándar IATL hexagonal.

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

**Versión doc actual:** [0.12.0](CHANGELOG.md#0120--2026-06-28)

## Resolución de tickets (MCP-first)

Al recibir un **número de historia** sin URL, el agente usa skill **`pfi-ticket-source-resolver`**:

1. Pregunta plataforma (Jira Pandora, ClickUp, etc.)
2. Si hay MCP configurado → descarga el issue **sin esperar link**
3. El link (`pandora.aduana.cl/jira/browse/PFI-XXXX`) sigue siendo válido

Ver [skills/pfi-ticket-source-resolver.md](skills/pfi-ticket-source-resolver.md).

## Capa de conocimiento (Mongo + Chroma v2.0)

- **Mongo** — hub operativo (tickets, ramas, cierres HITL): [mongo/](mongo/)
- **Chroma** — capa semántica implementada (búsqueda embeddable): [architecture/knowledge-layer-chroma.md](architecture/knowledge-layer-chroma.md) · [chroma/](chroma/)

## Instalación

Guía completa paso a paso: **[docs/INSTALL.md](docs/INSTALL.md)** (requisitos, CLI, GUI, manual, Docker, verificación, troubleshooting).

### Inicio rápido (Novedad: Portal GUI)

Puedes instalar y configurar el entorno de forma completamente visual con nuestro nuevo portal web interactivo (diseño *glassmorphic* y logs en tiempo real):

```bash
git clone https://github.com/cbbianco/agente-iatl.git pfi-agent-architecture
cd pfi-agent-architecture && npm install
npm run install:gui
```

O si prefieres la versión de consola interactiva tradicional:

```bash
npm run install:iatl
```

*Nota: Se recomienda tener Mongo local (`:27017`) o configurado en tu `config.json` antes de iniciar.*

Runtimes soportados: Cursor · VS Code · Claude Code · Antigravity · Docker — detalle en [docs/INSTALL.md](docs/INSTALL.md#2-instalación-recomendada--cli-portable).

## Agentes

| Agente | Rol |
|--------|-----|
| [@iatl](agents/iatl.md) | Orquestador, debate HITL, síntesis |
| [@pfi-tl-peer-daniel-analisis](agents/pfi-tl-peer-daniel-analisis.md) | Par TL análisis pre-HITL |
| [@pfi-tl-peer-daniel-implementacion](agents/pfi-tl-peer-daniel-implementacion.md) | Par TL implementación |
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

- [docs/INSTALL.md](docs/INSTALL.md) — **guía de instalación y publicación**
- [CHANGELOG.md](CHANGELOG.md) — historial de versiones
- [cli/](cli/) — scripts de consola (CLI) e interfaz gráfica (GUI)
- [mcp-landing-page/](mcp-landing-page/) — MCP autónomo generado para Landing Pages
- [architecture/](architecture/) — visión, pipeline, feedback loop
- [agents/](agents/) — definiciones agente (copia)
- [skills/](skills/) — catálogo skills
- [mongo/](mongo/) — esquema, colecciones, comandos
- [spec-driven/](spec-driven/) — flujo spec-driven
- [working-branches.md](working-branches.md) — espejo ramas Git activas
- [context/active-tickets.md](context/active-tickets.md) — snapshot tickets (PFI-1120 pausada; PFI-1215 activo)
- [docs/daily-branch-tracker.md](docs/daily-branch-tracker.md) — protocolo registro ramas
- [docs/agent-conflict-resolution.md](docs/agent-conflict-resolution.md) — resolución formal conflictos entre agentes
- [docs/peer-gate-deadlock-protocol.md](docs/peer-gate-deadlock-protocol.md) — desacuerdo @iatl ↔ Daniel
- [architecture/diagrams.md](architecture/diagrams.md) — componentes, secuencia, decisiones
- [architecture/ticket-classification.md](architecture/ticket-classification.md) — clasificación y fast path
- [architecture/quality-metrics.md](architecture/quality-metrics.md) — métricas de calidad
- [architecture/knowledge-layer-chroma.md](architecture/knowledge-layer-chroma.md) — Mongo vs Chroma
