# Daily Branch Tracker

Copia de referencia del skill `pfi-daily-branch-tracker` (`~/.cursor/skills/pfi-daily-branch-tracker/SKILL.md`).

## Propósito

César trabaja **varias ramas por ticket, día a día**. Los agentes IATL deben:

1. **Registrar** cada rama al crearla o hacer checkout.
2. **Actualizar** status al mergear o abandonar.
3. **Listar punto a punto** cuando el usuario pida *"listame las ramas que hemos trabajado"*.

## Persistencia dual

| Capa | Ubicación |
|------|-----------|
| Mongo | `iatl_knowledge.working_branches` |
| Repo | `pfi-agent-architecture/working-branches.md` |

## Campos

| Campo | Valores |
|-------|---------|
| `ticket` | PFI-XXXX |
| `branch` | nombre completo |
| `base` | develop, main, origin/qa, commit tip, etc. |
| `role` | feature, fix, conflict_develop, conflict_qa, hotfix |
| `status` | active, merged, abandoned, blocked |
| `notes` | una línea de contexto |

## Integración @iatl

En arranque de sesión con ticket:

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

Al proponer HITL con rama concreta → `ingest.js working_branch` + actualizar `working-branches.md`.

## Formato lista usuario

Numerada, activas primero, conflict como sub-bullets del ticket padre.

Ver ejemplo en [working-branches.md](../working-branches.md).
