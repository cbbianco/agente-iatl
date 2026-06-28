---
name: pfi-iatl-developer-profile
description: >-
  Perfil IATL del desarrollador para pfi-backend-core: orquestación multi-ticket vía
  agente (modos debate/implementación/operación), triage de reviews externos, sesiones
  Mongo, evidencias SQL/curl/Jira, estándares PFI sin recordatorios. SOLID, pre-commit
  staged, español, sin commit/push proactivos. CR: orquestador → CR analyst + Bugbot;
  2 .md + gate Daniel análisis (B) + Daniel implementación (C/D). Objetivo: IATL agnóstico de IDE. Usar en pfi-backend-core.
---

# Modo IATL — Perfil del desarrollador (pfi-backend-core)

**Síntesis ejecutiva.** Spec completo: `reference.md`. Stack de lectura: `profile-stack.md`.

| Recurso | Archivo |
|---------|---------|
| **Stack de perfil (fuente única)** | `profile-stack.md` |
| Spec completo + contexto activo | `reference.md` |
| Catálogo skills + agentes | `skills-catalog.md` |
| Memoria viva (poda semanal) | `review-learnings.md` |
| **Orquestador** | `~/.cursor/agents/iatl.md` → **@iatl** |
| **Par TL análisis (pre-HITL + post CR)** | `~/.cursor/agents/pfi-tl-peer-daniel-analisis.md` → **@pfi-tl-peer-daniel-analisis** (alias `@pfi-tl-peer-daniel`) |
| **Par TL implementación (plan + código)** | `~/.cursor/agents/pfi-tl-peer-daniel-implementacion.md` → **@pfi-tl-peer-daniel-implementacion** |
| **Review orquestador** | `~/.cursor/agents/pfi-review-orchestrator.md` → **@pfi-review-orchestrator** |
| **CR dedicado** | `~/.cursor/agents/pfi-cr-analyst.md` → **@pfi-cr-analyst** |
| **Patrones** | `~/.cursor/agents/pfi-patterns-advisor.md` → **@pfi-patterns-advisor** |
| **Hub Mongo** | skill `pfi-iatl-knowledge-hub` → `~/.cursor/iatl-knowledge/` |

En chat general: aplica restricciones de este skill. Para spec-driven completo o gate de review: **@iatl** (orquesta par TL → orquestador → CR analyst + Bugbot + síntesis).

## Quién es el desarrollador

**Full Stack Senior** en PFI (Arkho) — rol formal de equipo; no TL orgánico. NestJS + lambdas hexagonales. Opera **todo el ciclo vía agente IATL** — no chat suelto: skills, subagentes, hub Mongo y estándares PFI son parte del flujo diario. Prefiere ciclos **propuesta → debate → aprobación → ejecución**, con **sesiones multi-ticket** (pausar, guardar, cambiar rama/ticket sin perder contexto). Español siempre. No commits/push/PR proactivos. **No recordarle estándares** que ya están en skills (commits Markdown, ramas, Co-authored-by, husky).

## Alcance

**Lambdas de trabajo:** `lambda-casos`, `lambda-documento`, `lambda-marcaje-manual`, `lambda-marcas-selectividad`, `lambda-clave-unica`

**No tocar** salvo pedido explícito: eventos/SAS, authorizer, secrets, CDK/lib

## Estándares no negociables

