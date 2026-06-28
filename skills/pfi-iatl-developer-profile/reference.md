# Spec IATL — Perfil del desarrollador (pfi-backend-core)

**Versión:** 1.6  
**Alcance:** Toda interacción del desarrollador en `pfi-backend-core`  
**Activación:** Skill personal `~/.cursor/skills/pfi-iatl-developer-profile/SKILL.md` (solo IDE, no en repo)  
**Visión:** IATL agnóstico de IDE (Cursor, VSCode+Claude Code, Antigravity, Docker) — ver §3.3

---

## 1. Propósito

Este spec define el perfil operativo del desarrollador y el protocolo **IATL** (*Interactive Agent-to-Loop*, variante HITL). El agente debe usarlo como marco de debate antes de cambios estructurales y como restricciones hard en ejecución.

---

## 2. Perfil técnico

| Dimensión | Detalle |
|-----------|---------|
| **Rol en equipo** | **Full Stack Senior** (IC) — no TL orgánico; @pfi-tl-peer-daniel-analisis + @pfi-tl-peer-daniel-implementacion simulan par TL en el flujo IATL |
| Repo | `pfi-backend-core` (Arkho / PFI) |
| Stack | Node.js, TypeScript, NestJS en AWS Lambda |
| Arquitectura | Hexagonal/clean: domain → application → infrastructure/presentation |
| Calidad | ESLint selectivo, Jest `--findRelatedTests`, SOLID custom, orden algorítmico |
| Herramientas | Husky pre-commit, skills PFI, canvas para auditorías |
| Git | Jira PFI-XXXX, `conflict_resolutions/*`, releases de integración |

### Lambdas de trabajo (alcance permitido)

- `lambda-casos`
- `lambda-documento`
- `lambda-marcaje-manual`
- `lambda-marcas-selectividad`
- `lambda-clave-unica`

**Adyacentes bajo ticket explícito:** `lambda-keycloak`, `lambda-denuncias` (mismo criterio hexagonal; CDK solo si el ticket lo incluye).

### Fuera de alcance (no tocar salvo pedido explícito)

- `lambda-eventos*` y consumidores SAS
- `lambda-pfi-authorizer`
- `lambda-secrets`
- CDK / `lib/`

### Convenciones Git

- Feature: `pfi-{TICKET}/feature/{slug}` desde **main**
- Conflicto: `conflict_resolutions/{develop\|qa}/pfi-{TICKET}/...`
- Release: `release-{slug}`
- En conflict branches: no subir `docs/` ni scripts operativos bajo `scripts/`
- Alineación develop ↔ qa por ticket; alineación entre tickets distintos → otra instancia

### Estándares de código

1. SOLID estricto (DIP entre capas prioritario)
2. Domain sin Nest, TypeORM ni imports de infra
3. Application sin DTOs de presentation ni adapters concretos
4. Paridad funcional en refactors (no negociable)
5. Diff mínimo; sin over-engineering
6. Pre-commit: solo archivos/líneas **staged**
7. Auditoría repo completa: solo canvas/reportes, no gate de commit
8. **Naming:** clases con sufijo según capa (ver §2.1)
9. **JSDoc:** métodos públicos con `@method`, `@description`, `@param` (uno por parámetro), `@returns` y `@throws` cuando aplique; controllers con `@class` (ver §2.5 y §2.5.1)

### 2.1 Naming de clases — sufijos obligatorios

Patrón general: **`{PrefijoDescriptivo}{Sufijo}`** — el prefijo identifica el caso de uso o bounded context; el sufijo identifica el rol hexagonal.

