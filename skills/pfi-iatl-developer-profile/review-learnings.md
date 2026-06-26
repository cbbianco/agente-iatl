# Aprendizajes acumulados — agentes IATL → hub Mongo + @iatl

Archivo vivo (vista humana). **Índice consultable:** `~/.cursor/iatl-knowledge/` (Mongo `learnings`).

**Máximo ~30 bullets activos.** @iatl, @pfi-review-orchestrator y @pfi-cr-analyst leen vía `profile-stack.md` + `query.js --active-learnings`.

---

## Mantenimiento semanal ( @iatl — obligatorio )

**Cuándo:** cada 7 días desde la última poda, o cuando este archivo supere **30 bullets**, lo que ocurra primero.

**Proceso (sin pedir permiso al usuario):**

1. Agrupar bullets por categoría (Operación, Swagger, Lambda, Spec-driven, Runtime).
2. **Consolidar** reglas que se repiten o que ya están en `reference.md` → eliminar duplicados de este archivo.
3. **Promover** lecciones estables (≥2 repeticiones o regla general) → añadir párrafo breve en `reference.md` §2.6 Aprendizajes consolidados.
4. **Archivar** el resto en `review-learnings-archive-YYYY-MM.md` (mismo directorio) con fecha y tickets origen.
5. Dejar aquí solo bullets **activos** de la semana corriente + reglas aún no promovidas.
6. Registrar en `reference.md` § Mantenimiento: `Última poda: YYYY-MM-DD`.

**Meta:** este archivo siempre legible en una pasada (~15–30 líneas útiles).

---

## Operación y ramas

- Alinear **feature + conflict_resolutions/develop + conflict_resolutions/qa** por ticket; Swagger ≠ lógica — comparar diff funcional en `lambda-*`.
- PFI puede estar en ramas conflict pero no en develop/qa main hasta merge — validar despliegue vs rama mergeada.
- En ramas conflict: no subir `docs/` ni scripts bajo `scripts/` salvo pedido explícito.
- Commits agente: preferir `commit-tree` + `reset --hard` para evitar `Co-authored-by` del IDE.
- **PFI-1215 lambda-casos (2026-06-24):** no mezclar alcances en una rama — `fix/obtener-caso-selectividad` = solo `GET /casos/selectividad/{numero}` (~12 archivos); `feature/expediente-generacion-documental-casos-selectividad` = migración expediente aparte. Slug prohibido: combinar selectividad+expediente (`caso-selectividad-expediente-documental`).
- **Antes de push:** `git diff --stat origin/develop...HEAD` + listar endpoints tocados; confirmar ticket Jira en path de rama (personas bajo **1215**, no 1025, salvo ticket distinto).
- **Un PR = un alcance.** No abrir PRs proactivos; push/commit solo con OK explícito del usuario.
- **Prefijos rama vs commit:** `fix/` → `fix:` (hotfix/comportamiento); `update/` → `update:` (PG secuencial IE); `feature/` → `feature:` (endpoint nuevo expediente, draft documento).
- **Terminología:** *ambiente dev* = API Gateway `/dev/` para curls; *rama git qa* = `conflict_resolutions/qa/*` sobre `origin/qa`. No decir "QA" cuando se habla del ambiente de pruebas HTTP.
- **Backlog usuario:** funcional primero (E4 paridad, curls dev), ramas/integración después; lista única con ✅/🔲.
- **CDK + git push:** no correr `cdk deploy` en paralelo con `git push` (pre-push ejecuta `build:all`; race ENOENT en `consumer-sas-dlq/dist/*.js.map`). Rebuild workspace antes de redeploy.

## Swagger vs runtime

- Registrar controller en `*.module.ts` — sin eso Swagger y rutas no existen.
- Un solo controller dueño por tag (evitar POST/PUT duplicados Casos vs PersonasInvolucradas).
- DocumentBuilder global (`base-lambda-handler.ts`) debe incluir tag de endpoints nuevos.

## Lambda / NestJS

- DataSource cacheado: unificar `DATASOURCE_ENTITIES` en la misma invocación (evitar "No metadata for XEntity").
- 404 de negocio: repropagar en usecase, no convertir en 500.
- Canal EXTERNAL vs INTERNAL: validador/SQL/Swagger separados; no alterar INTERNAL al habilitar EXTERNAL.

## Spec-driven y review

- Post spec-driven: **siempre** @pfi-review-orchestrator → @pfi-cr-analyst (Claude code-review mandatorio) + Bugbot antes de confirmar con usuario.
- Veredicto NO APTO del CR analyst bloquea commit hasta corrección o excepción explícita.
- Validación runtime (curl) obligatoria si el ticket expone endpoints HTTP — skill `pfi-qa-api-curls`; incluir **bodies** que disparen 422/validación.
- Hub Mongo: persistir learnings con `~/.cursor/iatl-knowledge/ingest.js`; consultar al arrancar sesión con ticket.
- @pfi-patterns-advisor solo si el usuario marca foco patrones — no en cada review.
- **Triage review externo:** contrastar informe dev + review automatizado + código; tabla única (falso positivo | aplicable | deuda preexistente | diferido); *"es análisis"* = cero código.
- Tras aplicar hallazgos: regenerar CODE-REVIEW con tabla de ítems **cerrados** (ID, commit, estado).
- Review PR: validar URL/rama **antes** del diff (evitar revisar PR equivocado por rama local activa).

## Orquestación y sesiones (2026-06-23)

- Modos explícitos: **debate** (sin git) · **implementación** (código+tests) · **operación** (ramas, push, curls, guardar sesión).
- Multi-ticket: `ingest.js session` + `working_branch` al pausar/cambiar; retomar con `query.js --ticket`.
- Instrucciones numeradas del usuario = ejecutar en orden; no mezclar tickets en un commit.
- *"Sube bajo nuestro estándar"* = commit Markdown + `commit-tree` sin Co-authored-by + `PFI=ADUANAS` si omite husky + alinear feature + conflict develop + conflict qa.
- Evidencias cierre ticket: SQL verificación BD, curls runtime, Jira adjuntos/comentarios (MCP).
- Backlog spec-driven: solo alcance backend; listas pendiente/resuelto punto a punto.
- Clasificación ticket (Bug/Refactor/Feature/Arquitectura/Investigación) → Fast/Standard/Full para ahorrar tokens.
- IATL objetivo agnóstico IDE: setup-agent multi-target (Cursor, VSCode, Antigravity, Docker).

---

<!-- Nuevas entradas: categoría + YYYY-MM-DD + PFI-XXXX. @iatl podará semanalmente. -->
