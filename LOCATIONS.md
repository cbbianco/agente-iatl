# Ubicaciones — fuente operativa vs copia repo

| Tipo | Operativo (editar aquí) | Copia documentación (repo) |
|------|-------------------------|----------------------------|
| Agente @iatl | `~/.cursor/agents/iatl.md` | `pfi-agent-architecture/agents/iatl.md` |
| Agente par TL | `~/.cursor/agents/pfi-tl-peer-daniel.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel.md` |
| Skill par TL | `~/.cursor/skills/pfi-tl-peer-daniel/` | Ver `skills/catalog.md` |
| Hub Mongo + Chroma scripts | `~/.cursor/iatl-knowledge/` | `pfi-agent-architecture/mongo/scripts/` |
| Chroma data (local) | `~/.cursor/iatl-knowledge/chroma-data/` | `pfi-agent-architecture/chroma/README.md` |
| Setup agente | `~/.cursor/iatl-knowledge/setup-agent.js` | `pfi-agent-architecture/mongo/scripts/setup-agent.js` |
| Migración Chroma | `~/.cursor/iatl-knowledge/migrate-to-chroma.js` | `pfi-agent-architecture/mongo/scripts/migrate-to-chroma.js` |
| Config sprint | `~/.cursor/iatl-knowledge/config.json` | `pfi-agent-architecture/mongo/config.example.json` |
| Cierre HITL | `~/.cursor/iatl-knowledge/close-ticket.js` | `pfi-agent-architecture/mongo/scripts/close-ticket.js` |
| Skill knowledge hub | `~/.cursor/skills/pfi-iatl-knowledge-hub/` | `pfi-agent-architecture/skills/pfi-iatl-knowledge-hub.md` |
| Seed URLs | `~/.cursor/skills/pfi-tl-peer-daniel/knowledge-sources.seed.json` | `pfi-agent-architecture/mongo/knowledge-sources.seed.json` |
| Profile stack | `~/.cursor/skills/pfi-iatl-developer-profile/` | — |
| Specs ticket | `docs/spec-driven/` (repo pfi-backend-core) | `pfi-agent-architecture/spec-driven/workflow.md` |
| Skill daily branches | `~/.cursor/skills/pfi-daily-branch-tracker/` | `pfi-agent-architecture/skills/pfi-daily-branch-tracker.md` |
| **Skill ticket resolver** | `~/.cursor/skills/pfi-ticket-source-resolver/` | `pfi-agent-architecture/skills/pfi-ticket-source-resolver.md` |
| Capa Chroma (implementada) | `~/.cursor/iatl-knowledge/lib/chroma.js` | `pfi-agent-architecture/architecture/knowledge-layer-chroma.md` |
| Espejo ramas | Mongo `working_branches` | `pfi-agent-architecture/working-branches.md` |
| Snapshot tickets | — | `pfi-agent-architecture/context/active-tickets.md` |
| Peer gate deadlock | `~/.cursor/skills/pfi-tl-peer-daniel/SKILL.md` § Desacuerdo | `pfi-agent-architecture/docs/peer-gate-deadlock-protocol.md` |

**Regla:** cambios operativos en `~/.cursor/`; actualizar copia en repo cuando cambie la arquitectura de agentes o el contexto de tickets activos.
