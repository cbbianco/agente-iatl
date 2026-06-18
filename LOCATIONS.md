# Ubicaciones — fuente operativa vs copia repo

| Tipo | Operativo (editar aquí) | Copia documentación (repo) |
|------|-------------------------|----------------------------|
| Agente @iatl | `~/.cursor/agents/iatl.md` | `pfi-agent-architecture/agents/iatl.md` |
| Agente par TL | `~/.cursor/agents/pfi-tl-peer-daniel.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel.md` |
| Skill par TL | `~/.cursor/skills/pfi-tl-peer-daniel/` | Ver `skills/catalog.md` |
| Hub Mongo scripts | `~/.cursor/iatl-knowledge/` | `pfi-agent-architecture/mongo/` |
| Seed URLs | `~/.cursor/skills/pfi-tl-peer-daniel/knowledge-sources.seed.json` | `pfi-agent-architecture/mongo/knowledge-sources.seed.json` |
| Profile stack | `~/.cursor/skills/pfi-iatl-developer-profile/` | — |
| Specs ticket | `docs/spec-driven/` (repo pfi-backend-core) | `pfi-agent-architecture/spec-driven/workflow.md` |
| Skill daily branches | `~/.cursor/skills/pfi-daily-branch-tracker/` | `pfi-agent-architecture/skills/pfi-daily-branch-tracker.md` |
| Espejo ramas | Mongo `working_branches` | `pfi-agent-architecture/working-branches.md` |
| Snapshot tickets | — | `pfi-agent-architecture/context/active-tickets.md` |
| Peer gate deadlock | `~/.cursor/skills/pfi-tl-peer-daniel/SKILL.md` § Desacuerdo | `pfi-agent-architecture/docs/peer-gate-deadlock-protocol.md` |

**Regla:** cambios operativos en `~/.cursor/`; actualizar copia en repo cuando cambie la arquitectura de agentes o el contexto de tickets activos.
