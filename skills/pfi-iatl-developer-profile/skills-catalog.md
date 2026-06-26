# Catálogo de skills — agente IATL

Actualizar al añadir skills en `~/.cursor/skills/`.

## Skills personales PFI (`~/.cursor/skills/`)

| ID | Ruta | Cuándo usar |
|----|------|-------------|
| **pfi-tl-peer-daniel-analisis** | `pfi-tl-peer-daniel-analisis/SKILL.md` | Par TL Daniel análisis — pre-HITL (modo A) + post CR 2 .md (modo B) |
| **pfi-tl-peer-daniel-implementacion** | `pfi-tl-peer-daniel-implementacion/SKILL.md` | Par TL Daniel implementación — plan pre-código (C) + check código (D) |
| **pfi-tl-peer-daniel** | `pfi-tl-peer-daniel/SKILL.md` | **Alias** → daniel-análisis |
| **pfi-iatl-knowledge-hub** | `pfi-iatl-knowledge-hub/SKILL.md` | **Hub Mongo** — contexto, learnings, poda; @iatl al arrancar |
| **pfi-iatl-developer-profile** | `pfi-iatl-developer-profile/SKILL.md` | Síntesis perfil. Stack: `profile-stack.md` → `reference.md` |
| **legacy-migration** | `legacy-migration/SKILL.md` | Migración legacy → NestJS en lambda-casos |
| **pfi-ticket-source-resolver** | `pfi-ticket-source-resolver/SKILL.md` | **Número de historia sin URL** — pregunta plataforma, MCP-first fetch |
| **pfi-jira-pandora-aduana** | `pfi-jira-pandora-aduana/SKILL.md` | Jira Pandora PFI — detalle MCP (usar vía ticket-source-resolver) |
| **pfi-commit-message-format** | `pfi-commit-message-format/SKILL.md` | Commits Markdown (prefijo + bullets + ## Cómo probar opcional); sin Co-authored-by |
| **pfi-git-branch-format** | `pfi-git-branch-format/SKILL.md` | Ramas PFI / conflict_resolutions |
| **pfi-daily-branch-tracker** | `pfi-daily-branch-tracker/SKILL.md` | Registro diario ramas Git; listar "ramas que hemos trabajado" |
| **pfi-qa-api-curls** | `pfi-qa-api-curls/SKILL.md` | Curls HTTP, headers, casos QA API |
| **pfi-pr-code-review** | `pfi-pr-code-review/SKILL.md` | Review PR: alcance, GoF, paginación, DRY |
| **code-review** | `code-review/SKILL.md` | **MANDATORIO** en @pfi-cr-analyst — Claude checklist |
| **pfi-spec-driven-code-review** | `pfi-spec-driven-code-review/SKILL.md` | Gate post spec-driven — vía orquestador + CR analyst |

## Agentes (`~/.cursor/agents/`)

| ID | Ruta | Cuándo usar |
|----|------|-------------|
| **@iatl** | `iatl.md` | Orquestador principal; única interfaz con usuario |
| **@pfi-tl-peer-daniel-analisis** | `pfi-tl-peer-daniel-analisis.md` | Par TL análisis — pre-HITL (A) + post CR arquitectura (B) |
| **@pfi-tl-peer-daniel-implementacion** | `pfi-tl-peer-daniel-implementacion.md` | Par TL implementación — plan (C) + código (D) |
| **@pfi-tl-peer-daniel** | `pfi-tl-peer-daniel.md` | **Alias** → daniel-análisis |
| **@pfi-review-orchestrator** | `pfi-review-orchestrator.md` | Pipeline review: invoca CR analyst + Bugbot |
| **@pfi-cr-analyst** | `pfi-cr-analyst.md` | Análisis exhaustivo — Claude code-review mandatorio |
| **@pfi-patterns-advisor** | `pfi-patterns-advisor.md` | Patrones — **solo** si usuario marca foco en sesión |
| **@pfi-code-reviewer** | `pfi-code-reviewer.md` | **Alias** → @pfi-review-orchestrator |

## Hub y fuentes

| Recurso | Ruta |
|---------|------|
| Mongo scripts | `~/.cursor/iatl-knowledge/` |
| Fuentes TL (par Daniel) | Mongo `knowledge_sources` + `pfi-tl-peer-daniel-analisis/knowledge-sources.seed.json` |
| Fuentes patrones | `pfi-iatl-developer-profile/pattern-sources.json` |
| Memoria viva | `review-learnings.md` (sync Mongo) |

## Skills Cursor integrados

| ID | Cuándo usar |
|----|-------------|
| **review-bugbot** | Paralelo a @pfi-cr-analyst — mismo diff (vía orquestador) |
| **review-security** | Cambios authorizer / secrets / CDK |
| **canvas**, **babysit**, **split-to-prs**, etc. | Según tarea |

## MCP conectados (PFI)

| Servidor | Uso |
|----------|-----|
| **user-jira-pandora-pfi** | Issues Jira Pandora — `jira_get_issue`, `jira_search`, `jira_ping` |
| **user-cloudwatch-aduana** | Logs AWS |
| **plugin-atlassian-atlassian** | Atlassian Cloud (Confluence; no reemplaza Pandora on-prem) |

Resolución automática por número de ticket: skill **`pfi-ticket-source-resolver`**.

## Flujos

| Tarea | Flujo |
|-------|-------|
| Spec-driven + código | Propuesta → @pfi-tl-peer-daniel-analisis (A) → HITL → @pfi-tl-peer-daniel-implementacion (C) → implementar → (D) → @pfi-review-orchestrator → @pfi-cr-analyst (2 .md) + Bugbot → @pfi-tl-peer-daniel-analisis (B) → **@iatl síntesis** → Mongo → usuario OK |
| Foco patrones en sesión | @iatl → @pfi-patterns-advisor → debate → implementar |
| Review PR / rama | Validar URL/rama → @iatl → orquestador → CR analyst (2 .md) + Bugbot → Daniel (B) → síntesis @iatl |
| **Triage review externo** | Review pegado + informe dev → evidencia repo → tabla única (FP/aplicable/deuda/diferido) → HITL aplicar → regenerar CR con cerrados |
| **Sesión multi-ticket** | Guardar Mongo → checkout rama → trabajo → pausar/cambiar ticket → retomar `query.js --ticket` |
| **QA evidencia cierre** | SQL + curls (body 422) + Jira MCP adjuntos → informe en chat (no commit `docs/`) |

### Rutas por clasificación de ticket

| Tipo | Ruta | Pipeline review |
|------|------|-----------------|
| Bug | Fast | Opcional Bugbot |
| Feature / Refactor | Standard | Si usuario pide review |
| Arquitectura / Investigación | Full | Orquestador + CR + Bugbot + Daniel B |

## Orden de lectura

Ver **`profile-stack.md`**.
