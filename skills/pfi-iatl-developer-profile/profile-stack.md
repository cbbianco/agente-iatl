# Profile stack — fuente única de perfil ( @iatl + agentes hijos )

**Alcance:** solo `~/.cursor/` del desarrollador/equipo. No va al repo.

Todos los agentes IATL **leen este stack en el mismo orden** antes de operar.

## Orden de lectura (obligatorio, idéntico)

| # | Archivo | Rol |
|---|---------|-----|
| 0 | skill `pfi-ticket-source-resolver` | Si hay número/URL de historia — MCP-first |
| 0b | skill `pfi-iatl-knowledge-hub` | Mongo local — contexto activo del ticket |
| 1 | `reference.md` | **Spec completo** — contrato técnico estable |
| 2 | `skills-catalog.md` | Índice de skills, agentes y MCP |
| 3 | `review-learnings.md` | Memoria viva — vista humana (sync con Mongo) |
| 4 | `SKILL.md` | **Síntesis ejecutiva** — puntero al spec |

Después del stack, cada agente carga skills de tarea:

| Agente | Skills adicionales |
|--------|-------------------|
| **@iatl** | Según catálogo; siempre knowledge-hub |
| **@pfi-tl-peer-daniel-analisis** | pfi-tl-peer-daniel-analisis + knowledge_sources Mongo + anti-patterns-carlos; **modo B** recibe 2 `.md` post CR |
| **@pfi-tl-peer-daniel-implementacion** | pfi-tl-peer-daniel-implementacion + reference/anti-patterns compartidos; **modos C+D** plan y código |
| **@pfi-review-orchestrator** | pfi-pr-code-review o pfi-spec-driven-code-review; validar artefactos `docs/spec-driven/` |
| **@pfi-cr-analyst** | **code-review (Claude) MANDATORIO** → pfi-spec-driven / pfi-pr → pfi-qa-api-curls; **escribe 2 `.md`** |
| **@pfi-patterns-advisor** | pattern-sources.json + reference §2.3 + pfi-pr-code-review § GoF |

## Jerarquía de agentes

```text
Usuario ↔ @iatl (orquestación + modos debate/implementación/operación)
@iatl → @pfi-tl-peer-daniel-analisis (A: Propuesta pre-HITL — obligatorio en Full)
      → @pfi-tl-peer-daniel-implementacion (C: plan + D: código — obligatorio salvo fast)
@iatl → @pfi-review-orchestrator → @pfi-cr-analyst (2 .md) + Bugbot
      → @pfi-tl-peer-daniel-analisis (B: post CR — par arquitectura) → @iatl síntesis
@iatl → @pfi-patterns-advisor (solo foco patrones en sesión)
Hub Mongo ← sesiones multi-ticket, triage cerrados, working_branches
```

**Triage review externo (sin subagente dedicado):** @iatl contrasta en repo → tabla §3.2 `reference.md` → HITL → implementación opcional.

**Entregables CR (repo):** `docs/spec-driven/CODE-REVIEW-PFI-XXXX.md` + `ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md`

`@pfi-code-reviewer` = alias de `@pfi-review-orchestrator`.

## Hub central (Mongo)

- **Índice:** `~/.cursor/iatl-knowledge/` — `iatl_knowledge` DB
- **Fuentes TL par:** `knowledge_sources` (Mongo) + `pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json`
- **Debate pre-HITL:** `peer_discussions` (Mongo)
- **Fuentes patrones:** `pattern-sources.json` (extensible)
- **Promoción:** poda → `reference.md` §2.6
- **Vista humana:** `review-learnings.md`

## Reglas anti-drift

- **Contexto activo** (tickets, ramas): Mongo `sessions` + `reference.md` § final
- **Nueva regla estable:** mergear a `reference.md`
- **Lección de sesión:** Mongo `learnings` + sync `review-learnings.md`
- **Poda semanal:** `prune.js` + protocolo `review-learnings.md` § Mantenimiento

## Jerarquía de verdad

```text
Mongo (índice consultable por agentes)
reference.md          → reglas estables (prioridad alta)
review-learnings.md   → memoria viva export (prioridad media)
SKILL.md              → índice (prioridad baja)
```
