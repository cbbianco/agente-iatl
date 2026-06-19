# Skill — pfi-ticket-source-resolver (copia referencia)

Fuente operativa: `~/.cursor/skills/pfi-ticket-source-resolver/SKILL.md`

## Propósito

Cuando el usuario pasa un **número de historia** sin URL:

1. Preguntar plataforma (Jira, ClickUp, etc.)
2. Detectar MCP disponible
3. **Descargar directo** si hay MCP — sin esperar link
4. El **link sigue funcionando** como hasta ahora

## Registro MCP PFI (2026-06)

| Plataforma | MCP server | Tool |
|------------|------------|------|
| Jira Pandora PFI | `user-jira-pandora-pfi` | `jira_get_issue`, `jira_search`, `jira_ping` |
| Atlassian Cloud | `plugin-atlassian-atlassian` | Ver mcps del workspace |
| ClickUp | — | Sin MCP — link manual |

## Quién lo usa

- **@iatl** — arranque sesión spec-driven
- Cualquier agente IATL al recibir `PFI-XXXX` o *"la 1215"*

Ver skill completa en `~/.cursor/skills/pfi-ticket-source-resolver/SKILL.md`.
