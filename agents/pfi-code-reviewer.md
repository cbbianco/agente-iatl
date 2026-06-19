---
name: pfi-code-reviewer
description: >-
  ALIAS LEGACY → usar @pfi-review-orchestrator. Orquestador de code review para
  pfi-backend-core. Invoca automáticamente @pfi-cr-analyst + Bugbot. Mantenido
  por compatibilidad con invocaciones @pfi-code-reviewer existentes.
---

# Alias — @pfi-code-reviewer

**Este agente fue centralizado.** Ejecuta el mismo rol que **@pfi-review-orchestrator**.

## Redirección

Lee y opera según:

**`~/.cursor/agents/pfi-review-orchestrator.md`**

## Cadena actual

```text
@iatl
  → @pfi-review-orchestrator (este alias)
      → @pfi-cr-analyst (análisis exhaustivo — code-review Claude MANDATORIO)
      → Bugbot (paralelo, mismo diff)
  → @iatl absorbe paquete + Mongo hub → usuario
```

## Análisis profundo

Ya **no** lo hace este agente/orquestador. Lo ejecuta **@pfi-cr-analyst**.

## Patrones

**@pfi-patterns-advisor** — solo @iatl, cuando el usuario marca foco patrones en la sesión.

## Hub

Skill `pfi-iatl-knowledge-hub` — Mongo local `~/.cursor/iatl-knowledge/`.
