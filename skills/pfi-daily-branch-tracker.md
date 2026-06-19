---
name: pfi-daily-branch-tracker
description: >-
  Registro diario de ramas Git con las que trabaja César en pfi-backend-core.
  Persiste en Mongo (working_branches) y espejo en repo pfi-agent-architecture.
  Usar al iniciar/cambiar ticket, al crear rama, al mergear/cerrar, y cuando el
  usuario pida "listame las ramas que hemos trabajado".
---

# PFI — Registro diario de ramas

## Cuándo usar (obligatorio para @iatl y agentes IATL)

1. **Al crear o checkout de rama** de trabajo (feature/fix/conflict).
2. **Al cambiar de ticket** en la sesión.
3. **Al cerrar ticket** (merge, abandonado) — actualizar `status`.
4. Cuando el usuario diga: *"listame las ramas"*, *"ramas del día"*, *"qué ramas llevamos"*.
5. **Cuando el usuario cierre ticket HITL** (*"cerremos la XXXX"*) → delegar en skill **`pfi-iatl-knowledge-hub`** § Cierre HITL (`close-ticket.js`).

## Cierre HITL (autónomo)

Ver **`pfi-iatl-knowledge-hub/SKILL.md`** § Cierre HITL. Resumen:

- Persistir resumen + 3 learnings + ramas `merged` en Mongo.
- Retención parametrizable por sprint (`retentionDays`, default 14).
- Consultar cierre previo: `query.js --ticket-closure --ticket PFI-XXXX`.

## Persistencia

| Capa | Ubicación |
|------|-----------|
| **Mongo (fuente operativa)** | `iatl_knowledge.working_branches` |
| **Espejo repo (legible)** | `pfi-agent-architecture/working-branches.md` |

## Comandos

### Registrar / actualizar rama

```bash
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX \
  --branch "pfi-XXXX/fix/slug" \
  --base "develop" \
  --role "feature" \
  --status "active" \
  --notes "Fix POST personas paridad legacy Joi"
```

`role`: `feature` | `fix` | `conflict_develop` | `conflict_qa` | `hotfix`  
`status`: `active` | `merged` | `abandoned` | `blocked`

### Listar ramas activas (punto a punto)

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches
node ~/.cursor/iatl-knowledge/query.js --working-branches --ticket PFI-1228
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

### Sincronizar espejo al repo

Tras registrar en Mongo, **actualizar** `pfi-agent-architecture/working-branches.md` con la lista activa (formato numerado).

## Formato de respuesta al usuario ("listame las ramas")

Siempre **punto a punto**, orden: activas primero, luego recientes mergeadas:

```markdown
## Ramas en trabajo — YYYY-MM-DD

1. **PFI-1228** · `pfi-1228/fix/post-persona-paridad-legacy` · base `2f949755` (PFI-1163) · **active**
2. **PFI-1039** · `pfi-1039/fix/traza-denuncia-decare-fecha-chile` · base `develop` · **active**
3. **PFI-1238** · `pfi-1238/feature/crear-marcaje-manual` · base `main` · **active**
   - conflict develop: `conflict_resolutions/develop/pfi-1238/feature/crear-marcaje-manual`
   - conflict qa: `conflict_resolutions/qa/pfi-1238/feature/crear-marcaje-manual`
```

Incluir por ítem: ticket, rama, base, status, nota de una línea si aplica.

## Reglas

- Una fila por rama lógica; ramas conflict asociadas como sub-bullets del ticket.
- No borrar historial: marcar `merged` o `abandoned`.
- @iatl registra al proponer HITL con rama concreta.
- Español en notas.