| Sufijo | Capa | Tipo | Convención archivo | Ejemplo válido |
|--------|------|------|-------------------|----------------|
| `Controller` | presentation | clase | `*.controller.ts` | `CasosController` |
| `Usecase` | application | clase | `*.usecase.ts` | `CrearCasoSelectividadUsecase` |
| `Gateway` | domain | interface/type | `*.gateway.ts` | `CasosListarQueriesGateway` |
| `ApplicationInput` | application | type (DTO interno) | `*.application-input.ts` | `ActualizarCasoSelectividadApplicationInput` |
| `Repository` | infrastructure | clase (impl) | `*.repository.ts` | `PersonaInvolucradaListadoPostgresRepository` |
| `QueryAdapter` | infrastructure | clase (lectura) | `*.query.adapter.ts` | `PersonasListarPorCasoQueryAdapter` |
| `PersistenceAdapter` | infrastructure | clase (escritura) | `*.persistence.adapter.ts` | `PersonaPersistenceAdapter` |
| `Adapter` | infrastructure | clase (genérico) | `*.adapter.ts` | `CasosListarPostgresAdapter` |
| `DomainService` | domain | clase | `*.domain-service.ts` | `PersonasInvolucradasLegacyGetDomainService` |
| Assembler | domain | funciones puras | `*.assembler.ts` | `assemblePersonasInvolucradasLegacyGetList` |
| `ExecutionContext` | application | clase | `*.execution.context.ts` | `PersonasConsultaExecutionContext` |

**Contratos en domain (sin implementación):**

- Gateway: `export interface FooGateway { ... }`
- Repository (puerto): `*InterfaceRepository` en `domain/repositories/` cuando el nombre lo requiera (ej. `MarcajeGuardarInterfaceRepository`)

**Anti-ejemplos (no crear en código nuevo):**

| Incorrecto | Correcto |
|------------|----------|
| `ListarCasosService` (application) | `ListarCasosUsecase` |
| `CasosListarPostgres` (infra) | `CasosListarPostgresAdapter` |
| `PersonasListarPorCasoPersistenceAdapter` (solo lectura) | `PersonasListarPorCasoQueryAdapter` |
| Gateway que solo orquesta listado + satélites + mapper | `PersonasInvolucradasLegacyGetDomainService` |
| Mapper legacy en adapter de infra | `*.assembler.ts` en domain + QueryAdapters delgados |
| `TrazaCasoService` (domain) | `TrazaCasoDomainService` |
| `CrearCasoInput` (application) | `CrearCasoSelectividadApplicationInput` |
| `CasosHandler` (infra) | `CasosListarPostgresAdapter` o gateway en domain |

**Alcance del agente:**

- Código **nuevo** y refactors: cumplir siempre.
- Legacy: no renombrar masivamente; alinear sufijo si el archivo ya está en stage por otra tarea.
- **QueryAdapter** solo para consultas; **PersistenceAdapter** solo para escritura. No mezclar semántica.
- Specs, módulos Nest (`*.module.ts`), DTOs HTTP de presentation, entities y excepciones: sufijos propios (`*.spec.ts`, `*Dto`, `*Exception`) — fuera de esta tabla salvo que el usuario pida unificar.

### 2.2 Arquitectura hexagonal — reglas de orquestación

Patrón de referencia para flujos GET legacy en `lambda-casos`:

```text
Controller
  └─ Usecase (secuencial, sin Promise.all cosmético)
       └─ ExecutionContext.runConsultaScoped()   ← AsyncLocalStorage, DataSource único
            ├─ QueryAdapter → Repository (1 entidad, 1 adapter)
            ├─ DomainService (orquesta N gateways + assembler)
            └─ Assembler en domain (contrato legacy, sin IO)
```

| Capa | Responsabilidad | Prohibido |
|------|-----------------|-----------|
| **Usecase** | Secuencia de pasos; inyecta abstracciones y DomainServices | Mapeo legacy, `getRepository()`, `Promise.all` cosmético |
| **DomainService** | Orquestar gateways relacionados (ej. personas → ids → documentos → ensamblado) | Resolver DataSource, TypeORM, logs de error de infra |
| **QueryAdapter** | `resolveDataSource()` + delegar al repository + log error | Orquestar otros gateways, ensamblar JSON legacy |
| **PersistenceAdapter** | Escritura transaccional (insert/update) | Usar para operaciones GET/listar |
| **Assembler** | Funciones puras: entidades + catálogos → contrato legacy | Imports de infra, Nest, TypeORM |
| **Gateway** | Puerto pequeño por entidad/consulta (ISP) | Mega-gateway; gateway que solo envuelve orquestación |
| **Repository** | Query/Command 1:1 con entidad | Repositorio monolítico multi-entidad |

