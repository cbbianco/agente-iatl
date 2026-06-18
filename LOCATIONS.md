# Ubicaciones — fuente operativa vs copia repo

| Tipo | Operativo (editar aquí) | Copia documentación (repo) |
|------|-------------------------|----------------------------|
| Agente @iatl | `~/.cursor/agents/iatl.md` | `pfi-agent-architecture/agents/iatl.md` |
| Agente par TL | `~/.cursor/agents/pfi-tl-peer-daniel.md` | `pfi-agent-architecture/agents/pfi-tl-peer-daniel.md` |
| Skill par TL | `~/.cursor/skills/pfi-tl-peer-daniel/` | Ver `skills/catalog.md` |
| Hub Mongo scripts | `~/.cursor/iatl-knowledge/` | `pfi-agent-architecture/mongo/` |
| Seed URLs | `~/.cursor/skills/pfi-tl-peer-daniel/knowledge-sources.seed.json` | `pfi-agent-architecture/mongo/knowledge-sources.seed.json` |
| Profile stack | `~/.cursor/skills/pfi-iatl-developer-profile/` | — |
| Specs ticket | `docs/spec-driven/` (repo) | `pfi-agent-architecture/spec-driven/workflow.md` |

**Regla:** cambios operativos en `~/.cursor/`; actualizar copia en repo cuando cambie la arquitectura de agentes.
