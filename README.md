# PFI Agent Architecture

Documentación de la arquitectura de agentes IATL para **pfi-backend-core**.

> **Importante:** Esta carpeta es una **copia de referencia** en el repo. Los artefactos operativos se instalan en el directorio del **runtime activo** (`~/.antigravity/`, `~/.cursor/`, etc.) según el instalador. No mover ni duplicar la fuente de verdad desde aquí salvo para documentar o versionar decisiones de diseño.

## ¿Qué es IATL? (Inteligencia Artificial In the Loop)

**IATL (Inteligencia Artificial In the Loop)** no es simplemente otro chatbot o copiloto interactivo de programación. Es un **paradigma de Ingeniería de Software colaborativo basado en el concepto de "Inteligencia Artificial In the Loop" (IAIL)**.

A diferencia del enfoque tradicional de *Human-in-the-Loop* (donde la IA maneja el desarrollo y el humano solo valida de forma pasiva), en IATL **el desarrollador humano es el eje central y conductor creativo**, mientras que una red jerárquica de agentes especializados de IA se integra de forma activa en el flujo de trabajo en momentos clave (quality gates) para asegurar la excelencia del código, validar la arquitectura, evitar antipatrones y autogenerar herramientas complementarias.

### Componentes de la Arquitectura IAIL

1. **@iatl (Orquestador Principal)**: Tu único punto de contacto interactivo. Coordina la ejecución de cambios, recopila contexto y se adapta a tus directrices mediante un ciclo continuo de retroalimentación de razonamiento.
2. **@pfi-tl-peer-daniel (Gates de Calidad y Debate)**: Dividido en **@pfi-tl-peer-daniel-analisis** (fase pre-código) y **@pfi-tl-peer-daniel-implementacion** (fase post-código). Actúa como tu par revisor de arquitectura (basado en estándares DDD, hexagonal y testing) que debate la solución propuesta y tiene la autonomía de auto-expandir su base de conocimiento local consumiendo documentación confiable de internet.
3. **@pfi-review-orchestrator**: El orquestador que gestiona el pipeline de revisiones automáticas (Code Reviewer y Bugbot).
4. **Hub de Conocimiento Local (MongoDB + ChromaDB)**: Memoria operativa y semántica a largo plazo que retiene las decisiones de sprints anteriores y tus correcciones lógicas para mejorar la precisión del modelo en la siguiente sesión.
5. **Construcción Autónoma de Habilidades (MCP)**: Generador autónomo de herramientas independientes bajo el estándar Model Context Protocol (como el MCP de Landing Pages), permitiendo que el sistema expanda dinámicamente sus capacidades lógicas y de despliegue.
6. **Portal de Control Visual (Dashboard + GUI)** — Dashboard web (`npm run dashboard`) con métricas por proyecto, sesiones, construcción autónoma MCP y configuración HITL; GUI wizard en puerto 8020.

## Mapa de ubicaciones

| Artefacto | Ubicación operativa (según runtime) | Copia doc en este repo |
|-----------|-------------------------------------|-------------------------|
| Agentes | `~/.antigravity/agents/` o `~/.cursor/agents/` | [agents/](agents/) |
| Skills | `~/.antigravity/skills/` o `~/.cursor/skills/` | [skills/](skills/) |
| Hub Mongo | `~/.antigravity/iatl-knowledge/` o `~/.cursor/iatl-knowledge/` | [mongo/](mongo/) |
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

**Versión doc actual:** [0.13.3](CHANGELOG.md#0133--2026-06-29)

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

### Dashboard IATL (métricas y construcción)

```bash
npm run dashboard
# o forzar runtime Antigravity:
node cli/run-dashboard.mjs --runtime antigravity
```

Abre `http://127.0.0.1:8030` — pestañas: Overview, Sesiones, Conocimiento, Agentes (clic en tarjeta = explicación de métrica), **Construcción**, **Proyectos**. Configuración desde ⚙️ en sidebar.

> Si IATL **no está instalado** para el runtime indicado, el launcher muestra un mensaje en terminal y una página informativa en el navegador con el comando de instalación. No se usa el hub de otro IDE como sustituto.

### Inicio rápido (Portal GUI)

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