**ExecutionContext de consulta:** cuando un GET comparte conexión entre varios QueryAdapters, usar `AsyncLocalStorage` en application (`PersonasConsultaExecutionContext`) con entidades scoped en constantes de domain. Los QueryAdapters resuelven DataSource vía context, no abren conexiones propias.

**Catálogos legacy:** un DomainService orquesta N gateways de catálogo (1 entidad c/u) y un assembler arma los `Map` de glosas. No un solo repository/adaptador monolítico.

**Ensamblado GET legacy:** mapper de contrato en `domain/personas/*.assembler.ts`. Infra mapper puede re-exportar aliases `@deprecated` durante migración.

**Async:** secuencial por defecto. En lecturas del **mismo agregado/caso**, preferir **1 query TypeORM** con joins (patrón expediente generación documental) antes que `Promise.all` entre queries paralelas. `Promise.all` solo si ramas verdaderamente independientes y unificar SQL aumentaría riesgo (ver `legacy-migration` §4).

**Tests domain:** `new DomainService(mockGateway, ...)` — sin `Test.createTestingModule` para la clase bajo prueba.

### 2.3 Patrones de diseño — criterio del equipo (Strategy / Command)

Un componente **solo** es Strategy o Command si cumple **ambas** premisas:

| # | Premisa (equipo PFI) | Fuente |
|---|----------------------|--------|
| **P1** | Debe poder implementarse **algoritmos diferentes** bajo la **misma necesidad** / mismo contrato. | GoF Strategy: *"Define a family of algorithms"*; GoF Command: solicitudes encapsuladas **sustituibles**. |
| **P2** | Debe poder **intercambiar** esas implementaciones en **runtime** sin romper al cliente. | GoF Strategy: *"make them interchangeable"*; GoF Command: *"parameterize clients with different requests"*. |

Si falla P1 o P2 → **no** usar el nombre Strategy/Command. Nombrar el patrón real: pipeline, registry, transaction script, pasos condicionales, etc.

**Fuentes de referencia:**

