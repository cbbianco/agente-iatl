# Skill — pfi-daily-branch-tracker (copia referencia)

Fuente operativa: `~/.cursor/skills/pfi-daily-branch-tracker/SKILL.md`

## Cuándo usar

1. Al crear o checkout de rama de trabajo.
2. Al cambiar de ticket en la sesión.
3. Al cerrar ticket (merge / abandonado).
4. Cuando el usuario pida listar ramas trabajadas.

## Persistencia

| Capa | Ubicación |
|------|-----------|
| Mongo | `iatl_knowledge.working_branches` |
| Espejo | `pfi-agent-architecture/working-branches.md` |

## Comandos clave

```bash
# Registrar
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX --branch "pfi-XXXX/fix/slug" --base develop \
  --role feature --status active --notes "contexto"

# Listar activas
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

`role`: feature | fix | conflict_develop | conflict_qa | hotfix  
`status`: active | merged | abandoned | blocked

## Reglas

- Una fila por rama lógica; conflict como sub-bullets del ticket.
- No borrar historial: marcar `merged` o `abandoned`.
- @iatl registra al proponer HITL con rama concreta.
- Tras ingest Mongo → actualizar `working-branches.md`.

Ver [docs/daily-branch-tracker.md](../docs/daily-branch-tracker.md).
