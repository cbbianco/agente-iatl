# Ubicaciones — fuente operativa vs copia repo

| Tipo | Operativo (editar aquí) | Copia documentación (repo) |
|------|-------------------------|----------------------------|
| Agente @iatl | `~/.cursor/agents/iatl.md` | `pfi-agent-architecture/agents/iatl.md` |
| Agente par TL análisis | `~/.cursor/agents/pfi-tl-peer-daniel-analisis.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel-analisis.md` |
| Agente par TL implementación | `~/.cursor/agents/pfi-tl-peer-daniel-implementacion.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel-implementacion.md` |
| Alias par TL | `~/.cursor/agents/pfi-tl-peer-daniel.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel.md` |
| Skill par TL análisis | `~/.cursor/skills/pfi-tl-peer-daniel-analisis/` | `pfi-agent-architecture/skills/pfi-tl-peer-daniel-analisis/` |
| Skill par TL implementación | `~/.cursor/skills/pfi-tl-peer-daniel-implementacion/` | `pfi-agent-architecture/skills/pfi-tl-peer-daniel-implementacion/` |
| Hub Mongo + Chroma scripts | `~/.cursor/iatl-knowledge/` | `pfi-agent-architecture/mongo/scripts/` |
| Chroma data (local) | `~/.cursor/iatl-knowledge/chroma-data/` | `pfi-agent-architecture/chroma/README.md` |
| Setup agente | `~/.cursor/iatl-knowledge/setup-agent.js` | `pfi-agent-architecture/mongo/scripts/setup-agent.js` |
| **CLI instalador portable** | `npm run install:iatl` (desde repo) | `pfi-agent-architecture/cli/iatl-install.mjs` |
| **Guía instalación** | — | `pfi-agent-architecture/docs/INSTALL.md` |
| **Docker stack** | `<proyecto>/.iatl-docker/` | `pfi-agent-architecture/docker/` |
| Clasificación tickets | `query.js --classify-ticket` | `architecture/ticket-classification.md` |
| Métricas calidad | `ingest.js ticket_metric` | `architecture/quality-metrics.md` |
| Conflictos agentes | — | `docs/agent-conflict-resolution.md` |
| Migración Chroma | `~/.cursor/iatl-knowledge/migrate-to-chroma.js` | `pfi-agent-architecture/mongo/scripts/migrate-to-chroma.js` |
| Config sprint | `~/.cursor/iatl-knowledge/config.json` | `pfi-agent-architecture/mongo/config.example.json` |
| Cierre HITL | `~/.cursor/iatl-knowledge/close-ticket.js` | `pfi-agent-architecture/mongo/scripts/close-ticket.js` |
| Learning trace (resume) | `~/.cursor/iatl-knowledge/lib/learning-trace.js` | `pfi-agent-architecture/mongo/scripts/lib/learning-trace.js` |
| Doc learning trace | — | `pfi-agent-architecture/architecture/learning-trace-resume.md` |
| Skill knowledge hub | `~/.cursor/skills/pfi-iatl-knowledge-hub/` | `pfi-agent-architecture/skills/pfi-iatl-knowledge-hub.md` |
| Seed URLs | `~/.cursor/skills/pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json` | `pfi-agent-architecture/mongo/knowledge-sources.seed.json` |
| Profile stack | `~/.cursor/skills/pfi-iatl-developer-profile/` | `pfi-agent-architecture/skills/pfi-iatl-developer-profile/` |
| Specs ticket | `docs/spec-driven/` (repo pfi-backend-core) | `pfi-agent-architecture/spec-driven/workflow.md` |
| Skill daily branches | `~/.cursor/skills/pfi-daily-branch-tracker/` | `pfi-agent-architecture/skills/pfi-daily-branch-tracker.md` |
| **Skill ticket resolver** | `~/.cursor/skills/pfi-ticket-source-resolver/` | `pfi-agent-architecture/skills/pfi-ticket-source-resolver.md` |
| Capa Chroma (implementada) | `~/.cursor/iatl-knowledge/lib/chroma.js` | `pfi-agent-architecture/architecture/knowledge-layer-chroma.md` |
| Espejo ramas | Mongo `working_branches` | `pfi-agent-architecture/working-branches.md` |
| Snapshot tickets | — | `pfi-agent-architecture/context/active-tickets.md` |
| Peer gate deadlock | `~/.cursor/skills/pfi-tl-peer-daniel-analisis/SKILL.md` § Desacuerdo | `pfi-agent-architecture/docs/peer-gate-deadlock-protocol.md` |
| **Conflictos agentes (todos)** | — | `pfi-agent-architecture/docs/agent-conflict-resolution.md` |

**Regla:** cambios operativos en `~/.cursor/`; actualizar copia en repo cuando cambie la arquitectura de agentes o el contexto de tickets activos.