- SOLID estricto (DIP entre capas)
- Domain sin Nest/TypeORM/infra
- Application sin DTOs de presentation ni adapters concretos
- Paridad funcional en refactors + tests relacionados
- Diff mínimo; sin over-engineering
- Pre-commit: solo staged; auditoría repo = canvas/reportes
- Specs domain sin Nest DI: `new Service(mockDeps)`, no `Test.createTestingModule` con la clase real
- DTOs en tests: factory (`createMarcajeManualDtoFixture`), no `as unknown as Dto`
- **Naming de clases:** sufijo obligatorio según capa/rol (ver tabla abajo)
- **Orquestación:** DomainService orquesta gateways; adapters solo IO + error handling
- **Lectura vs escritura:** adapters de consulta → `QueryAdapter`; adapters de persistencia → `PersistenceAdapter`
- **JSDoc:** `@method`, `@description`, `@param` por parámetro, `@returns`, `@throws` en capas que traducen errores (ver `reference.md` §2.5); controllers: `@class` + un `@description` en la clase (ver §2.5.1)
- **Code review PR:** leer skill `pfi-pr-code-review` + `review-bugbot`; alcance solo del PR indicado (ver `reference.md` §2.4)
- **Entregables CR:** siempre `docs/spec-driven/CODE-REVIEW-PFI-XXXX.md` + `docs/spec-driven/ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md`; gate **@pfi-tl-peer-daniel-analisis** modo B + **@pfi-tl-peer-daniel-implementacion** modos C/D antes de síntesis @iatl

## Naming de clases (sufijos obligatorios)

Toda clase exportada debe terminar en el sufijo que corresponde a su capa. El prefijo describe el caso de uso o agregado.

| Rol | Sufijo clase | Capa | Archivo típico | Ejemplo |
|-----|--------------|------|----------------|---------|
| Controller | `Controller` | presentation | `*.controller.ts` | `CasosController` |
| Use case | `Usecase` | application | `*.usecase.ts` | `ListarCasosUsecase` |
| Gateway (contrato) | `Gateway` | domain | `*.gateway.ts` | `PersonasListarPorCasoGateway` |
| Input application | `ApplicationInput` | application | `*.application-input.ts` | `CrearCasoSelectividadApplicationInput` |
| Repository (impl) | `Repository` | infrastructure | `*.repository.ts` | `PersonaInvolucradaListadoPostgresRepository` |
| Adapter lectura | `QueryAdapter` | infrastructure | `*.query.adapter.ts` | `PersonasListarPorCasoQueryAdapter` |
| Adapter escritura | `PersistenceAdapter` | infrastructure | `*.persistence.adapter.ts` | `PersonaPersistenceAdapter` |
| Adapter genérico | `Adapter` | infrastructure | `*.adapter.ts` | `TrazaCasoAdapter` |
| Domain service | `DomainService` | domain | `*.domain-service.ts` | `PersonasInvolucradasLegacyGetDomainService` |
| Assembler (puro) | — (funciones) | domain | `*.assembler.ts` | `assemblePersonasInvolucradasLegacyGetList` |
| Execution context | `ExecutionContext` | application | `*.execution.context.ts` | `PersonasConsultaExecutionContext` |

Reglas:
- Interfaces de gateway/repository en domain: sufijo `Gateway` o `InterfaceRepository` (contrato), nunca implementación concreta en domain.
- **No** usar `PersistenceAdapter` en adapters que solo consultan (GET/listar/catálogo).
- **No** crear gateway solo para orquestar; eso va en `*DomainService`.
- DomainService orquesta; QueryAdapter delega 1:1 al repository; Assembler ensambla contratos legacy sin IO.
- No mezclar sufijos (`*Service` suelto en application, `*Handler` en lugar de `Adapter`/`Gateway` sin acuerdo).
- Código nuevo debe cumplir; legacy se corrige al tocar el archivo.


## Modos de sesión (obligatorio inferir o confirmar)

| Modo | Cuándo | Prohibido |
|------|--------|-----------|
| **debate / spec-driven análisis** | *"solo analicemos"*, *"sin código"*, backlog, contraste reviews | Commits, push, cambios en código |
| **implementación** | *"implementemos"*, fixes tras triage aprobado | Push sin pedido; mezclar tickets en un commit |
| **operación** | *"llevame a"*, *"sube"*, curls QA, alinear ramas, guardar sesión | Refactors amplios no pedidos |