- Gamma, Helm, Johnson, Vlissides — *Design Patterns: Elements of Reusable Object-Oriented Software* (1994): Strategy (p. 315), Command (p. 233).
- [Refactoring.Guru — Strategy](https://refactoring.guru/design-patterns/strategy), [Command](https://refactoring.guru/design-patterns/command).
- Fowler — *Patterns of Enterprise Application Architecture*: Registry (mapa clave → implementación); Transaction Script (pasos secuenciales sin intercambio).

**Strategy bien aplicado:** el contexto delega en **una** implementación elegida en runtime (ej. `CompressionStrategy` intercambiable vía inyección).

**Command bien aplicado:** solicitud como objeto + Invoker; sustitución de comandos; opcional cola/undo.

**Anti-ejemplo PFI (Strategy):** ejecutar un array fijo de clases en serie (`for (const step of steps)`) — es **pipeline**, no Strategy, aunque la carpeta se llame `strategies/`.

**Anti-ejemplo PFI (Command):** instanciar pasos con `new` + `ejecutar()` en serie, sin Invoker — es **script**, no Command, aunque la carpeta se llame `commands/`.

**Violación de naming (general):** el nombre debe revelar capa y rol (reference §2.1). Anti-ejemplos: `*Facade` en lugar de `*Adapter`, `*Lector`/`*Insertor` sin QueryAdapter/PersistenceAdapter, `*Service` de negocio en infra en lugar de `*DomainService`, gateway importando DTO de presentation, `coordinadores/` como capa paralela.

**Violación de naming (GoF):** reservar `Strategy`/`Command` solo con intercambio runtime (P1+P2). Si no: `Paso*`, `pasos-insercion/`, `Registry*`.

### 2.4 Code review de PR (obligatorio)

Ante **cualquier** review de PR, rama o diff de merge:

1. Leer skill **`pfi-pr-code-review`** (`~/.cursor/skills/pfi-pr-code-review/SKILL.md`) **antes** de analizar.
2. Alcance **cerrado** al PR indicado: diff `base...HEAD`, checkout de rama head, sin mezclar otros tickets.
3. Complementar con **`review-bugbot`** (skill Cursor) para bugs/regresiones en el mismo diff.
4. Entregable Markdown: paginación (con ejemplo numérico si hay joins), patrones (tabla intercambio + fuentes), DRY, checklist, veredicto.
5. No commitear fixes del review salvo pedido explícito.

### 2.5 JSDoc — métodos públicos

Plantilla obligatoria en gateways, repositories, adapters, domain services, usecases y assemblers exportados:

```typescript
/**
 * @method nombreMetodo
 * @description Qué hace el método.
 *
 * @param dataSource - El DataSource para las entidades.
 * @param numeroCaso - El número de caso.
 * @returns Qué devuelve.
 * @throws {@link IdentificacionCasoInfraException} - Si ocurre un error al consultar.
 */
```

Reglas:
- Un `@param` por cada parámetro del método (omitir solo si no tiene parámetros).
- `@throws` en capas que traducen errores (`QueryAdapter`, `DomainService`); opcional en repositories puros (propagan error TypeORM).
- Funciones puras en assemblers: `@function` + `@param` + `@returns`.

#### 2.5.1 JSDoc — clases `*Controller`

Plantilla obligatoria en la **clase** de cada `*.controller.ts`:

```typescript
/**
 * @class CasosController
 * @description Controlador HTTP del bounded context casos.
 *
 * Expone endpoints de gestión operativa (listado, selectividad, trazas, reasignación, expediente documental).
 * Delega en casos de uso de application; contrato OpenAPI en decoradores `@Api*` y DTOs de presentation.
 */
```

Reglas:
- **`@class`:** nombre exacto de la clase exportada.
- **Un solo `@description`:** título corto (bounded context + capa HTTP). **Prohibido** repetir `@description` ni afirmar que el controller implementa lógica de negocio o persistencia.
- **Cuerpo (texto libre):** alcance funcional (qué expone) + recordatorio de delegación en UseCases y Swagger en `@Api*`.
- **Handlers HTTP:** bloque JSDoc antes de `@Get`/`@Post`/… con ruta efectiva, `@method`, `@description`, `@param` por argumento del handler y `@returns` (ver ejemplo en `CasosController.obtenerExpedienteGeneracionDocumental`).

### 2.6 Aprendizajes consolidados (desde review-learnings)

Lecciones promovidas desde `review-learnings.md` tras poda semanal. **Fuente viva:** ver `review-learnings.md`; **stack de perfil:** `profile-stack.md`.

- Post spec-driven: gate @pfi-code-reviewer + Bugbot antes de confirmar código.
- Endpoints HTTP nuevos: validación runtime con `pfi-qa-api-curls` (status + contrato + **bodies de validación 422**).
- Swagger requiere controller en módulo; tag único por bounded context.
- Ramas: alinear feature + conflict develop + conflict qa por ticket (Swagger ≠ lógica).
- Lambda: unificar entidades DataSource en la misma invocación; 404 de negocio no → 500.
- Review externo vs informe dev: triage obligatorio antes de aplicar hallazgos (§3.2).
- Commits agente: `commit-tree` + quitar `Co-authored-by`; push conflict con `PFI=ADUANAS` si usuario pide omitir husky.
- Sesión multi-ticket: persistir en hub Mongo al pausar/cambiar ticket; no commitear `docs/`.

**Última poda review-learnings:** 2026-06-23

---

## 3. Perfil de interacción (IATL)

### Estilo operativo (2026-06-23)

El desarrollador **no usa el agente como chat genérico**: es la capa de proceso sobre el hexágono backend. Toda interacción asume skills PFI cargados, estándares internalizados (sin recordatorios) y capacidad de **orquestar varios tickets en un día** con pausa/guardado explícito.

Patrones recurrentes:

| Patrón | Comportamiento esperado del agente |
|--------|----------------------------------|
| Instrucciones numeradas | Ejecutar en orden; no mezclar pasos de tickets distintos |
| Cambio de ticket | Guardar sesión Mongo → checkout rama → consultar hub `--ticket` |
| Cierre de sesión / feedback | Al cerrar con `close-ticket.js`, recopilar las `reasoningCorrections` para persistirlas en Mongo y `review-learnings.md` |
| Review de PR | Validar **URL/rama correcta** antes del diff; Bugbot en paralelo |
| Triage de review externo | Tabla única; no implementar hasta clasificar |
| Evidencia Jira/QA | SQL + curls completos + adjuntos MCP para cerrar historias |
| Backlog spec-driven | Listas punto a punto: pendiente vs resuelto; solo backend |
| Push en conflict | `PFI=ADUANAS` + commit sin Co-authored-by + 3 ramas alineadas |

### Preferencias

| Preferencia | Comportamiento del agente |
|-------------|---------------------------|
| Idioma | Español siempre |
| Ejecución | Investigar y actuar; no solo sugerir comandos |
| Aprobación | Borradores/specs para OK antes de cambios grandes |
| Git | No commit, push ni PR sin pedido explícito; estándar PFI **automático** al commitear |
| Alcance | Respetar exclusiones de lambdas/zonas |
| Formato | Prosa clara; listas numeradas; canvas para datos densos |
| Debate | Opciones + trade-offs; el desarrollador decide |
| Estándares | Nunca pedir confirmación de formato commit/rama si ya están en skills |

### 3.1 Modos de sesión y clasificación de ticket

Inferir modo al inicio o ante ambigüedad. **No mezclar modos en el mismo turno sin OK.**

| Modo | Trigger típico | Entregables | Git |
|------|----------------|-------------|-----|
| **debate** | *analicemos*, *sin código*, spec-driven inicial | Propuesta, backlog, tablas triage | Prohibido |
| **implementación** | *implementemos*, fix tras triage | Código, tests, diff mínimo | Commit solo si pide |
| **operación** | *llevame*, *sube*, *guarda sesión*, curls QA | Checkout, push, ingest Mongo | Según pedido |

**Clasificación de ticket** (ajusta profundidad y tokens):

| Tipo | Ruta IATL | Análisis |
|------|-----------|----------|
| **Bug** | Fast | Diff acotado → fix → tests relacionados |
| **Refactor / Feature** | Standard | Debate si arquitectura → implement → review si pedido |
| **Arquitectura / Investigación** | Full | Debate extendido → orquestador → CR analyst + Bugbot → Daniel B |

Registrar tipo en hub Mongo al abrir sesión (`ingest.js session`).

### 3.2 Triage de code review (reviews externos)

Cuando el desarrollador pega un **review consolidado** (automatizado, otro revisor, o informe previo propio) y pide contrastar:

1. **Verificar en repo** cada hallazgo (no confiar en el texto del review).
2. **Clasificar** en una **sola tabla**:

| ID | Hallazgo | Categoría | Por qué | Acción |
|----|----------|-----------|---------|--------|
| … | … | `falso positivo` \| `aplicable` \| `deuda preexistente` \| `diferido` | evidencia código/BD/runtime | commit / backlog / descartar |

3. **Categorías:**
   - **falso positivo** — review incorrecto o sobredimensionado (ej. `null`≈`undefined` en INSERT PG; breaking change intencional reportado como bug).
   - **aplicable** — defecto real o mejora acordada; implementar en el ticket actual.
   - **deuda preexistente** — existía antes de la intervención del desarrollador; documentar, no mezclar con culpa del PR.
   - **diferido** — válido pero fuera de alcance del PR (Swagger, QA monolito, chore futuro).

4. Si pidió **solo análisis** → entregar tabla/listas; **cero código**.
5. Tras aplicar ítems → **regenerar** `CODE-REVIEW-PFI-XXXX.md` con tabla de hallazgos **cerrados** (ID, commit, estado).
6. Informes en `docs/spec-driven/` — **local, no commit** salvo pedido explícito.

### 3.3 Visión IATL agnóstico de IDE

Objetivo de evolución (no bloqueante hoy):

- **CLI setup** (`~/.cursor/iatl-knowledge/setup-agent.js`): detectar IDE, instalar skills/agentes en Cursor | VSCode+Claude Code | Antigravity | Docker.
- **Hub portable:** Mongo + Chroma como fuente de verdad operativa; `reference.md` reglas estables.
- **Repo arquitectura:** `pfi-agent-architecture` espejo de working_branches y documentación multi-IDE.
- **Fast/Standard/Full** + clasificación de ticket → reducir tokens sin bajar calidad en tickets complejos.

Nombre canónico: **IATL — Interactive Agent-to-Loop**. Alias internos: *PFI Agent Mesh* (subagentes), *Spec-Driven HITL Loop* (proceso).

### Señales operativas

- *"En otra instancia llevo eso"* → no insistir; cambiar contexto
- *"Solo dame el escrito y te apruebo"* → diseño only, sin código
- *"No rompamos funcionalidad"* → tests relacionados + paridad
- *"Actualiza los canvas"* → re-auditar y regenerar artefactos visuales
- *"Es análisis / no cambies código"* → modo debate; tablas triage únicamente
- *"Sube bajo nuestro estándar"* → `pfi-commit-message-format` + sin Co-authored-by + excluir `docs/`
- *"Guarda sesión / pausa / vuela a PFI-XXXX"* → hub Mongo + checkout; retomar con contexto ticket
- *"Listame punto a punto"* → listas numeradas (backlog, pendiente/resuelto)
- *"¿En qué tenemos razón?"* → triage §3.2 contra review externo + código
- Comandos cortos → acción directa, respuesta concisa
- PR equivocado revisado → corregir rama/URL de inmediato; no defender análisis erróneo

### Anti-patrones

- Commits/pushes proactivos
- Tocar zonas excluidas
- Refactors cosméticos o abstracciones innecesarias
- Respuestas genéricas sin datos del repo
- Mezclar dashboard y detalle en un canvas cuando pidió separación
- Asumir alineación de ramas sin `git diff`

---

## 4. Protocolo IATL (modo debate)

### Cuándo activar debate

- Ideas nuevas, priorización, arquitectura
- Refactors amplios (domain, múltiples lambdas)
- Cambios al pre-commit o reglas SOLID
- Cualquier propuesta con riesgo de romper paridad funcional

### Cuándo ejecutar directo

- "Corrígelo", "actualiza canvas", "muéveme a rama X"
- Tareas acotadas ya aprobadas en la conversación
- Auditorías y listados bajo reglas existentes

### Formato de propuesta en debate

```markdown
## Propuesta
[Qué y por qué]

## A favor
- ...

## En contra / riesgos
- ...

## Impacto en alcance
- Lambdas: ...
- Exclusiones respetadas: sí/no

## Alternativas
A) ...  B) ...

## Recomendación
[Una línea, no impuesta]

## Tu decisión
[Esperar OK, ajuste o rechazo]
```

---

## 5. Contexto de trabajo activo

### Sesiones recientes (2026-06-23)

| Ticket | Estado sesión | Notas |
|--------|---------------|-------|
| **PFI-1228** | Triage + fixes aplicados | POST persona paridad legacy; 3 ramas alineadas |
| **PFI-1238** | Implementación + QA curls | Marcaje manual; índice único `uuid_correlacion`; informe unificado |
| **PFI-1120** | Pausada / activa alternada | Oficio fiscalía draft; `ResultadoEntity` scope; articulado + número oficio |
| **PFI-1047** | Review PR #261 | Keycloak SSO — paridad roles EXT vs Clave Única |
| **PFI-1131** | Reabierta | Fecha ocurrencia MS en denuncia; evidencias dev/qa |
| **IATL meta** | Roadmap | Evaluación multiagente 8.3/10; CLI multi-IDE; métricas; Fast Path |

### Code review activo

Últimos informes locales (no en repo): PFI-1228, PFI-1238, PFI-1047 — ver `docs/spec-driven/CODE-REVIEW-PFI-*.md`.

### Rama principal (chore pre-commit)

`pfi/chore/precommit-selective-tests-solid-rules`

### Pre-commit (estado acordado)

1. ESLint en `.ts` staged (`--max-warnings=0`)
2. SOLID + orden algorítmico (staged + líneas tocadas)
3. Jest `--findRelatedTests` + specs staged + `.module.spec` si aplica

**Reglas SOLID:** DIP-001, DIP-002, DIP-003, ISP-001, SRP-001  
**Complejidad algorítmica:** prohibido O(n³)+, recursión ramificada, recursión en bucles

### Auditoría repo (última referencia)

| Métrica | Valor |
|---------|------:|
| Violaciones totales | 70 |
| `.ts` fuente (lambdas trabajo) | 0 |
| Pendiente real | commons entities (~47) + `.d.ts` stale |

Evolución: 293 → 220 → 204 → 152 → 70

**Canvas (IDE, no repo):**

- `canvases/pfi-precommit-*`
- `canvases/pfi-complejidad-*`

Fuente de datos: `node scripts/pre-commit-audit-repo.cjs --json`

### Backlog pendiente

| Prioridad | Item |
|-----------|------|
| Alta | DIP-001 en **commons** (entities TypeORM en domain) |
| Media | Ciclomática/cognitiva en pre-commit (discutido, no implementado) |
| Media | Secret scan, coverage en CI (no pre-commit) |
| Baja | Limpiar `.d.ts` stale en disco |

---

## 6. Restricciones del agente

**Prohibido** (salvo instrucción explícita):

- Commit, push, PR
- Tocar eventos/SAS, authorizer, secrets, CDK
- Refactor domain/application sin plan aprobado
- Implementar sugerencias de pre-commit no aprobadas
- Responder en inglés
- Subir perfil IATL al repo (solo `~/.cursor/skills/`)

**Obligatorio**:

- Ejecutar auditorías al pedir canvas o métricas
- Respetar staged-only en pre-commit vs repo-wide en auditoría
- Tests relacionados tras fixes SOLID
- Formato de rama PFI estándar al proponer branches

---

## 7. Glosario

| Término | Significado |
|---------|-------------|
| IATL / HITL | Agente propone → desarrollador aprueba → agente ejecuta |
| Lambdas de trabajo | casos, documento, marcaje-manual, marcas-selectividad, clave-unica |
| Staged-only | Pre-commit analiza solo lo que va en el commit |
| Paridad funcional | Comportamiento API idéntico post-refactor |
| QueryAdapter | Adapter de infraestructura solo lectura (`*.query.adapter.ts`) |
| PersistenceAdapter | Adapter de infraestructura solo escritura (`*.persistence.adapter.ts`) |
| Assembler | Funciones puras en domain que arman contratos legacy sin IO |
| ExecutionContext | Scope AsyncLocalStorage de DataSource para GETs multi-adapter |

---

## 8. Mantenimiento

- **Contexto activo:** sección 5 — única fuente; no duplicar en `SKILL.md`.
- **Profile stack:** `profile-stack.md` — orden de lectura idéntico para @iatl y @pfi-code-reviewer.
- **Poda semanal:** `review-learnings.md` § Mantenimiento — archivar a `review-learnings-archive-YYYY-MM.md`, promover estables a §2.6.
- **Catálogo:** actualizar `skills-catalog.md` al añadir skills en `~/.cursor/skills/`.
- **Alcance:** solo `~/.cursor/` local del desarrollador/equipo — **no subir al repo**.

Para otra máquina del mismo equipo, sincronizar:

- `~/.cursor/agents/iatl.md`
- `~/.cursor/agents/pfi-code-reviewer.md`
- `~/.cursor/skills/pfi-iatl-developer-profile/` (completo)
- `~/.cursor/skills/pfi-spec-driven-code-review/SKILL.md`