Clasificar ticket al arrancar (reduce tokens): **Bug** → Fast · **Feature/Refactor** → Standard · **Arquitectura/Investigación** → Full (debate + review pipeline completo). Ver `reference.md` §3.1.

## Orquestación multi-ticket

Instrucciones típicas numeradas (`1) … 2) …`). El agente debe:

1. **Guardar sesión** antes de cambiar ticket (`ingest.js session` + `working_branch` en hub Mongo; `SESION-PFI-XXXX.md` solo local, no commit).
2. **Checkout** rama pedida (feature o `conflict_resolutions/{develop|qa}/…`).
3. **Alinear** feature + conflict develop + conflict qa por ticket al subir.
4. **Contrastar reviews** externos vs evidencia repo → tabla única (falso positivo | aplicable | deuda preexistente | diferido). Ver `reference.md` §3.2.
5. **Evidencias** para cerrar tickets: SQL de verificación, curls con body/validaciones, Jira adjuntos/comentarios (MCP).
6. **Cierre de sesión y feedback:** Al cerrar el ticket/sesión con `close-ticket.js`, guardar en el payload `reasoningCorrections` toda corrección lógica o de supuesto que el HITL (usuario) te haya realizado (con `error`, `correction`, y `rule`). Al abrir una nueva sesión, leer activamente estas correcciones en el hub y en `review-learnings.md` para ajustar tu razonamiento y evitar repetir errores de lógica.

Debatir (formato Propuesta/A favor/En contra/Alternativas/Recomendación/Tu decisión) antes de:

- Refactors amplios o cambios de arquitectura
- Nuevas reglas pre-commit o cambios SOLID
- Priorización de deuda técnica
- Cualquier cambio con riesgo de romper funcionalidad

Ejecutar directo cuando diga: corrígelo, actualiza canvas, muéveme a rama, listame, audita.

## Señales del desarrollador

- *"Solo dame el escrito y te apruebo"* → diseño only, sin código
- *"En otra instancia llevo eso"* → no insistir
- *"No rompamos funcionalidad"* → tests + paridad obligatorios
- *"Actualiza los canvas"* → `node scripts/pre-commit-audit-repo.cjs --json` + regenerar canvases
- *"Es análisis, no cambies código"* → modo debate; solo tablas/listas `.md` local
- *"Sube bajo nuestro estándar"* → commit Markdown + `commit-tree` sin Co-authored-by; `PFI=ADUANAS` si pide omitir husky; excluir `docs/`
- *"Sube el fix de X"* → verificar que el diff toca **solo** X (`git diff --stat` + endpoints); no mezclar migraciones del mismo ticket en la misma rama
- *"Listame backlog"* → funcional primero, ramas después; lista única ✅ resuelto / 🔲 pendiente
- *Ambiente dev* vs *rama git qa* → dev = curls `/dev/`; qa = `conflict_resolutions/qa/*` — no intercambiar términos
- *"Guarda sesión / pausa / vuela a X"* → hub Mongo + cambio de rama; retomar con `query.js --ticket`
- *"Listame punto a punto"* → backlog o triage en listas numeradas, no párrafos densos
- *"¿Tenemos razón?"* → triage review: contrastar informe dev + review externo + código; una tabla legible
- Corrige PR/rama si el agente revisó el diff equivocado — validar URL/rama antes de analizar

## Contexto activo

Ver **`reference.md` §5** — no duplicar aquí (evita drift).

## Git PFI

- Feature desde `main`: `pfi-{TICKET}/feature/{slug}`
- Conflict: `conflict_resolutions/{develop|qa}/pfi-{TICKET}/...`
- Commits: **Markdown** — prefijo + bullets + `## Cómo probar` opcional — skill `pfi-commit-message-format`; gate endpoint con usuario; **nunca** `Co-authored-by`
- **Prohibido commitear:** carpeta `docs/` y scripts ad-hoc de QA/prueba — informes solo en chat/Jira/PR
- No asumir alineación de ramas sin evidencia git
